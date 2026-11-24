/** 可注入的 fetch，便于单测 mock */
export type FetchLike = typeof fetch;

export async function getJson(
  url: string,
  init: RequestInit,
  fetchImpl: FetchLike = fetch,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetchImpl(url, init);
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json };
}
