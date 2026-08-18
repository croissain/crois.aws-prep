export type TextHighlight = {
  id: string;
  region: string;
  start: number;
  end: number;
};

export type HighlightStore = Record<string, TextHighlight[]>;

const KEY = "crois.aws-prep:highlights:v1";

export function loadHighlights(): HighlightStore {
  if (typeof window === "undefined") return {};
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as HighlightStore : {};
  } catch {
    return {};
  }
}

export function saveHighlights(highlights: HighlightStore) {
  localStorage.setItem(KEY, JSON.stringify(highlights));
}
