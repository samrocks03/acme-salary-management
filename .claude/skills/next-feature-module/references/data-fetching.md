# Data fetching

Contents: 1. ApiClient · 2. Fetchers · 3. Key factory + queryOptions · 4. Server prefetch · 5. Client hooks · 6. Mutations · 7. Proxy & session

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
- `src/lib/api/server.ts` (`import 'server-only'`): base `process.env.API_URL + '/api/v1'`, reads the
  `acme_session` cookie, sends `Authorization: Bearer`.
- `src/lib/api/browser.ts`: base `/api/proxy`, `credentials: 'same-origin'`.
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
  list: (p: EmployeeListParams) => [...employeeKeys.lists(), p] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
};

export const employeeListQuery = (client: ApiClient, params: EmployeeListParams) =>
  queryOptions({
    queryKey: employeeKeys.list(params),
    queryFn: () => listEmployees(client, params),
    placeholderData: keepPreviousData, // pagination doesn't flash empty
  });
```
Lookups (countries, departments…) use `staleTime: Infinity` — they change on deploy, not per request.

## 4. Server prefetch — inside the Suspense boundary
```tsx
async function EmployeesSection({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseEmployeeParams(await searchParams);
  const qc = getQueryClient();           // new per request on the server
  await qc.prefetchQuery(employeeListQuery(serverApi(), params));
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <EmployeesContainer initialParams={params} />
    </HydrationBoundary>
  );
}
```

## 5. Client hooks
```tsx
'use client';
export function useEmployees(params: EmployeeListParams) {
  return useQuery(employeeListQuery(browserApi, params)); // same key → hydrated, no refetch within staleTime
}
```

## 6. Mutations — `src/features/salary-revisions/mutations.ts`
```ts
export function useRecordSalaryRevision(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SalaryRevisionInput) => createSalaryRevision(browserApi, employeeId, input),
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
