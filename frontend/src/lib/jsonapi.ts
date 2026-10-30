/** JSON:API resource as produced by `jsonapi-serializer` on the Rails side. */
export interface JsonApiResource<A> {
  id: string;
  type: string;
  attributes: A;
}

export type Flattened<A> = A & { id: string };

/** `{ id, type, attributes }` → `{ id, ...attributes }`. Keeps components free of wire-format details. */
export function flatten<A extends object>(resource: JsonApiResource<A>): Flattened<A> {
  return { ...resource.attributes, id: String(resource.id) };
}

export function flattenMany<A extends object>(resources: JsonApiResource<A>[] | null | undefined): Flattened<A>[] {
  return (resources ?? []).map(flatten);
}
