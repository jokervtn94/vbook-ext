# Retired and paused Vbook extensions — 2026-10-10

The public registry has been reduced to **35 entries**. No active package is deleted by an HTTP timeout alone.

## Deleted from working tree (recoverable from Git history)
- `tsumino`: original site https://www.tsumino.com/ explicitly states it shut down (https://www.tsumino.com/).
- `sttruyen`: https://sttruyen.com/ now displays a parked / for-sale domain.
- `truyengg`: https://truyengg.com/ redirects to an unrelated parking domain; proposed foxtruyen2.com also redirects outside the reading service.
- `lightnovel`: old source https://quykiep.com/truyen-dich-ds and /truyen-convert-ds now return 404; domain changed to a generic portal.
- `vipbns`: bnsvip.net is parked. Independently hosted API be-app-vip.com failed a TLS request from CI; no working public source could be verified.

Each removed directory contained its scripts, icon, manifest and ZIP. Source can be recovered via a previous commit.

## Unpublished, code retained pending further verification
- `baotangtruyen`: prior URL parked, alternative baotangtruyen32.top did not yield a verifiable reader. Version and source remain in its local manifest.

These three can be reinstated once a valid data source and end-to-end chapter test are confirmed.

## Verification required for remaining extensions
A valid homepage or an HTTP 200 response does not demonstrate a functioning Vbook crawler.
For each repaired extension, test home, search, detail, toc, chap, and rebuild the ZIP with a version increment.

## Additional verification
- `manhwahentai` is **still a content website** (HTTP 200, proper title on 2026-10-10); it must not be deleted based on the earlier tentative audit.
- `sayhentai.one` redirects to `sayhentai.cx` (Cloudflare challenge, HTTP 403 in CI); not marked dead.
