export const AUTH_SESSION_EXPIRED_EVENT =
  'pm-intelligence:auth-session-expired'

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response =
    await fetch(
      input,
      {
        ...init,
        credentials: 'include',
      },
    )

  if (
    response.status === 401 &&
    typeof window !== 'undefined'
  ) {
    window.dispatchEvent(
      new Event(
        AUTH_SESSION_EXPIRED_EVENT,
      ),
    )
  }

  return response
}