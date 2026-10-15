# Local Verification

Verified 14 October 2026. All application changes remain uncommitted on `dev`.
Main was read only. No cloud resources, domain changes or application deployment
were performed.

## Results

| Check | Result |
| --- | --- |
| `npm run test` | 27 tests passed across six files |
| `npm run test:e2e` | 21 tests passed across desktop, mobile and narrow mobile |
| `npm run build` | TypeScript, Vite, private-content build check and built-service smoke passed |
| Dependency install audit | 0 reported vulnerabilities |
| Source preservation | 15 diagram hashes and logo hash match main |
| Hotspot preservation | All 70 coordinates, titles and descriptions match the captured source fixture |
| Public build | 280,185 bytes, four files, zero anatomy PNGs |
| Private diagrams | 15 files, 1,679,714 bytes, stored outside web roots and ignored by Git |

Browser viewports: desktop 1440x900, iPhone 13 390x664 CSS pixels, narrow mobile
320x640, plus live resizing to 360x740. Screenshots are in ignored `test-results/`.
All 15 images passed canvas pixel checks for visible content. All hotspots were
checked against the original 800x500 coordinate frame and their descriptions.
The structure menu allows access when touch hit areas overlap on small screens.

Verified pointer hover, keyboard focus/Space/Escape, touch toggling, zoom bounds
50%-200%, reset, animal/system selection, deep-link refresh, main navigation,
slow/failed image loads and retry. Image authorization failure removes the viewer.

Server tests verify all 15 anonymous GET requests and anonymous HEAD are denied,
current authorization is checked on every picture, and expired/tampered cookies,
wrong subjects, disabled/unverified accounts, issuer/client/audience mismatches,
unknown paths and provider outages cannot grant access. Development tests also
check direct/`?raw`/`/@fs/` attempts against the private asset directory are denied.
Generated screenshot/report directories and local server logs are also denied
by the development file server.

The maintained OIDC client was tested against an isolated test authorization
server for discovery, S256 PKCE, signed ID tokens, code exchange, replay,
wrong state/nonce/verifier, expired codes, forged signatures and online revocation.
Separate checks cover production HTTPS config and Secure HttpOnly host-only cookies.
After the Vercel hosting change, six focused desktop/mobile browser checks for
signed-out access and deep-link refresh passed again. The new Vercel unit checks
cover serverless export, protected rewrites, private Blob streaming, missing
credentials/objects, storage failure and preventing direct URL/token exposure.
Logout clears local cookies, rejects cross-site requests and calls revocation.
These are test-provider results, not claims about integration with real main accounts.

## Not Yet Verified

Real Vetify signup/login/social linking and shared session revocation remain
blocked by missing OIDC/web SSO in main. No runtime auth bypass or local fake login
is enabled. The live development URL shows a sign-in unavailable state and
rejects picture requests until a real compatible provider is configured.

Vercel Functions/private Blob routing and cache behavior, production direct access,
exact callback registrations and global logout require joint deployment tests.
Main's old public diagram paths require removal or protection in its migration.
Source does not provide image licensing/credit metadata. Release remains blocked
until authentication, all deployed access paths and content rights are resolved.

See `source-manifest.json` for source/asset hashes and `build-inventory.json` for
the exact public file sizes. No Planner, Books, Blog, webcam proof, database or
main realtime dependencies enter the feature build.
