export class TtlCache<K, V> {
  private readonly ttlMs: number;
  private readonly store = new Map<K, { value: V; expiresAtMs: number }>();

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  get(key: K): V | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAtMs) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: K, value: V) {
    this.store.set(key, { value, expiresAtMs: Date.now() + this.ttlMs });
  }

  delete(key: K) {
    this.store.delete(key);
  }
}

