import type { CookieOptions, Request } from "express";

export const TAROT_ANONYMOUS_VISITOR_COOKIE = "tarot_visitor";
export const TAROT_ANONYMOUS_VISITOR_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // const hostname = req.hostname;
  // const shouldSetDomain =
  //   hostname &&
  //   !LOCAL_HOSTS.has(hostname) &&
  //   !isIpAddress(hostname) &&
  //   hostname !== "127.0.0.1" &&
  //   hostname !== "::1";

  // const domain =
  //   shouldSetDomain && !hostname.startsWith(".")
  //     ? `.${hostname}`
  //     : shouldSetDomain
  //       ? hostname
  //       : undefined;

  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}

/** Cookie host-only de primera parte para el derecho anónimo de lectura. */
export function getAnonymousVisitorCookieOptions(
  req: Request,
): Pick<CookieOptions, "httpOnly" | "maxAge" | "path" | "sameSite" | "secure"> {
  return {
    httpOnly: true,
    maxAge: TAROT_ANONYMOUS_VISITOR_MAX_AGE_MS,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req),
  };
}
