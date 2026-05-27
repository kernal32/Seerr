# Bookarr — Task List

## Phase 0 — Bootstrap

- [x] Clone seerr-team/seerr `develop` into repo root, `pnpm install`, verify `pnpm dev`

## Phase 1 — Foundation

- [x] Extend `MediaType` enum + TypeORM migration (`metadataId`)
- [~] Permissions + quotas for book/audiobook/comic/magazine (deferred: permission bitmask at 32-bit limit; uses `REQUEST` for reading media for now)
- [x] DownloaderAdapter interface + settings schema (`bookDownloaders`, `comicDownloaders`, `magazineDownloaders`)
- [x] Sidebar nav (Books, Audiobooks, Comics, Magazines) + i18n + placeholder discover pages

## Phase 2 — Books vertical slice

- [x] Bindery adapter (`server/api/downloaders/bindery/`)
- [x] Book downloader settings API + Services UI (`BookDownloaderModal`)
- [x] Book search/detail API + DiscoverBooks + BookDetails UI
- [x] `sendToBookDownloader` in MediaRequestSubscriber + `MediaRequest.requestBook()`
- [ ] Comic/magazine settings UI stubs (CRUD only; Kapowarr/LazyLibrarian adapters Phase 4/5)
- [x] Request list UI filter for `book` and `audiobook` types
- [ ] Full request modal parity (server/profile picker) — simplified direct POST for now

## Phase 3 — Audiobooks

- [x] Reuse book adapter with audiobook subtype + discover/detail pages
- [x] Hardcover popular/trending discover sliders (home + books/audiobooks pages)
- [x] NYT Best Sellers discover sliders + Settings → Reading Discover

## Phase 4 — Comics

- [ ] KapowarrAdapter + comic discover/detail/request flow

## Phase 5 — Magazines

- [ ] LazyLibrarianAdapter + magazine discover/detail/request flow

## Phase 6 — Availability sync

- [ ] Poll downstream downloaders for reading media status updates

## Phase 7 — Permissions (follow-up)

- [ ] Migrate `user.permissions` to bigint and add per-type reading media permission flags
