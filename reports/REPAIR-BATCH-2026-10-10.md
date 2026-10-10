# Vbook-Ext — source fixes and retirements (2026-10-10)

> **Lịch sử:** bảng dưới đây ghi lại đợt sửa v3. NovelBuddy v4 và ManhuaVN v4 khắc phục thêm lỗi TOC/chương miễn phí; xem [báo cáo v4](VBOOK-V4-CHAPTERS-2026-10-10.md).

## Change summary
- Published registry: **41 → 35** extensions on `master`.
- Physically removed from Git working tree: `tsumino`, `sttruyen`, `truyengg`, `lightnovel`, `vipbns` (five directories, recoverable from Git history).
- Unpublished but preserved: `baotangtruyen` (new domain not verified).
- Migrated and rebuilt ZIPs: `tranh18` v2, `novelbuddy` v3, `manhuavn` v3.
- Source URL / ZIP only updated: `sayhentai` v10 → sayhentai.cx; **Cloudflare 403 means crawler remains unverified**.
- `manhwahentai` retained because its live domain returned a reader page (HTTP 200). Earlier assumption of death was wrong.

## Verified source contracts
GitHub Actions: [12/12 live HTML checks passed](https://github.com/jokervtn94/vbook-ext/actions/runs/38023320714).

| Extension | Source URL | Verified | Limitations |
|---|---|---|---|
| Tranh18 v2 | https://tranh18.cc/ | list, detail, TOC (12 chapters sampled), 87 chapter images | Browser/HTTP smoke only, Vbook app runtime untested; search optional removed |
| NovelBuddy v3 | https://novelbuddy.me/ | latest list (24 titles), detail, TOC links, HTML chapter paragraphs | Full TOC pagination not verified; legacy search/genre disabled instead of showing broken options |
| ManhuaVN v3 | https://manhuavn2.com/ | public list, detail, TOC, legacy genre API (19 records) | Some chapter pages explicitly require site's own mobile app; backend free chapter API needs on-device test |
| SayHentai v10 | https://sayhentai.cx/ | original URL redirects to new domain | Cloudflare blocks CI (HTTP 403). ZIP builds and syntax pass but actual extraction not established |

All migrated JS passed `node --check`. ZIPs rebuilt from current `src/` + `plugin.json`, checked for valid structure, version, and byte-level sync. The CI workflow runs these checks for future changes.

## Why other sources were not deleted
Sources that timed out, used a different hostname, or returned Cloudflare 403 may still function in a browser or the mobile client. They remain in the repository until evidence of actual shutdown, with full Git history preserved.

Current unresolved source: `baotangtruyen` (unpublished). Original unlisted source folders: `knoxt`, `mtlnovel`, `truyensieuhay`, `webnovel`.

## What these tests do not prove
A 200 response and matched CSS selector are not enough to establish correct `Response.success(...)` behavior inside Vbook's JavaScript engine. Test the real app on Home → Detail → TOC → Chapter, including pagination, paid chapters, images, anti-bot flows, and output metadata before marking full functionality as verified.
