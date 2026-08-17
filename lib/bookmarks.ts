const KEY = "crois.aws-prep:bookmarks:v1";

export function loadBookmarks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export function saveBookmarks(bookmarks: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify([...bookmarks]));
}
