import { createHmac } from "node:crypto";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import {
  ANONYMOUS_FREE_READING_RATE_LIMIT,
  claimTarotCreditForAnonymousVisitor,
  consumeAnonymousFreeReading,
  getOrCreateAnonymousVisitor,
  getTarotProfileIdForAnonymousVisitor,
  getTarotCreditsForAnonymousVisitor,
  linkAnonymousVisitorToProfile,
  reserveAnonymousFreeReading,
  releaseAnonymousFreeReading,
  releaseTarotCreditForAnonymousVisitor,
  takeAnonymousFreeReadingRateLimitSlot,
} from "./db";
import { ENV } from "./_core/env";
import {
  getAnonymousVisitorCookieOptions,
  TAROT_ANONYMOUS_VISITOR_COOKIE,
} from "./_core/cookies";

export { ANONYMOUS_FREE_READING_RATE_LIMIT };

function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const item of header.split(";")) {
    const [rawName, ...rawValue] = item.trim().split("=");
    if (rawName === name) return decodeURIComponent(rawValue.join("="));
  }
  return undefined;
}

function anonymousAccessSecret(): string {
  if (ENV.cookieSecret) return ENV.cookieSecret;
  if (ENV.isProduction) throw new Error("No hay secreto disponible para la identidad anónima.");
  return "tarot-anonymous-access-development-secret";
}

export function hashAnonymousSignal(value: string): string {
  return createHmac("sha256", anonymousAccessSecret()).update(value).digest("hex");
}

export function getAnonymousClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export async function resolveAnonymousVisitor(req: Request, res: Response) {
  const existing = parseCookie(req.headers.cookie, TAROT_ANONYMOUS_VISITOR_COOKIE);
  const visitorValue = existing && /^[A-Za-z0-9_-]{20,128}$/.test(existing) ? existing : nanoid(32);
  if (visitorValue !== existing) {
    res.cookie(TAROT_ANONYMOUS_VISITOR_COOKIE, visitorValue, getAnonymousVisitorCookieOptions(req));
  }
  const visitorIdHash = hashAnonymousSignal(visitorValue);
  const visitor = await getOrCreateAnonymousVisitor(visitorIdHash);
  return { visitor, visitorIdHash };
}

export async function reserveFreeReadingAccess(req: Request, res: Response, reservationToken: string) {
  const { visitor, visitorIdHash } = await resolveAnonymousVisitor(req, res);
  if (visitor.freeReadingClaimedAt) return { allowed: false as const, reason: "already_used" as const, visitor, visitorIdHash };

  const ipHash = hashAnonymousSignal(getAnonymousClientIp(req));
  const rateLimitAllowed = await takeAnonymousFreeReadingRateLimitSlot(ipHash);
  if (!rateLimitAllowed) return { allowed: false as const, reason: "rate_limited" as const, visitor, visitorIdHash };

  const reserved = await reserveAnonymousFreeReading(visitorIdHash, reservationToken);
  if (!reserved) return { allowed: false as const, reason: "already_used" as const, visitor, visitorIdHash };
  return { allowed: true as const, visitor, visitorIdHash };
}

export async function finalizeFreeReadingAccess(visitorIdHash: string, reservationToken: string): Promise<boolean> {
  return consumeAnonymousFreeReading(visitorIdHash, reservationToken);
}

export async function releaseFreeReadingAccess(visitorIdHash: string, reservationToken: string): Promise<void> {
  await releaseAnonymousFreeReading(visitorIdHash, reservationToken);
}

export async function linkCurrentAnonymousVisitorToProfile(req: Request, res: Response, profileId: number): Promise<void> {
  const { visitorIdHash } = await resolveAnonymousVisitor(req, res);
  await linkAnonymousVisitorToProfile(visitorIdHash, profileId);
}

export async function getCurrentAnonymousCredits(req: Request, res: Response): Promise<number> {
  const { visitorIdHash } = await resolveAnonymousVisitor(req, res);
  return getAnonymousCreditsForVisitorHash(visitorIdHash);
}

export async function getAnonymousCreditsForVisitorHash(visitorIdHash: string): Promise<number> {
  return getTarotCreditsForAnonymousVisitor(visitorIdHash);
}

export async function claimCurrentAnonymousCredit(req: Request, res: Response) {
  const { visitorIdHash } = await resolveAnonymousVisitor(req, res);
  const profileId = await claimTarotCreditForAnonymousVisitor(visitorIdHash);
  return { claimed: Boolean(profileId), profileId, visitorIdHash };
}

export async function getCurrentAnonymousProfileId(req: Request, res: Response): Promise<number | null> {
  const { visitorIdHash } = await resolveAnonymousVisitor(req, res);
  return getTarotProfileIdForAnonymousVisitor(visitorIdHash);
}

export async function releaseCurrentAnonymousCredit(req: Request, res: Response): Promise<void> {
  const { visitorIdHash } = await resolveAnonymousVisitor(req, res);
  await releaseTarotCreditForAnonymousVisitor(visitorIdHash);
}
