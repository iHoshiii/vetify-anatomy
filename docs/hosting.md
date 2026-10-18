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

- `VITE_MAIN_ORIGIN`: `https://vetify.page`.
- `VITE_AUTH_CLIENT_ID`: the client registered by main, `vetify-anatomy`.
- `VITE_AUTH_CALLBACK_URL`: `https://anatomy.vetify.page/auth/callback`.
- `OIDC_ISSUER`, `OIDC_CLIENT_SECRET`: main's compatible provider registration.
- `SESSION_ENCRYPTION_KEY`: an independent 32-byte base64url encryption key.
- `MONGODB_URI`: server-only connection string for an Anatomy-scoped database user.
- `MONGODB_DATABASE`: `vetify_anatomy`, separate from main's database.
- `ANATOMY_GRIDFS_BUCKET`: `anatomy`.

Vercel sets `VERCEL=1`; the service then requires HTTPS/Secure cookies and uses
MongoDB GridFS storage. Local ports 5176/5177 and the private filesystem directory
are development settings, not production hosting requirements.

Production defaults use `https://vetify.page` and the Anatomy callback above.
Set the public variables explicitly in Vercel to override local `.env` values.
SSO stays unavailable until the server-only provider credentials are configured.

## Deploy This Checkout

For GitHub Actions deployment, follow [CI/CD setup](github-cicd.md). Native
Vercel Git deployments are disabled so production deploys after Actions checks.
The commands below are available for manual deployment.

```sh
npx vercel login
npx vercel link --project vetify-anatomy
npx vercel env add VITE_MAIN_ORIGIN production
npx vercel env add VITE_AUTH_CLIENT_ID production
npx vercel env add VITE_AUTH_CALLBACK_URL production
npx vercel --prod
npx vercel domains add anatomy.vetify.page vetify-anatomy
npx vercel domains inspect anatomy.vetify.page
```

Use the public values listed above at the environment prompts. Configure the
server-only secrets and MongoDB storage before enabling authenticated use.
Add the exact DNS record returned by Vercel at Name.com, which serves the
`vetify.page` nameservers. Keep the root domain pointed at the main AWS site.

Preview environments need separate exact callback registration in main, not an
arbitrary return URL. Apply persistent Vercel Firewall limits to auth/image paths.
Keep browser requests on the Anatomy origin and preserve `private, no-store`
responses. No wildcard CORS policy or shared parent-domain cookie is used.

## Private Diagram Storage

Use MongoDB GridFS in a dedicated `vetify_anatomy` database. Follow
[MongoDB setup](mongodb-storage.md) to configure Atlas access and upload the
15 unchanged PNGs. Filenames such as `dog/dog-skeleton.png` match picture routes
after removing `/anatomy/`. The `anatomy` bucket uses `anatomy.files` and
`anatomy.chunks`; no accounts or main application collections are accessed.

The function verifies the current Vetify session before opening a GridFS stream
for the allowlisted filename. Database credentials never reach the browser.
Missing credentials, storage failure or authentication failure deny access.
Production never falls back to local files. Connection pools are reused within
each function instance and bounded to five connections.

The public Vercel output contains UI code and logo only. All 15 diagram hashes
are excluded by the build check. `private-assets/` is ignored by Git and by
`.vercelignore`, preventing source pushes or CLI uploads from publishing them.
Local development still reads this private directory; set
`ANATOMY_PRIVATE_ASSET_DIR` only if its local location differs.

Vercel references: [Vite hosting](https://vercel.com/docs/frameworks/frontend/vite),
[Node functions](https://vercel.com/docs/functions/runtimes/node-js), and
[MongoDB GridFS](https://www.mongodb.com/docs/drivers/node/current/crud/gridfs/).

## Release Gates

Main's OIDC provider and joint sign-in/revocation testing remain required.
Main still contains `public/anatomy`. Its old picture paths must be removed or
protected in that repository's migration before release. This port leaves main
unchanged and cannot revoke access through an independently hosted main copy.
Source provides no diagram licensing or credit metadata. Establish permission
and attribution before publishing. Preserve the supplied PNG bytes and record
any later approved attribution in the source manifest.

Test anonymous and expired-session image links through the deployed Vercel domain
and diagram URLs opened directly. Verify no cached responses survive logout, no UI
rewrite swallows auth errors, and all 15 diagrams load only after authorization.
Previously saved files cannot be revoked. The guarantee covers future delivery.
