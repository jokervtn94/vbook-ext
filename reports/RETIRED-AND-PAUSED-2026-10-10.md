# Retired and paused Vbook extensions — 2026-10-10

The public registry has been reduced to **35 entries**. No active package is deleted by an HTTP timeout alone.

## Deleted from working tree (recoverable from Git history)
- `tsumino`: original site https://www.tsumino.com/ explicitly states it shut down (https://www.tsumino.com/).
- `sttruyen`: https://sttruyen.com/ now displays a parked / for-sale domain.
- `truyengg`: https://truyengg.com/ redirects to an unrelated ad/parking domain; proposed foxtruyen2.com does as well.

Each removed directory contained its scripts, icon, manifest and ZIP. Source can be recovered via a previous commit.

## Unpublished, code retained pending further verification
- `vipbns`: bnsvip.net is parked, but the extension also calls a separately hosted API (`be-app-vip.com`); not verified dead.
- `lightnovel`: quykiep.com now shows a broad document/SEO portal; original crawler selectors unlikely match. A replacement site is unverified.
- `baotangtruyen`: prior URL parked, alternative baotangtruyen32.top did not yield a verifiable reader. Version and source remain in its local manifest.

These three can be reinstated once a valid data source and end-to-end chapter test are confirmed.

## Verification required for remaining extensions
A valid homepage or an HTTP 200 response does not demonstrate a functioning Vbook crawler.
For each repaired extension, test home, search, detail, toc, chap, and rebuild the ZIP with a version increment.
