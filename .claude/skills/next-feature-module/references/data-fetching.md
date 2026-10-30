# Data fetching

Contents: 0. Exemplars · 1. ApiClient · 2. Fetchers · 3. Key factory + queryOptions · 4. Server prefetch · 5. Client hooks · 6. Mutations · 7. Proxy & session

## 0. Exemplars — copy the closest one
| Need | Exemplar (under `frontend/src/`) |
|---|---|
| Feature module layout | `features/employees/` — `types.ts`, `api.ts`, `queries.ts`, `mutations.ts`, `params.ts`, `schemas.ts`, `sections/`, `containers/` |
| Server section (prefetch + hydrate) | `features/employees/sections/employees-list-section.tsx` |
| Client container (hooks → organism) | `features/employees/containers/employees-list-container.tsx` |
| Mutation with narrow invalidation | `features/salary-revisions/mutations.ts`, `features/employees/mutations.ts` |
| URL params parse/serialize | `features/employees/params.ts` |
| HTTP clients | `lib/api/server.ts` (`getServerApiClient`), `lib/api/browser.ts` (`browserApiClient`), `lib/api/http.ts` |
| BFF proxy logic (tested) | `lib/api/proxy-handler.ts` (+ `app/api/proxy/[...path]/route.ts`) |

## 1. ApiClient — one interface, two implementations
```ts
// src/lib/api/types.ts
export interface ApiClient {
  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}
```
- `src/lib/api/server.ts` (`import 'server-only'`): `getServerApiClient()` — React-`cache`d per request, base
  `API_URL + '/api/v1'`, `Authorization: Bearer <token from the httpOnly cookie>`.
- `src/lib/api/browser.ts`: `browserApiClient` — base `/api/proxy` (same origin, cookie sent automatically).
- Both are built by `createHttpClient` in `src/lib/api/http.ts`; fetchers accept an `AbortSignal`.
- Both throw `ApiError { status, errors }` on non-2xx so forms can map 422 field errors.

## 2. Fetchers take the client — `src/features/employees/api.ts`
```ts
export async function listEmployees(client: ApiClient, params: EmployeeListParams) {
  const res = await client.get<ListEnvelope<EmployeeResource>>('/employees', params);
  return { employees: res.data.map(flattenResource), meta: res.meta };
}
```
`flattenResource` (`src/lib/jsonapi.ts`) turns `{ id, type, attributes }` into `{ id, ...attributes }`.

## 3. Key factory + queryOptions — `src/features/employees/queries.ts`
Hierarchical keys make invalidation precise (`lists()` hits every page/filter combo, `detail(id)` one record).
```ts
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

export const employeeListQuery = (client: ApiClient, params: EmployeeListParams) =>
  queryOptions({
    queryKey: employeeKeys.list(params),
    queryFn: ({ signal }) => listEmployees(client, params, signal), // aborted when params change
  });
```
Lookups (countries, departments…) use `staleTime: Infinity` — they change on deploy, not per request.

## 4. Server prefetch — inside the Suspense boundary
```tsx
/** Dynamic hole of the /employees page: prefetch on the server, hydrate the client container. */
export async function EmployeesListSection({ searchParams }: EmployeesListSectionProps) {
  const [user, api, rawParams] = await Promise.all([requireUser(), getServerApiClient(), searchParams]);
  const params = parseEmployeeListParams(toURLSearchParams(rawParams));
  const queryClient = getQueryClient(); // new per request on the server
  await Promise.all([
    queryClient.prefetchQuery(employeeListQuery(api, params)),
    queryClient.prefetchQuery(lookupsQuery(api)),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmployeesListContainer canEdit={can(user.role, 'employee:update')} canExport={can(user.role, 'employee:export')} />
    </HydrationBoundary>
  );
}
```

## 5. Client hooks
```tsx
'use client';
export function useEmployees(params: EmployeeListParams) {
  return useQuery({ ...employeeListQuery(browserApiClient, params), placeholderData: keepPreviousData });
  // same key as the server prefetch → hydrated, no refetch within staleTime; keepPreviousData avoids empty flashes
}
```

## 6. Mutations — `src/features/salary-revisions/mutations.ts`
```ts
export function useRecordSalaryRevision(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SalaryRevisionInput) => createSalaryRevision(browserApiClient, employeeId, input),
    onSuccess: () => {
      toast.success('Salary change recorded');
      return Promise.all([
        qc.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) }),
        qc.invalidateQueries({ queryKey: salaryRevisionKeys.list(employeeId) }),
        qc.invalidateQueries({ queryKey: employeeKeys.lists() }),
        qc.invalidateQueries({ queryKey: insightKeys.all }),
      ]);
    },
  });
}
```
Forms catch `ApiError` with status 422 and call `form.setError(field, …)` for each server message.

## 7. Proxy & session
- `src/app/api/proxy/[...path]/route.ts`: allow-listed first segment (`employees`, `insights`, `lookups`, `me`),
  Origin check on non-GET (CSRF), forwards method/query/body, passes through status, `content-type`,
  `content-disposition` (CSV export), deletes the cookie on 401.
- Sign in/out are **server actions** that set/delete the httpOnly cookie; `getCurrentUser` is wrapped in
  React `cache()` so a request calls `/me` once no matter how many components ask.
