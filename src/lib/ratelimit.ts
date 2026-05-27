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

// Mapbox geocode proxy: 30 req/min per session/IP. Tight enough to stop a
// runaway typeahead from burning the Mapbox quota, loose enough for normal use.
export const geocodeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "rl:geocode",
  analytics: true,
});

// Contact requests: max 10/hour per tenant. Spam shield for the reveal-and-log
// flow on property detail pages — well above legitimate use, low enough that a
// runaway script can't flood any single landlord's inbox.
export const contactRequestLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "rl:contact",
  analytics: true,
});
