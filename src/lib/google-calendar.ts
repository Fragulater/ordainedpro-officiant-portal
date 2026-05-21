import { cookies } from "next/headers"

const GOOGLE_OAUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"

const GOOGLE_ACCESS_TOKEN_COOKIE = "google_calendar_access_token"
const GOOGLE_REFRESH_TOKEN_COOKIE = "google_calendar_refresh_token"
const GOOGLE_TOKEN_EXPIRY_COOKIE = "google_calendar_token_expiry"

const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"

type GoogleTokenResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  token_type: string
}

export const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.URL ||
  "http://localhost:3000"

export const getGoogleRedirectUri = () => `${getBaseUrl()}/api/google/callback`

export const getGoogleClientConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET")
  }

  return { clientId, clientSecret }
}

export const isGoogleCalendarConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export const buildGoogleAuthUrl = (state: string) => {
  const { clientId } = getGoogleClientConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_CALENDAR_SCOPE,
    state,
  })

  return `${GOOGLE_OAUTH_BASE_URL}?${params.toString()}`
}

export const exchangeGoogleCode = async (code: string) => {
  const { clientId, clientSecret } = getGoogleClientConfig()

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google token exchange failed: ${errorText}`)
  }

  return (await response.json()) as GoogleTokenResponse
}

export const persistGoogleTokens = async (tokenResponse: GoogleTokenResponse) => {
  const cookieStore = await cookies()
  const expiry = Date.now() + tokenResponse.expires_in * 1000
  const secure = getBaseUrl().startsWith("https://")

  cookieStore.set(GOOGLE_ACCESS_TOKEN_COOKIE, tokenResponse.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: tokenResponse.expires_in,
  })

  if (tokenResponse.refresh_token) {
    cookieStore.set(GOOGLE_REFRESH_TOKEN_COOKIE, tokenResponse.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  cookieStore.set(GOOGLE_TOKEN_EXPIRY_COOKIE, expiry.toString(), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export const clearGoogleTokens = async () => {
  const cookieStore = await cookies()
  cookieStore.delete(GOOGLE_ACCESS_TOKEN_COOKIE)
  cookieStore.delete(GOOGLE_REFRESH_TOKEN_COOKIE)
  cookieStore.delete(GOOGLE_TOKEN_EXPIRY_COOKIE)
}

const refreshGoogleAccessToken = async (refreshToken: string) => {
  const { clientId, clientSecret } = getGoogleClientConfig()

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google token refresh failed: ${errorText}`)
  }

  return (await response.json()) as GoogleTokenResponse
}

export const getGoogleAccessToken = async () => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(GOOGLE_ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(GOOGLE_REFRESH_TOKEN_COOKIE)?.value
  const expiryRaw = cookieStore.get(GOOGLE_TOKEN_EXPIRY_COOKIE)?.value
  const expiry = expiryRaw ? Number(expiryRaw) : 0

  if (accessToken && expiry && expiry > Date.now() + 60_000) {
    return accessToken
  }

  if (!refreshToken) {
    return null
  }

  const refreshed = await refreshGoogleAccessToken(refreshToken)
  await persistGoogleTokens({
    ...refreshed,
    refresh_token: refreshed.refresh_token || refreshToken,
  })

  return refreshed.access_token
}

type CreateGoogleMeetParams = {
  summary: string
  description: string
  startDateTime: string
  endDateTime: string
  timeZone: string
  attendees?: string[]
}

export const createGoogleMeetEvent = async ({
  summary,
  description,
  startDateTime,
  endDateTime,
  timeZone,
  attendees = [],
}: CreateGoogleMeetParams) => {
  const accessToken = await getGoogleAccessToken()
  if (!accessToken) {
    throw new Error("Google Calendar is not connected")
  }

  const response = await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}?conferenceDataVersion=1&sendUpdates=all`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
      attendees: attendees.filter(Boolean).map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Calendar event creation failed: ${errorText}`)
  }

  return response.json()
}

export const cancelGoogleCalendarEvent = async (eventId: string) => {
  const accessToken = await getGoogleAccessToken()
  if (!accessToken) {
    throw new Error("Google Calendar is not connected")
  }

  const response = await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}/${encodeURIComponent(eventId)}?sendUpdates=all`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok && response.status !== 410) {
    const errorText = await response.text()
    throw new Error(`Google Calendar event cancellation failed: ${errorText}`)
  }

  return true
}
