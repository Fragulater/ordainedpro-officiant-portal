const SHARED_AUTH_DOMAIN = ".ordainedpro.com"

export function getBrowserCookieOptions() {
  if (typeof window === "undefined") {
    return {
      path: "/",
      sameSite: "lax" as const,
    }
  }

  const hostname = window.location.hostname
  const isOrdainedPro = hostname === "ordainedpro.com" || hostname.endsWith(".ordainedpro.com")

  return {
    path: "/",
    sameSite: "lax" as const,
    secure: isOrdainedPro,
    ...(isOrdainedPro ? { domain: SHARED_AUTH_DOMAIN } : {}),
  }
}

export function getServerCookieOptions(hostname?: string | null) {
  const normalizedHost = hostname?.split(":")[0] || ""
  const isOrdainedPro =
    normalizedHost === "ordainedpro.com" || normalizedHost.endsWith(".ordainedpro.com")

  return {
    path: "/",
    sameSite: "lax" as const,
    secure: isOrdainedPro,
    ...(isOrdainedPro ? { domain: SHARED_AUTH_DOMAIN } : {}),
  }
}
