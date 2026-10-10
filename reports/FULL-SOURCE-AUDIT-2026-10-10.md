# Vbook-Ext — full active-source audit (2026-10-10)

> **ĐÍNH CHÍNH MỚI:** Kiểm tra chi tiết cho thấy `manhwahentai.me` hiện là thư viện ảnh AI với route `/post/`, không còn cấu trúc truyện WordPress của extension. Extension ManhwaHentai đã ngừng phát hành trong [Reader audit & repair](READER-AUDIT-AND-REPAIRS-2026-10-10.md). Nhận định HTTP 200 trong báo cáo cũ không chứng minh crawler hoạt động.

> **Bản cập nhật ngày 10/10/2026:** Theo yêu cầu chủ repository, các nguồn chỉ có lỗi timeout, Cloudflare 403, DNS/SSL cũng được **loại khỏi danh mục phát hành**, dù chưa có bằng chứng website đóng cửa vĩnh viễn. Bản kiểm tra và quyết định mới: [PRUNE-UNREACHABLE-2026-10-10.md](PRUNE-UNREACHABLE-2026-10-10.md). Dữ liệu kiểm tra bên dưới là ảnh chụp lịch sử khi còn 35 extension.

## Scope and evidence

- Registry before this batch: **35 published extensions**; 5 unpublished folders also sampled.
- Real-time homepage HTTP/DNS/redirect scan: [GitHub Actions #38027867470](https://github.com/jokervtn94/vbook-ext/actions/runs/38027867470).
- Deep domain checks (MonkeyD, Giáng Thế, Đọc Sách Hay): [GitHub Actions #38027954932](https://github.com/jokervtn94/vbook-ext/actions/runs/38027954932).
- HTTP 200 means the source **responded**, not that list/detail/TOC/chapter Vbook parsers work; Cloudflare/timeout ≠ shutdown.

## Decision

- **Removed** `docsachhay` from registry and Git working tree (restore possible via Git history). `docsachhay.net` returned a redirect to `ww19.docsachhay.net` (other run: `www` → `ww547.docsachhay.net`); parked-like page displayed generic book search/promotions instead of a chapter catalog. Current crawler's `/cat/` and content selectors are for the former site.
- **Paused/unpublished** `giangthe` from registry; source folder retained. `giangthe.com` produced DNS resolution errors in independent runs; no verified replacement domain could be established. Not asserted permanently shut down.
- Retained all 5 anti-bot and 6 other network-inconclusive sources. A browser may access them despite CI failure.
- Retained `monkeyd` on original URL pending a verified crawler migration. A real MonkeyD site is indexed at `https://www.monkeydd.com/`, but CI returned Cloudflare 403 on its home, listing and search routes; older `monkeyd.vn` also returned challenge. **Do not blindly swap hosts.**
- Filled **12 missing root catalog `type`/`locale` pairs** using each package's own `plugin.json`; strengthened registry validation for future releases.
- New registry size: **33 extensions**. Package versions unchanged; no JavaScript package rebuilt in this metadata/pruning-only batch.

## Per-extension homepage screening

| Folder | Outcome (10 Oct 2026) | HTTP / network | Evidence / limitation |
|---|---|---|---|
| `manhuavn` | WEB_VISIBLE | HTTP 200 | Title: Truyện tranh online - Đọc truyện manhua tại manhuavn2.com |
| `monkeyd` | UNVERIFIED | ConnectTimeout | Cannot confirm source state |
| `omegascans` | WEB_VISIBLE | HTTP 200 | Title: Omega Scans - High Quality Comics and Novels |
| `123truyen` | ANTI_BOT | HTTP 403 | Cloudflare / antibot page |
| `tienvuc` | WEB_VISIBLE | HTTP 200 | Title: Truyện dịch online - Đọc truyện dịch mới nhất \| Tiên Vực |
| `truyenconvert` | UNVERIFIED | ReadTimeout | Cannot confirm source state |
| `docsachhay` | REMOVED | HTTP 200 | Redirect to http://ww19.docsachhay.net; generic parked-like page |
| `sayhentai` | WEB_VISIBLE | HTTP 200 | Title: Truyện Hentai 18+ Full Tiếng Việt Mới Nhất \| SayHentai |
| `tranh18` | WEB_VISIBLE | HTTP 200 | Title: Truyện tranh 18, Manhwa 18, adult, Tranh18 người lớn-Truyện Tranh 18 |
| `giangthe` | PAUSED | ConnectionError | DNS unresolved; new domain not verified |
| `hotruyen` | WEB_VISIBLE | HTTP 200 | Title: Cập nhật Nam sinh \| Hố Truyện \| Trang web đọc truyện online miễn phí |
| `zingtruyen` | ANTI_BOT | HTTP 403 | Cloudflare / antibot page |
| `qimao` | WEB_VISIBLE | HTTP 200 | Title: 七猫中文网-全本免费小说-免费小说排行榜 |
| `acqq` | WEB_VISIBLE | HTTP 200 | Title: 腾讯动漫官网_漫画在线阅读_免费下拉式看漫画平台 |
| `manhuagui` | WEB_VISIBLE | HTTP 200 | Title: å¨çº¿çæ¼«ç»_é£æ¼«ä¹ç»_å¦å¤å¦éª - çæ¼«ç» |
| `hetushu` | ANTI_BOT | HTTP 403 | Cloudflare / antibot page |
| `doujins` | WEB_VISIBLE | HTTP 200 | Title: Doujins.com \| English-Translated Hentai, No Ads |
| `bookqq` | WEB_VISIBLE | HTTP 200 | Title: 小说,小说网,最新热门小说-QQ阅读_阅文集团旗下网站 |
| `myrics` | WEB_VISIBLE | HTTP 200 | Title: 米國度創作平台 |
| `20xs` | UNVERIFIED | ConnectionError | Cannot confirm source state |
| `mangaread` | WEB_VISIBLE | HTTP 200 | Title: Read online - manga, manhwa, manhua catalog №1 |
| `sachhayonline` | WEB_VISIBLE | HTTP 200 | Title: SachHayOnline.com \| Đọc Sách Online \| Thư viện sách online |
| `novelbuddy` | WEB_VISIBLE | HTTP 200 | Title: NovelBuddy— Read Web Novels & Light Novels Online Free |
| `dingdian` | WEB_VISIBLE | HTTP 200 | Title: 顶点小说_顶点小说网_顶点小说阅读网 |
| `ciweimao` | WEB_VISIBLE | HTTP 200 | Title: 刺猬猫阅读 |
| `wuxiaworld` | WEB_VISIBLE | HTTP 200 | Title: Wuxiaworld |
| `kissaway` | ANTI_BOT | HTTP 403 | Cloudflare / antibot page |
| `manhwahentai` | WEB_VISIBLE | HTTP 200 | Title: Free Manhwa Hentai & Hentai Manhwa Updated Live |
| `bfaloo` | WEB_VISIBLE | HTTP 200 | Title: 小说,小说网-飞卢小说网\|同人小说【好看的免费小说网】 |
| `tadu` | WEB_VISIBLE | HTTP 200 | Title: 小说,小说网-塔读小说网\|免费阅读最新热门小说 |
| `royalroad` | WEB_VISIBLE | HTTP 200 | Title: Home \| Royal Road |
| `ztruyen` | ANTI_BOT | HTTP 403 | Cloudflare / antibot page |
| `docsach24` | UNVERIFIED | ConnectionError | Cannot confirm source state |
| `8ternal` | UNVERIFIED | ConnectionError | Cannot confirm source state |
| `vozer` | UNVERIFIED | SSLError | Cannot confirm source state |

## Additional notes

- `acqq` redirects from mobile `m.ac.qq.com` to reader `ac.qq.com` and returns content, but its selectors are not necessarily current.
- `wuxiaworld.com` gave 200 but a JavaScript shell (0 document links): Vbook parser must be tested separately.
- `manhwahentai.me` is still a real 200-response manhwa site and remains published.
- `sayhentai.cx` delivered a reader homepage (200) during this run; Cloudflare handling may vary per network.
- A `giangthe` folder still exists for recovery. `baotangtruyen`, `knoxt`, `mtlnovel`, `truyensieuhay`, `webnovel` were already unpublished and kept unchanged.
- Static inspection showed several extensions with historical domains/API hosts in source code; these are not automatically changed without complete reader tests.

## Safe follow-up checklist

1. For each retained source, test actual Vbook **Home → List → Detail → TOC → Chapter**, including images; an HTTP homepage check cannot prove these.
2. Prioritize `monkeyd` (replacement appears available but anti-bot), `123truyen`, `zingtruyen`, `kissaway`, `ztruyen`, `hetushu` (challenges); and `20xs`, `truyenconvert`, `docsach24`, `8ternal`, `vozer` (network errors).
3. Restore retired/paused entries only if an actual public reading domain and chapter response can be confirmed.

**Count reconciliation:** WEB_VISIBLE=22, UNVERIFIED=6, ANTI_BOT=5, REMOVED=1, PAUSED=1. Totals: 35 originals → 33 published.
