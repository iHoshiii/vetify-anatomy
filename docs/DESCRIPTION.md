# Vetify Anatomy: application description

Updated 14 October 2026. This document belongs to `vetify-anatomy` and defines
its feature scope. The repository now contains the standalone viewer, private
diagram delivery service and local tests. Real shared sign-in remains blocked
until main implements its documented web SSO provider.

## Purpose and users

Provide visual veterinary anatomy learning for pet owners, students and other
authenticated Vetify users. Help readers locate body structures and understand
species-specific educational descriptions without presenting them as diagnosis.

## Feature scope

Port the existing dog/cat/bird viewer, five body systems, diagram assets,
hotspots, descriptions, species/system selection and zoom controls.
The inspected main implementation is a 2D illustration viewer. It does not
establish a 3D engine, gesture recognition or an Anatomy backend/database.
Future 3D, gestures or additional species require separate decisions and assets.

## Architecture and ownership

React/TypeScript/Vite frontend with preserved hotspot data and a static UI build.
The separate auth/image service delivers diagrams only after authorization.
Suggested future domain: `https://anatomy.vetify.page`, not yet configured.
Anatomy's deployment target is Vercel; only main Vetify is hosted on AWS. Vercel Functions
perform authentication and stream pictures from Vercel private Blob storage.
No feature database is required initially; diagrams require authenticated
delivery from private storage.

Main alone owns accounts, login methods, verification, professional approvals,
subscriptions and credential storage. Anatomy must not copy users or main secrets.
Keep shared identity references only if feature-owned user state is later needed.
Main professional MediaPipe selfie capture belongs in main, not Anatomy.

## Authentication and content privacy

The current embedded viewer route requires login. Preserving that policy needs
the reviewed central web sign-in flow; it is not complete merely because main
and Anatomy share a brand or parent domain.
Use registered callbacks, authorization code with PKCE, app-specific sessions
and current main account status. Do not match/merge identities by email.

Owner decision (14 October 2026): both the viewer and the anatomy pictures are
available only to users signed into Vetify. Direct image links must also require
authenticated access. Keep diagrams out of the publicly served static build.
React route guards alone do not protect image files. Implement authenticated
delivery and test access without a session and after logout or revocation before
launch. Local access checks are implemented and tested. Production integration
with main and deployed storage remains unverified.

## Experience and quality

Keep hotspot alignment when zooming/resizing. Support usable keyboard/touch
navigation, visible focus, readable descriptions and narrow mobile screens.
Load large diagrams progressively with loading, error and retry states.
Preserve asset credits/licensing and distinguish implemented from planned content.

## Porting and release acceptance

Source is main's `src/client/pages/anatomy/`, `src/client/types/anatomy.ts`
and `public/anatomy/`, plus actual shared UI/CSS dependencies.
Use this repository's `PROMPT.md` for source porting instructions.
Verify all fifteen diagrams, species/system transitions, hotspots, zoom limits,
failed/slow loads and direct/deep-link navigation.
Validate login/logout/revocation and direct asset access under the chosen policy.
Build independently without Planner/Books/Blog or main professional proof code.
Enable main's launch link only after this destination and integration work.

## Exclusions

Accounts, appointments, communications, veterinary AI, professional approvals,
nutrition planning, documents and editorial publishing are owned elsewhere.
Do not add payments, medical claims or new interactions during a behavior-preserving port.
