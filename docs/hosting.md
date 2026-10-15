# Anatomy Hosting On Vercel

Target: `https://anatomy.vetify.page`. No cloud resources or domain changes have
been deployed by this port.

## Application

Owner decision: Anatomy deploys on Vercel. Main Vetify remains on AWS.
The repository includes `vercel.json` with the Vite framework preset, Node 24,
`npm run build` and static output directory `dist`. No separate hosted Node server
or AWS resources are required for Anatomy.

`api/index.ts` exports the existing Express auth/image service as a Vercel
Function, without opening a port. `/api/*`, `/auth/*` and `/anatomy/*` are rewritten
to this function. The public build is included in its bundle for nested Anatomy
UI routes. Dog/cat/bird UI deep links rewrite to `index.html`; protected requests
never use the SPA fallback, so 401/403/503 responses remain errors.

Connect this repository to a Vercel project and add `anatomy.vetify.page` as the
production domain when ready. Configure these project environment variables:

- `VITE_MAIN_ORIGIN`: main Vetify's actual HTTPS address on AWS.
- `VITE_AUTH_CLIENT_ID`: the client registered by main, `vetify-anatomy`.
- `VITE_AUTH_CALLBACK_URL`: `https://anatomy.vetify.page/auth/callback`.
- `OIDC_ISSUER`, `OIDC_CLIENT_SECRET`: main's compatible provider registration.
- `SESSION_ENCRYPTION_KEY`: an independent 32-byte base64url encryption key.
- `BLOB_READ_WRITE_TOKEN`: server-only token for a private Vercel Blob store,
  or connect a store using Vercel-managed `BLOB_STORE_ID`/OIDC credentials.
- `ANATOMY_BLOB_PREFIX`: `anatomy/` unless the private object prefix differs.

Vercel sets `VERCEL=1`; the service then requires HTTPS/Secure cookies and uses
private Blob storage. Local ports 5176/5177 and the private filesystem directory
are development settings, not production hosting requirements.

Preview environments need separate exact callback registration in main, not an
arbitrary return URL. Apply persistent Vercel Firewall limits to auth/image paths.
Keep browser requests on the Anatomy origin and preserve `private, no-store`
responses. No wildcard CORS policy or shared parent-domain cookie is used.

## Private Diagram Storage

Create a **private** Vercel Blob store and connect it to Anatomy. Upload the
unchanged PNG files at `anatomy/<animal>/<animal>-<system-file>.png`, without random
filename suffixes. These paths match `docs/source-manifest.json` after removing
the leading slash from each picture route. A public Blob store is incompatible
with the signed-in-only requirement.

The function verifies the current Vetify session before using `@vercel/blob`
`get(..., { access: 'private' })` to stream the allowlisted file. Storage tokens
and direct Blob URLs are never returned to the browser. Missing credentials,
storage failure or authentication failure do not make pictures public.

The public Vercel output contains UI code and logo only. All 15 diagram hashes
are excluded by the build check. `private-assets/` is ignored by Git and by
`.vercelignore`, preventing source pushes or CLI uploads from publishing them.
Local development still reads this private directory; set
`ANATOMY_PRIVATE_ASSET_DIR` only if its local location differs.

Vercel references: [Vite hosting](https://vercel.com/docs/frameworks/frontend/vite),
[Node functions](https://vercel.com/docs/functions/runtimes/node-js), and
[private Blob delivery](https://vercel.com/docs/vercel-blob/private-storage).

## Release Gates

Main's OIDC provider and joint sign-in/revocation testing remain required.
Main still contains `public/anatomy`. Its old picture paths must be removed or
protected in that repository's migration before release. This port leaves main
unchanged and cannot revoke access through an independently hosted main copy.
Source provides no diagram licensing or credit metadata. Establish permission
and attribution before publishing. Preserve the supplied PNG bytes and record
any later approved attribution in the source manifest.

Test anonymous and expired-session image links through the deployed Vercel domain
and direct private Blob URLs. Verify no cached responses survive logout, no UI
rewrite swallows auth errors, and all 15 diagrams load only after authorization.
Previously saved files cannot be revoked. The guarantee covers future delivery.
