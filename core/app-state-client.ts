function encodeStateKeyForQuery(key: string): string {
  // encodeURIComponent does not escape dots; escape them so Vite dev server
  // does not misinterpret keys like customers.list as a loader extension.
  return encodeURIComponent(key).replace(/\./g, "%2E");
}

export async function loadAppState<T>(key: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`/api/app-state?key=${encodeStateKeyForQuery(key)}`, { method: "GET", cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || `Failed to load ${key}`);
    }
    if (payload?.value == null) return fallback;
    return payload.value as T;
  } catch {
    return fallback;
  }
}

export async function saveAppState<T>(key: string, value: T): Promise<void> {
  const res = await fetch("/api/app-state", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, value }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Failed to save ${key}`);
  }
}
