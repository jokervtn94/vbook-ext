# Kiểm tra extension Vbook-Ext — 10/10/2026

Nguồn phát hành: `master`, catalog: `https://raw.githubusercontent.com/jokervtn94/vbook-ext/master/plugin.json`.

## Phạm vi và cách diễn giải

- 23 extension đang phát hành. Không xóa bất kỳ nguồn nào khi chỉ thấy CAPTCHA, Cloudflare, timeout hoặc HTTP lỗi ở đường dẫn thử nghiệm.
- CI kiểm tra script, hợp lệ manifest, cấu trúc gói và đồng bộ byte-for-byte giữa `plugin.zip` với nguồn `src/`.
- Kiểm tra live là HTTP read-only từ GitHub Actions, **không tương đương chạy Vbook trên Android**. Mục `chapter` đôi khi là input nội bộ để script chuyển thành API (ví dụ Qimao/Book QQ), do đó HTTP truy cập trực tiếp input có thể trả 404 mà extension vẫn đúng.
- `reachable` nghĩa là HTTP + nội dung trang nhận diện được, **không đồng nghĩa crawler lấy đủ chương hoặc tải được ảnh**.

## Kết quả HTTP trang chủ

- `reachable`: **21/23**.
- `challenge`: **1/23** — `shuba69` (69Shuba, Cloudflare). Người dùng đã xác nhận extension hoạt động trong Vbook sau bản v4.
- `javascript-app`: **1/23** — `wuxiaworld` (trang chủ cần JS; trang chi tiết/chương có SSR).
- Manga Read là `reachable`. Trước đây bị gắn nhãn nhầm `challenge` do trang HTML đầy đủ vẫn chứa một widget xác minh. Đã điều chỉnh logic kiểm tra.

## Ma trận HTTP mẫu (ảnh chụp chẩn đoán, không phải bài test Vbook)

| Extension | Trang chủ | Trang truyện mẫu | Chương mẫu |
|---|---|---|---|
| manhuavn | reachable | http-error | http-error |
| omegascans | reachable | no-sample | no-sample |
| tienvuc | reachable | no-sample | network-inconclusive |
| sayhentai | reachable | reachable | very-thin-html |
| tranh18 | reachable | reachable | reachable |
| hotruyen | reachable | reachable | network-inconclusive |
| qimao | reachable | reachable | http-error |
| acqq | reachable | reachable | reachable |
| manhuagui | reachable | reachable | reachable |
| doujins | reachable | reachable | reachable |
| bookqq | reachable | reachable | http-error |
| myrics | reachable | reachable | reachable |
| mangaread | reachable | reachable | reachable |
| sachhayonline | reachable | no-sample | no-sample |
| novelbuddy | reachable | reachable | reachable |
| dingdian | reachable | http-error | reachable |
| ciweimao | reachable | reachable | challenge |
| wuxiaworld | javascript-app | no-sample | no-sample |
| bfaloo | reachable | reachable | reachable |
| tadu | reachable | reachable | reachable |
| royalroad | reachable | no-sample | no-sample |
| shuba69 | challenge | challenge | challenge |
| uukanshu | reachable | reachable | reachable |

## Các chỉnh sửa đã phát hành

| Extension | Phiên bản | Thay đổi chính |
|---|---:|---|
| Book QQ | **4** | Chuẩn hóa cặp ID sách/chương; tạo URL mục lục thống nhất; thông báo API sách đã gỡ; thay chapter test cũ bằng `https://book.qq.com/book-read/39103283/1` |
| Qimao | **4** | Đọc tên tác giả từ `book.author` / `author_info.name`, không nhầm với `author_uid` |
| WuxiaWorld | **4** | Cập nhật SSR metadata, bộ chọn nội dung `.chapter-content`, API tìm kiếm và phân trang theo `searchAfter = ID truyện cuối trang trước` |
| UUKanShu | **2** | Chuẩn hóa URL chương tương đối và loại trùng chương (trước đợt kiểm tra này) |
| 69Shuba | **4** | Cơ chế thử WebView khi bị Cloudflare (đã có xác nhận từ người dùng) |

### Đã kiểm chứng trực tiếp ở API

- Book QQ: mục lục mẫu `bid=39103283` trả **1.239 chương**, chương miễn phí `cid=1` trả `code=0`, `chapterPrice=0` và có dữ liệu nội dung. Mẫu cũ `bid=38504732, cid=5` trả `code=-3001` (`书籍已下架` — sách đã được gỡ).
- Qimao: API `book/detail` trả `book.author=姑苏小七`; API `chapter-list` của sách mẫu có **3.498 chương**.
- WuxiaWorld: API trả `total=251` đầu sách nhưng giới hạn **100/trang**. Cursor số nguyên bằng ID cuốn cuối trang kế tiếp đã được thử thực tế: lượt 2 trả 100 mục không trùng lượt 1. Bản v4 sử dụng cursor này thay vì chỉ hiển thị trang đầu.
- WuxiaWorld: chương đầu `/novel/coiling-dragon/cd-book-1-chapter-1` có nội dung ở `.chapter-content`; selectors cũ `#chapter-content`, `.novel-body h2` không còn khớp.
- Manga Read: trang mẫu trả HTTP 200, ảnh bìa và danh sách chương trong HTML. Do đó không xem widget Cloudflare nhúng là lỗi chặn toàn bộ.
- CiWeiMao: chương VIP mẫu trả trang CAPTCHA; Say Hentai: chương mẫu từ runner bị Cloudflare 403.

## Việc còn phải xác minh trong Vbook

1. **WuxiaWorld mục lục**: trang SSR chỉ có liên kết chương đầu. Các chapter group được công bố trong dữ liệu ứng dụng nhưng không có danh sách đầy đủ. Bản v4 báo lỗi nếu tải thiếu chương, không nhận phần thiếu làm đầy đủ. Cần tìm API mục lục được website hỗ trợ hoặc kiểm tra WebView trên thiết bị.
2. **CiWeiMao/Say Hentai**: CAPTCHA và Cloudflare có thể khác theo IP và phiên người dùng; không dùng kết quả runner để kết luận extension đã chết.
3. **ManhuaVN/Qimao/Book QQ**: đối chiếu `src/test.json` với các API thực sự (không coi input biến đổi thành URL HTTP đích). Book QQ đã thay chapter sample đã gỡ.
4. **Các nguồn còn lại**: xác nhận end-to-end tìm kiếm → chi tiết → mục lục → mở chương → tải ảnh bằng Vbook thực tế trước khi đánh dấu hoàn toàn hoạt động.

## Nhật ký kiểm tra

- HTTP 23 nguồn: https://github.com/jokervtn94/vbook-ext/actions/runs/38035055234
- Chẩn đoán API WuxiaWorld, Qimao, Book QQ: https://github.com/jokervtn94/vbook-ext/actions/runs/38035092836
- Kiểm tra cursor WuxiaWorld: https://github.com/jokervtn94/vbook-ext/actions/runs/38035184953
- Chương Book QQ miễn phí: https://github.com/jokervtn94/vbook-ext/actions/runs/38035365957

Báo cáo chỉ ghi nhận những kiểm chứng có bằng chứng. Không suy diễn quyền truy cập chương trả phí hoặc khả năng vượt CAPTCHA.
