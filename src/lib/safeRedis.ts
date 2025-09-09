// lib/safeRedis.ts
import redis from './redis';

export async function safeSet(key: string, value: any, opts?: any) {
  // Try to get a plain JSON string
  let payload: string;
  if (typeof value === 'string') {
    payload = value;
  } else if (value && typeof value.toObject === 'function') {
    payload = JSON.stringify(value.toObject());
  } else {
    payload = JSON.stringify(value);
  }

  // defensive: if somehow payload is "[object Object]" rerun with toObject
  if (payload === '[object Object]') {
    try {
      const obj = (value && typeof value.toObject === 'function')
        ? value.toObject()
        : value;
      payload = JSON.stringify(obj);
    } catch (e) {
      // fallback to string coercion so we never crash the request
      console.warn('⚠️ safeSet: Failed to JSON.stringify, falling back to String():', e);
      payload = String(value);
    }
  }

  return redis.set(key, payload, opts);
}
