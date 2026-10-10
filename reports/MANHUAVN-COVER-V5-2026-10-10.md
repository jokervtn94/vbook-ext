# ManhuaVN cover image fix v5 — 2026-10-10

## User-reported issue
Book cover thumbnails were missing in Vbook while the ManhuaVN extension list otherwise loaded.

## Reproduction and verification
- The current public ManhuaVN source is `https://manhuavn2.com`.
- Website HTML supplies real covers through `https://admin.manhuavn2.com/Pictures/Truyen/Large/`; the list HTML frequently uses lazy `img[data-original]` while `img[src]` is only a loading placeholder.
- The public list API `https://mhvn.truyensieuhay.com/api/newstory/getBoLoc` returned 25 items on the test request. Its `StoryImage` values were relative image filenames, not complete URLs.
- Three API-derived cover URLs returned HTTP **200**, `image/jpeg`, JPEG magic bytes.
- A website detail cover returned HTTP **200**, JPEG. The image also returned HTTP 200 without a Referer header.
- These tests do not reproduce the Android Vbook image renderer or mobile connectivity. A device-side failure may still be caused by an image loader, network/DNS, caching or TLS behavior.

## Changes
- `manhuavn/src/config.js`: central cover normalizer for full and relative paths.
- `manhuavn/src/gen.js`: normalize public API image URLs, include `host`, and use `data-original` for HTML fallback covers instead of placeholder `loading.gif`.
- `manhuavn/src/source.js`: remove the extra slash (previously `.../Large//file.jpg`) from genre covers and add consistent `host`.
- `manhuavn/src/detail.js`: use the same cover normalization for full book details.
- `manhuavn/plugin.json`, root `plugin.json` and README: version **4 → 5**.
- Rebuilt `manhuavn/plugin.zip` from committed JavaScript and plugin manifest.

## Automated tests
- `node tests/test_manhuavn_covers.js` — home API cover, genre API cover, page HTML lazy cover fallback, host fields, duplicate slash guard.
- Existing `node tests/test_vbook_regressions.js` — free and app-locked chapters remain unchanged.
- `python tools/check_package_sync.py manhuavn` — ZIP matches source bytes.
- `python tools/audit_structure.py` — 40 folders, 35 published, **0 errors** (unpublished folder warnings remain).

[Public image investigation (GitHub Actions)](https://github.com/jokervtn94/vbook-ext/actions/runs/38027301422) and [v5 build / regression checks](https://github.com/jokervtn94/vbook-ext/actions/runs/38027507221).

## Device-side test after update
Refresh extension registry, update ManhuaVN to v5, re-open the catalog and detail pages. If thumbnails are still blank, open an original cover URL from the same mobile phone browser to distinguish extension output from mobile image connectivity. Avoid assuming the bug is fixed on Android solely from CI.
