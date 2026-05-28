# Progress

Newest entries at the top.

## 2026-05-28 — phase2: fix Bookshelf add missing author foreignAuthorId

- Files: `server/api/downloaders/readarr/{buildAddPayload,normalizeForeignId,adapter,types}.ts`
- DoD: `pnpm typecheck` pass, `pnpm test` pass (buildAddPayload tests)
- Notes: Bookshelf /book/lookup often omits nested author; fall back to Hardcover foreignAuthorId from request and strip hc: prefix for Bookshelf metadata

## 2026-05-28 — phase2: fix Bookshelf add dispatch (edition lookup + search checkbox)

- Files: `server/api/metadata/hardcover/bookshelfLookupHints.ts`, `server/api/metadata/hardcover/client.ts`, `server/api/downloaders/readarr/adapter.ts`, `src/components/Settings/BookDownloaderModal/index.tsx`
- DoD: `pnpm typecheck` pass, `pnpm test` pass (8/8)
- Notes: Resolve hc: IDs via Hardcover edition IDs before Bookshelf /book/lookup; fix inverted Enable Automatic Search checkbox (was setting preventSearch=true when checked)

## 2026-05-28 — phase2: fix audiobook hc: detail 500s (Hardcover token fallback)

- Files: `server/api/downloaders/hardcoverClientForDownloader.ts`, `server/api/downloaders/{readarr,bindery}/adapter.ts`, `server/routes/reading/errors.ts`
- DoD: `pnpm typecheck` pass, `pnpm test` pass (9/9 downloader tests)
- Notes: Audiobook adapter now uses shared Hardcover token from book downloader; hc: IDs no longer fall through to Bookshelf lookup; missing token/not found return 503/404 instead of 500

## 2026-05-28 — phase2: Bookshelf (Readarr) downloader integration

- Files: `server/api/downloaders/readarr/*`, `server/api/downloaders/factory.ts`, `server/lib/settings/index.ts`, `server/routes/settings/bookDownloader.ts`, `src/components/Settings/{BookDownloaderModal,SettingsServices}.tsx`, `seerr-api.yml`, `tasks/todo.md`
- DoD: `pnpm typecheck` pass, `pnpm test` pass (6/6 readarr lookup tests); lint pre-existing failures only (unrelated files)
- Notes: Readarr adapter uses `POST /api/v1/book` with quality + metadata profiles and root folder; resolves `hc:` Hardcover IDs via Bookshelf `/book/lookup` (`edition:{id}`); provider selector in settings (Bookshelf/Readarr vs Bindery); retry failed requests after reconfiguring

## 2026-05-27 — phase3: fix book detail related sliders (author + similar)

- Files: `server/api/metadata/hardcover/client.ts`, `server/routes/reading/registerReadingMediaRelatedRoutes.ts`, `src/components/{ReadingDetails,Discover/ReadingMediaSlider,ServiceWorkerSetup}/index.tsx`, `seerr-api.yml`
- DoD: `pnpm typecheck` pass, `pnpm test` pass
- Notes: Hardcover `author_names` search returns null — author books now use GraphQL by author slug + general search fallback; pass `authorId` from book page; fix SWR infinite stuck loading (`initialSize: 1`, use hook `isLoading`); disable service worker in dev to stop offline-page noise on restart

## 2026-05-27 — phase3: fix NYT monthly list 500 + slider flash

- Files: `server/api/metadata/nyt/{client,encodeNytListSlug,encodeNytListSlug.test}.ts`, `server/routes/discoverReading.ts`, `server/lib/settings/migrations/0011_sync_nyt_list_slugs_from_overview.ts`, `src/components/ReadingDetails/index.tsx`
- DoD: `pnpm typecheck` pass, `pnpm test` pass (5/5 NYT slug tests)
- Notes: NYT `/lists/current/young-adult-paperback` returns 404 — encoded slug is `young-adult-paperback-monthly`; added overview fallback via `getListBooks()` + `matchNytOverviewList()`; migration 0011 syncs stored slugs on restart; book detail sliders no longer hide on empty/error

## 2026-05-27 — phase3: NYT Best Sellers discover + Reading Discover settings

- Files: `server/api/metadata/nyt/*`, `server/api/metadata/hardcover/client.ts`, `server/lib/settings/{index,migrations/0009_add_reading_discover.ts}`, `server/routes/{discoverReading,settings/readingDiscover}.ts`, `src/components/Settings/{SettingsReadingDiscover,SettingsLayout}.tsx`, `src/pages/settings/reading-discover.tsx`, `src/components/Discover/{ReadingDiscoverSliders,DiscoverReadingMedia,index}.tsx`, `server/interfaces/api/settingsInterfaces.ts`, `src/context/SettingsContext.tsx`, `seerr-api.yml`, `tasks/todo.md`
- DoD: `pnpm typecheck` pass, `pnpm lint` pass, `pnpm test` pass (82/82)
- Notes: NYT overview + current list APIs (May 2025 — no `/lists/names.json`); admin picks enabled lists at Settings → Reading Discover; NYT titles resolved to Hardcover via ISBN for request flow; Hardcover popular/trending optional toggles (popular off by default)

## 2026-05-27 — phase3: Hardcover popular/trending book discover sliders

- Files: `server/api/metadata/hardcover/{client,getHardcoverToken,getHardcoverToken.test}.ts`, `server/routes/discoverReading.ts`, `server/routes/discover.ts`, `server/constants/discover.ts`, `src/components/TitleCard/ReadingTitleCard.tsx`, `src/components/Discover/{ReadingMediaSlider,index,DiscoverReadingMedia,DiscoverBooks,DiscoverAudiobooks,constants,DiscoverSliderEdit}.tsx`, `seerr-api.yml`, `tasks/todo.md`
- DoD: `pnpm typecheck` pass, `pnpm test` pass (77/77)
- Notes: Popular/trending rows from Hardcover using existing downloader `hardcoverApiToken`; home Discover sliders + books/audiobooks pages; 15min server cache; sliders hide when token missing

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
