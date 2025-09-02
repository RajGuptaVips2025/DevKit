// lib/redisHelpers.ts
import redis from "./redis";

type ExpiryOption = { ex: number };

export async function getJson<T = any>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  if (!val) return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return val as T; // fallback to raw string
  }
}


export async function setJson(key: string, value: any, opts?: ExpiryOption) {
  const str = JSON.stringify(value);
  if (opts?.ex) {
    return redis.set(key, str, { ex: opts.ex });
  }
  return redis.set(key, str);
}

export async function expireKey(key: string, opts: ExpiryOption) {
  if (opts?.ex) {
    const val = await redis.get(key);
    if (val !== null) {
      await redis.set(key, val, { ex: opts.ex });
    }
  }
}

export async function delKeysByPattern(pattern: string): Promise<string[]> {
  const deleted: string[] = [];

  if (typeof (redis as any).scanIterator === "function") {
    for await (const key of (redis as any).scanIterator({ MATCH: pattern, COUNT: 100 })) {
      try {
        await redis.del(key);
        deleted.push(String(key));
      } catch (e) {
        console.error(e);
      }
    }
    return deleted;
  }

  try {
    const keys: string[] = (await (redis as any).keys(pattern)) || [];
    if (keys.length > 0) {
      await (redis as any).del(...keys);
      deleted.push(...keys);
    }
  } catch (e) {
    console.error("delKeysByPattern fallback error:", e);
  }
  return deleted;
}

const redisHelpers = {
  getJson,
  setJson,
  expireKey,
  delKeysByPattern,
};

export default redisHelpers;











