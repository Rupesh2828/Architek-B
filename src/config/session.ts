import session from "express-session";
import { RedisStore } from "connect-redis";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redisClient;
let sessionStore;

try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redisClient.on("connect", () => console.log("Connected to Redis"));
  redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
  });

  sessionStore = new RedisStore({ 
    client: redisClient,
  });

} catch (error) {
  console.error("Failed to initialize Redis:", error);
}

export const sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24, 
  },
});