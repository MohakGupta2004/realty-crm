import { Redis } from "ioredis";
import { env } from "./env.config";

export const redisClient = new Redis(env.REDIS_URI);

redisClient.on("connect", () => {
    console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});
