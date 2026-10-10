# Vbook-Ext — v4 chapter fixes (2026-10-10)

## Scope

Released on the independent `jokervtn94/vbook-ext` **master** branch after tests:

- **NovelBuddy v4:** obtain the novel ID from the site's public `__NEXT_DATA__` JSON, fetch the first-party `https://api.novelbuddy.me/titles/:mangaId/chapters`, deduplicate, and output oldest-to-newest. Never quietly report the first 20/50 chapters as a complete table of contents.
- **ManhuaVN v4:** on freely accessible `/doc-truyen/` chapter pages, collect `#chapcontent .page-chapter img[data-original]` rather than placeholder `/images/loading.gif`. Reject `.vip-lock` chapters (site/app-only) without trying to bypass them. Preserve legacy free-chapter API handling.
- Regenerated both plugin.zip files from committed source; updated their metadata.version and the root registry to **4**.

## Verification

**Real public endpoint observed:** the NovelBuddy API initially returned 285 chapters. In a later run it returned **282 valid chapters** while page statistics still said **285**; there were no numbering gaps within that returned range. The new crawler tolerates small (<5%) differences between the API and the site's possibly stale count, but rejects substantially incomplete lists.

**Live source tests:** [GitHub Actions](https://github.com/jokervtn94/vbook-ext/actions/runs/38024262529)
- NovelBuddy first-party public API: 282 chapters on the latest checked run; valid names, links, and descending chapter numbers
- ManhuaVN freely accessible pages: chapter 1 = 73 images, chapter 2 = 43, chapter 100 = 32, all using `data-original`
- ManhuaVN chapter 915: `.vip-lock`, zero free chapter images

**Mock Vbook runtime regression:** `node tests/test_vbook_regressions.js` validates API success, fallback incomplete warning, free page image URLs and locked page error. JavaScript syntax and ZIP/source byte matching are checked in CI.

## Limits

- Live HTTP/API checks and Node mock tests are **not** equivalent to exercising Vbook's embedded JavaScript engine on a real Android device.
- The website's available chapters can change; never promise a fixed count in the UI.
- Some ManhuaVN chapters remain app-only. The crawler must not bypass the publisher's restriction.
- The remaining extensions are not all verified. Continue priority-based source and parser checks.

## Test commands

```shell
node tests/test_vbook_regressions.js
python tools/check_package_sync.py novelbuddy manhuavn
python tools/audit_structure.py
python main.py --check
```

For live network checks, run GitHub Actions workflow **Live chapter source checks** manually.
