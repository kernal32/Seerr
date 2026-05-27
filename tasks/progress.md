# Progress

Newest entries at the top.

## 2026-05-27 — phase2: Book request list display + Bindery author metadata

- Files: `src/utils/requestMediaTitle.ts`, `src/components/RequestCard/index.tsx`, `src/components/RequestList/{index,RequestItem/index}.tsx`, `src/components/UserProfile/index.tsx`, `server/subscriber/MediaRequestSubscriber.ts`
- DoD: `pnpm typecheck` pass, `pnpm lint` pass, `pnpm test` pass (74/74)
- Notes: Request cards/list fetch `/api/v1/book|audiobook/{metadataId}` instead of TMDB TV lookup; added book/audiobook filter dropdown; `sendToBookDownloader` now passes real title + authorName to Bindery

## 2026-05-27 — phase2: Fix book request OpenAPI + Hardcover token normalization

- Files: `seerr-api.yml`, `server/api/metadata/hardcover/normalizeToken.ts`, `src/components/ReadingDetails/index.tsx`
- DoD: `pnpm typecheck` pass
- Notes: POST /api/v1/request OpenAPI only allowed movie|tv — book requests were rejected before handler; strip duplicate Bearer prefix on Hardcover token; clearer request error toast

## 2026-05-27 — phase2: Hardcover search fallback for Bindery/OpenLibrary blocks

- Files: `server/api/metadata/hardcover/*`, `server/api/downloaders/bindery/{adapter,metadataErrors}.ts`, `server/lib/settings/index.ts`, `src/components/Settings/BookDownloaderModal`, `src/components/Discover/DiscoverBooks`, `src/components/Discover/DiscoverAudiobooks`, `seerr-api.yml`
- DoD: `pnpm typecheck` pass, `pnpm lint` pass
- Notes: Optional `hardcoverApiToken` on book downloader; when set, discover/search/detail use Hardcover GraphQL (`hc:` ids) while requests still dispatch to Bindery

## 2026-05-27 — phase3: Book search fix + audiobooks shared layer

- Files: `server/api/downloaders/bindery/{types,adapter,client}.ts`, `server/routes/reading/{errors,createReadingMediaRoutes}.ts`, `server/routes/{book,audiobook}.ts`, `server/models/ReadingMedia.ts`, `server/lib/settings/index.ts`, `server/entity/MediaRequest.ts`, `server/subscriber/MediaRequestSubscriber.ts`, `server/routes/request.ts`, `seerr-api.yml`, `src/components/Discover/DiscoverReadingMedia`, `src/components/Discover/DiscoverAudiobooks`, `src/components/ReadingDetails`, `src/components/BookDetails`, `src/components/AudiobookDetails`, `src/pages/discover/audiobooks`, `src/pages/audiobook/[audiobookId]`, `src/context/SettingsContext.tsx`, `src/pages/_app.tsx`
- DoD: `pnpm typecheck` pass, `pnpm lint` pass (0 errors), `pnpm test` pass (74/74)
- Notes: Bindery nested author mapping; 502/503 error propagation; shared reading route factory + UI; `audiobooksEnabled` public setting; `requestAudiobook()` + subscriber dispatch for audiobook subtype

## 2026-05-27 — phase2: Fix Book Downloader test (OpenAPI + Formik apiKey)

- Files: `seerr-api.yml`, `src/components/Settings/BookDownloaderModal/index.tsx`, `server/routes/settings/bookDownloader.ts`
- DoD: `pnpm typecheck` pass
- Notes: Test 400 fixed via minimal OpenAPI schema; 500 from SensitiveInput without `as="field"`; Add Server 400 from sending readOnly `id` in POST body — fixed with explicit submission object + save error toast

## 2026-05-27 — phase0+1: Bootstrap Seerr fork + Phase 1 foundation

- Files: MediaType, Media entity, migrations, settings schema, downloaders/types, Sidebar, MobileMenu, discover pages, en.json, request guards
- DoD: `pnpm typecheck` pass, `pnpm migration:run` pass (AddReadingMediaMetadataId)
- Notes: Reading requests return 501 until Phase 2; default app title set to Bookarr

## 2026-05-27 — cursor-rules: Adapt Lightbox rules for Bookarr/Seerr

- Files: `.cursor/rules/*.mdc` (15 files), removed `cursor/rules/` (Lightbox originals)
- DoD: All rule files written; obsolete python/fastapi/prisma rules deleted
- Notes: Rules relocated to `.cursor/rules/` for Cursor auto-loading
