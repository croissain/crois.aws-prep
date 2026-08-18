export type NoteStore = Record<string, string>;

const KEY = "crois.aws-prep:notes:v1";

export function loadNotes(): NoteStore {
  if (typeof window === "undefined") return {};
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as NoteStore : {};
  } catch {
    return {};
  }
}

export function saveNotes(notes: NoteStore) {
  localStorage.setItem(KEY, JSON.stringify(notes));
}
