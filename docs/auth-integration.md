# Shared Vetify Authentication Integration

## Blocked Main Capability

Main currently provides browser/native authentication and a version 1
`POST /api/v1/auth/introspect`, not the required web SSO provider. Its existing
HS256 tokens are not accepted as Anatomy sessions. Main must add and test the
provider described in its `docs/main-deployment/shared-auth.md` before real
Vetify accounts can use this application. Main has not been modified here.

## Provider Contract

Anatomy uses maintained `openid-client` with Authorization Code, S256 PKCE,
state and nonce. Main must expose OIDC discovery with authorization, token,
JWKS, introspection and revocation endpoints. The adapter requires PKCE S256
metadata and checks signed ID tokens. Discovery issuer must belong to the
configured main origin. HTTPS is required outside loopback development.

Register `vetify-anatomy` as a confidential server client. Its dedicated client
secret stays server-side. The public client ID is not a credential. The current
adapter uses `client_secret_post`; align this with main's chosen provider.
Register exact callbacks separately for local and production:

- `http://localhost:5176/auth/callback`
- `https://anatomy.vetify.page/auth/callback`

Each authorization code must be short-lived, single-use and bound to the client,
callback and PKCE challenge. No access or refresh token belongs in a callback URL.
Accounts, password signup, social linking and identity collisions remain main's
responsibility. Authentication failure never grants picture access.

Introspection must return this minimum Anatomy contract:

```json
{
  "active": true,
  "iss": "<exact configured OIDC issuer>",
  "aud": "vetify-anatomy",
  "client_id": "vetify-anatomy",
  "sub": "<immutable main user ID>",
  "exp": 1900000000,
  "email_verified": true,
  "account_active": true
}
```

`exp` is a future Unix timestamp. A single-element audience array is also
accepted. Multi-app credentials, wrong clients/issuers, missing fields and
unverified/disabled accounts are rejected. `account_active` is an explicitly
required extension, not a field claimed to exist in current main.

Main must check current browser session version, bans, deletion, password changes
and revocation before returning `active: true`. Introspection is called for every
protected picture and session request, with no identity-result cache.
On timeout or provider failure, requests fail closed. No main JWT secret is used.

## Anatomy Session

State, nonce and PKCE verifier use an encrypted, five-minute HttpOnly transaction
cookie. The exchanged access token and immutable user ID use an independent
encrypted HttpOnly session cookie, bounded to the earlier of token expiry and
one hour. Refresh tokens are not stored or used.
Cookies are host-only, SameSite=Lax, Path=/ and Secure with `__Host-` names in
production. Use a distinct 32-byte encryption key stored in a server secret
manager, consistent across service instances. Rotate it to invalidate all local
sessions. Cookies over the supported size are rejected rather than truncated.

Logout requires the exact UI Origin header. It clears local cookies and calls
the provider revocation endpoint for the Anatomy access token. Main must make
that token inactive immediately, including replayed cookies. This is local app
logout. Global logout and remote revocation must be honored by introspection.

## Joint Acceptance Still Required

The local test authorization server exercises library discovery, signed ID
tokens, PKCE, nonce/state, expired/replayed codes and revocation. It is a test
fixture, not a substitute for integration with main.

Before release, jointly verify main signup/login/provider linking, actual
client/callback registration, cross-client code attacks, disabled accounts,
email verification, bans, local/global logout, password-change revocation,
provider outages, and anonymous/direct picture access. Main's exact unknown-account
and identity-collision messages must be carried by its central sign-in screen.

## Connected Sign-In UI Preference

Owner feedback (15 October 2026) for main's Security screen:

- Open connected sign-in email verification in a popup dialog instead of an
  inline expanding panel or dropdown.
- Use a white background with a green outline. Avoid translucent green fills
  on the verification panel and its action buttons.

This requirement is recorded here. Main's Security UI is not implemented in
this repository and has not been changed.
