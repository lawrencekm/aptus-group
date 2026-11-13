import "server-only";
import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";

/**
 * Minimal key-value interface. Production uses Upstash Redis (Vercel Marketplace).
 * Local development without credentials falls back to a JSON file in .data/.
 */
export interface Store {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Increment a counter; the TTL is applied when the key is first created. */
  incr(key: string, ttlSeconds?: number): Promise<number>;
  sadd(key: string, member: string): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  /** Push to the head of a list and keep at most `max` entries. */
  lpush(key: string, value: unknown, max: number): Promise<void>;
  lrange<T>(key: string, count: number): Promise<T[]>;
}

function redisStore(url: string, token: string): Store {
  const r = new Redis({ url, token });
  return {
    async get<T>(k: string) {
      return ((await r.get<T>(k)) ?? null) as T | null;
    },
    async set(k, v, ttl) {
      if (ttl) await r.set(k, v, { ex: ttl });
      else await r.set(k, v);
    },
    async del(k) {
      await r.del(k);
    },
    async incr(k, ttl) {
      const n = await r.incr(k);
      if (n === 1 && ttl) await r.expire(k, ttl);
      return n;
    },
    async sadd(k, m) {
      await r.sadd(k, m);
    },
    async srem(k, m) {
      await r.srem(k, m);
    },
    async smembers(k) {
      return (await r.smembers(k)) as string[];
    },
    async lpush(k, v, max) {
      await r.lpush(k, v);
      await r.ltrim(k, 0, max - 1);
    },
    async lrange<T>(k: string, count: number) {
      return (await r.lrange<T>(k, 0, count - 1)) as T[];
    },
  };
}

type Entry = { v: unknown; exp?: number };
type FileData = Record<string, Entry>;

function fileStore(): Store {
  const file = path.join(process.cwd(), ".data", "store.json");
  const g = globalThis as unknown as { __agStore?: FileData; __agLoaded?: Promise<void> };

  async function load(): Promise<FileData> {
    if (!g.__agLoaded) {
      g.__agLoaded = (async () => {
        try {
          g.__agStore = JSON.parse(await fs.readFile(file, "utf8"));
        } catch {
          g.__agStore = {};
        }
      })();
    }
    await g.__agLoaded;
    return g.__agStore!;
  }
  async function save() {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(g.__agStore ?? {}, null, 2));
  }
  async function entry(k: string) {
    const d = await load();
    const e = d[k];
    if (e && e.exp && e.exp < Date.now()) {
      delete d[k];
      return undefined;
    }
    return e;
  }
  const clone = <T,>(v: unknown) => JSON.parse(JSON.stringify(v)) as T;

  return {
    async get<T>(k: string) {
      const e = await entry(k);
      return e ? clone<T>(e.v) : null;
    },
    async set(k, v, ttl) {
      const d = await load();
      d[k] = { v: clone(v), exp: ttl ? Date.now() + ttl * 1000 : undefined };
      await save();
    },
    async del(k) {
      const d = await load();
      delete d[k];
      await save();
    },
    async incr(k, ttl) {
      const d = await load();
      const e = await entry(k);
      const n = (((e?.v as number) ?? 0) as number) + 1;
      d[k] = { v: n, exp: e?.exp ?? (ttl ? Date.now() + ttl * 1000 : undefined) };
      await save();
      return n;
    },
    async sadd(k, m) {
      const d = await load();
      const set = new Set(((await entry(k))?.v as string[]) ?? []);
      set.add(m);
      d[k] = { v: [...set] };
      await save();
    },
    async srem(k, m) {
      const d = await load();
      const set = new Set(((await entry(k))?.v as string[]) ?? []);
      set.delete(m);
      d[k] = { v: [...set] };
      await save();
    },
    async smembers(k) {
      return [...(((await entry(k))?.v as string[]) ?? [])];
    },
    async lpush(k, v, max) {
      const d = await load();
      const list = ((await entry(k))?.v as unknown[]) ?? [];
      d[k] = { v: [clone(v), ...list].slice(0, max) };
      await save();
    },
    async lrange<T>(k: string, count: number) {
      const list = ((await entry(k))?.v as T[]) ?? [];
      return clone<T[]>(list.slice(0, count));
    },
  };
}

let cached: Store | null = null;

export function store(): Store {
  if (cached) return cached;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    cached = redisStore(url, token);
  } else if (process.env.NODE_ENV !== "production" || process.env.ALLOW_FILE_STORE === "1") {
    cached = fileStore();
  } else {
    throw new Error(
      "No database configured. Add the Upstash Redis integration in Vercel (KV_REST_API_URL / KV_REST_API_TOKEN)."
    );
  }
  return cached;
}
