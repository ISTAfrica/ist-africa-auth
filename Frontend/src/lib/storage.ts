const PREFIX = "iaa_";

export const storage = {
  get: (key: string): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(PREFIX + key) : null,

  set: (key: string, value: string): void =>
    localStorage.setItem(PREFIX + key, value),

  remove: (key: string): void =>
    localStorage.removeItem(PREFIX + key),

  /** Removes all iaa_ keys without touching other apps' data. */
  clear: (): void => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
};
