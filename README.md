# vetify-anatomy

Standalone React/TypeScript/Vite port of Vetify's existing 2D anatomy viewer:
dog, cat and bird, five body systems, 15 original pictures and 70 hotspots.

## Current Status

The viewer and protected image service are implemented locally. Real Vetify
shared sign-in is blocked by the missing web SSO provider in main, as documented
in main's `docs/main-deployment/shared-auth.md`. Until it is implemented and
configured, the app shows the sign-in screen and denies every picture request.
There is no working-login claim, production auth stub, independent account store
or modification to the main repository.

## Local Setup

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:5176`. The auth/image service runs on port 5177.
Both ports must be free. The UI uses the same origin for authentication and images.
Original pictures have been copied into this checkout's `private-assets/anatomy`.
That directory is ignored by Git to avoid publishing restricted pictures through
a future code push. New checkouts need the same private asset export restored
from main's `public/anatomy` or private Vercel Blob storage before image tests.

`.env.example` contains public UI settings and server-only placeholders. A local
`.env` is optional. Without configured shared sign-in, access stays closed.
Use `.env.prod.example` as the production reference. Actual `.env.prod` files
stay ignored. See [GitHub CI/CD setup](docs/github-cicd.md) for automated checks
and deployment from `main`.
For real integration, supply a registered main OIDC issuer/client secret and an
independent 32-byte base64url session encryption key through private server config.
Never reuse main's JWT secrets or put credentials into a `VITE_` variable.

```sh
npm run build
npm run preview
npm run test
npm run test:e2e
npm run manifest
```

Preview also uses port 5176 and requires port 5177. Browser tests reuse a running
dev server, or start and stop their own. They require Playwright Chromium
(`npx playwright install chromium` if it is not already installed).
Test authorization servers and browser fixtures are confined to `tests/` and do
not provide an application login bypass. Their results are not main SSO validation.

Deploy Anatomy on Vercel using the included `vercel.json`: the Vite UI is static,
and `api/index.ts` exports the auth/image service as a Vercel Function.
Only main Vetify is hosted on AWS. Configure the real HTTPS main origin,
registered Anatomy callback and server-only secrets in Vercel project settings.
`npm start` remains available for a local standalone built-service check.

## Content Access

Both the viewer and all anatomy pictures require Vetify sign-in. Pictures are
stored in `private-assets/anatomy`, outside `public/` and `dist/`.
The service checks current authorization on every image request, allows only
the 15 known file paths and sends `private, no-store` responses. There are no
public image URLs, client credentials, shared browser storage or broad cookies.

Logout clears the Anatomy cookie and revokes its scoped provider token. This
is local Anatomy logout, not a global Vetify logout. Provider failure is reported.
Already downloaded pictures cannot be taken back. New requests must be denied
after logout, bans, deactivation or global session revocation in main.

## Source And Hosting

Source: `../Vetify/src/client/pages/anatomy`, its anatomy types and original
`public/anatomy` assets. Main was read without copying its environment or changing
its files. The shared Vetify logo and source image paths are preserved.
No diagram credit or license was provided by source. This remains unresolved
for public release, with no invented attribution or replacement images.
Main's existing public picture paths must also be removed or protected during
its separate migration before claiming these pictures are private everywhere.

See [source manifest](docs/source-manifest.json), [auth contract](docs/auth-integration.md),
[hosting](docs/hosting.md), [verification](docs/VERIFICATION.md) and
[build inventory](docs/build-inventory.json).

The public build contains UI code and logo only. Do not upload private diagrams
to a public website directory. Production pictures use Vercel private Blob
storage and are streamed through the authenticated Vercel Function. Local
development uses the existing private asset directory. Vercel credentials
remain server-side. Anatomy has no AWS SDK or storage configuration.
No server, database, payment, AI, Planner, Books, Blog, webcam or realtime feature
code from main is imported.
