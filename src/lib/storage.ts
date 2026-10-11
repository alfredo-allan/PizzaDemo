const PREFIX = 'abb:v1:';

export function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* armazenamento cheio ou bloqueado: o app segue só em memória */
  }
}

export function drop(key: string) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* idem */
  }
}

export const storageKey = (key: string) => PREFIX + key;
