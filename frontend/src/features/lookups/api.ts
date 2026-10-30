import type { ApiClient } from "@/lib/api/types";
import type { Lookups } from "./types";

export async function getLookups(client: ApiClient): Promise<Lookups> {
  const { data } = await client.request<Lookups>("lookups");
  return data;
}
