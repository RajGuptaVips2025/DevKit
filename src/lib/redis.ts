import { Redis as UpstashRedis } from "@upstash/redis";
import { createClient as createNodeRedisClient } from "redis";

declare global {
  var __redisClient: any | undefined;
}

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let client: any;

if (upstashUrl && upstashToken) {
  client = new UpstashRedis({
    url: upstashUrl,
    token: upstashToken,
  });
} else {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is not set");
  }

  client = global.__redisClient ?? createNodeRedisClient({ url: redisUrl });

  if (!global.__redisClient) {
    client.on("error", (err: any) => console.error("Redis Client Error", err));
    client.connect().catch((e: any) => console.error("Redis connect failed", e));
    global.__redisClient = client;
  }
}

export default client;