import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// OTP requests, two silent limiters (hitting either returns the normal 200 and
// sends nothing — see request-otp). Anyone can type a victim's address, so a cap
// keyed on the email alone would let an attacker use up the victim's budget and
// silence their codes. Hence:
//
// Per email *and* IP: 5/hour, key `${email}:${ip}`. An attacker exhausts only
// their own budget for that address; the real owner, on another IP, still gets codes.
export const otpRequestLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "rl:otp:request",
  analytics: true,
});

// Per email alone: 30/hour, key `email`. The mail-bomb cap: stops a botnet of IPs
// flooding one inbox. High enough that an attacker needs ~6 IPs to reach it, and
// it only counts requests the per-IP-and-email limiter let through.
export const otpEmailCapLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  prefix: "rl:otp:email-cap",
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
// script mint unlimited signatures and burn the (billed) Cloudinary quota.
export const uploadSignLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 h"),
  prefix: "rl:upload:sign",
  analytics: true,
});

// Listing creation: 20/hour per user. Listings go ACTIVE immediately while the
// approval flow is on hold, so this is the only ceiling on live spam listings
// per account. Generous enough for an in-house agent's bulk-listing session.
export const listingCreateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "rl:listing:create",
  analytics: true,
});

// Property views: 10/hour per IP *per listing* (key is `${ip}:${propertyId}`).
// View counts rank "most viewed" listings, and the cookieless guest viewerKey
// includes the User-Agent — rotating UAs would otherwise mint a fresh unique
// view per request. Keyed per listing because a per-IP cap across all listings
// (was 60/hour) undercounts real browsing behind carrier NAT, where hundreds of
// people share one IP. Caps a script at 10 fake views/hour/IP on any one listing.
export const propertyViewLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "rl:property:view",
  analytics: true,
});
