# Pruning unverified and inaccessible Vbook sources (2026-10-10)

## Decision and scope

Per the maintainer's explicit authorization, retire all **11 published extensions** that were unreachable on the user's device or could not be verified through repeated network checks (Cloudflare 403, SSL/DNS, connection/timeout). This is an intentional **catalog maintenance policy**, not a claim that every website is permanently shut down.

- **4 confirmed inaccessible by app user:** `monkeyd`, `123truyen`, `truyenconvert`, `20xs`.
- **4 anti-bot / Cloudflare 403 in CI:** `zingtruyen`, `hetushu`, `kissaway`, `ztruyen`.
- **3 unresolved network / TLS / DNS:** `docsach24`, `8ternal`, `vozer`.
- **4 previously unpublished/unverified folders also deleted:** `baotangtruyen`, `giangthe`, `mtlnovel`, `truyensieuhay`. These were already absent from the public registry.

Total deletion from Git working tree: **15 source folders** (complete contents, manifest, icon, source scripts and ZIP, if present). **33 → 22 published extensions**; **39 → 24 extension folders**. Files remain recoverable via Git history.

## Exceptions: retained and unpublished

- `knoxt`: its **real manifest** points to `https://knoxt.space`, not the mistakenly probed `knoxt.org`. Its source site published a readable chapter on **10 October 2026** (https://knoxt.space/cant-go-back-to-that-summer-chapter-10/), so the source is **retained**. It is *not yet published* because `knoxt/plugin.zip` is missing; no claim of a working Vbook crawler.
- `webnovel`: the site `https://www.webnovel.com` returned HTTP 200 with content. Source retained but still unpublished.

## Kept published (22)

- `manhuavn` — ManhuaVN [Free Chap] v5 (https://manhuavn2.com)
- `omegascans` — Omega Scans v1 (https://omegascans.org)
- `tienvuc` — Tiên Vực v13 (https://tienvuc.me)
- `sayhentai` — Say Hentai v10 (https://sayhentai.cx)
- `tranh18` — Tranh 18 v2 (https://tranh18.cc)
- `hotruyen` — Hố Truyện v5 (https://hotruyen1.com)
- `qimao` — Qimao v2 (https://www.qimao.com)
- `acqq` — AC QQ v1 (https://m.ac.qq.com)
- `manhuagui` — Manhua Gui v4 (https://www.manhuagui.com)
- `doujins` — DouJins v5 (https://doujins.com)
- `bookqq` — Book QQ v1 (https://book.qq.com)
- `myrics` — Myrics v1 (https://www.myrics.com)
- `mangaread` — Manga Read v2 (https://www.mangaread.org)
- `sachhayonline` — SachHayOnline v2 (https://www.sachhayonline.com/)
- `novelbuddy` — Novel Buddy v4 (https://novelbuddy.me)
- `dingdian` — Dingdian 【顶点】 v1 (https://www.dingdian666.com)
- `ciweimao` — CiWeiMao 【刺猬猫】 v3 (https://www.ciweimao.com)
- `wuxiaworld` — Wuxia World v1 (https://www.wuxiaworld.com)
- `manhwahentai` — ManhwaHentai v3 (https://manhwahentai.me)
- `bfaloo` — bFaloo v5 (https://b.faloo.com)
- `tadu` — Tadu (塔读) v2 (https://www.tadu.com)
- `royalroad` — Royalroad v1 (https://www.royalroad.com)

## Verification basis

- Full 35-source HTTP scan: https://github.com/jokervtn94/vbook-ext/actions/runs/38027867470
- Focused checks: https://github.com/jokervtn94/vbook-ext/actions/runs/38027954932
- Prior audit with individual source statuses: [FULL-SOURCE-AUDIT-2026-10-10.md](FULL-SOURCE-AUDIT-2026-10-10.md)

Potentially live domains returning Cloudflare 403 or timeouts can be reactivated in a future version only after a working website and reader crawler are verified. The previous packages are preserved in Git history, **not** in the active public catalog. Refreshing the Vbook extension URL does not necessarily uninstall an extension that was already installed.

## Reproducible validation

```shell
python tools/validate_extensions.py
python tools/audit_structure.py
python main.py --check
node tests/test_vbook_regressions.js
node tests/test_manhuavn_covers.js
python tools/check_package_sync.py manhuavn tranh18 novelbuddy sayhentai
```
