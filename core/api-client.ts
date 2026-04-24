import { loadSession } from "./auth-session";

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const session = loadSession();
  const token = session?.token;
  const headers = new Headers(options.headers as HeadersInit | undefined);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
