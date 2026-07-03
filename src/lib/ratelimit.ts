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

// Cloudinary upload signatures: 60/hour per user. A listing tops out around
// 30 photos, so this allows a full listing plus retries without letting a
// script mint unlimited signatures and burn the Cloudinary quota.
export const uploadSignLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 h"),
  prefix: "rl:upload:sign",
  analytics: true,
});

// Listing creation: 20/hour per user. Listings go ACTIVE immediately (approval
// flow on hold), so this is the ceiling on live spam listings per account.
// Generous enough for an in-house agent's bulk-listing session.
export const listingCreateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "rl:listing:create",
  analytics: true,
});

// Listing reports: 5/hour per IP. Reports are open to guests (no account
// needed), so per-IP is the only handle — keeps one machine from flooding
// the admin report queue.
export const reportLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "rl:report",
  analytics: true,
});
