import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Max 3 OTP requests per email per hour (across signup + login)
export const otpRequestLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "rl:otp:request",
  analytics: true,
});

// Max 5 OTP verify attempts per email per 10 minutes
export const otpVerifyLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "rl:otp:verify",
  analytics: true,
});

// Max 10 requests per IP per minute on auth endpoints (DDoS shield)
export const authIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:auth:ip",
  analytics: true,
});
