# Vbook — Kiểm tra toàn bộ extension đang phát hành, 10/10/2026

## Phạm vi / phương pháp

- Quét **22/22** domain nguồn theo danh mục trước batch; xác nhận HTTP status, HTML title, liên kết, hình ảnh mẫu, script tham chiếu và chạy `node --check` từng JavaScript.
- Đối chiếu các trang truyện/mục lục/chương cụ thể cho Omega Scans, SachHayOnline, ManhuaVN (đã kiểm tra trước), Hố Truyện, SayHentai và Tencent AC QQ; kiểm tra dữ liệu HTML danh mục cho các nguồn còn lại.
- Web status HTTP 200 **không chứng nhận extension hoạt động**; ảnh logo thành công **không** đồng nghĩa ảnh bìa truyện thành công; Cloudflare 403 trên chương không đồng nghĩa website chết.
- **Không có kiểm thử runtime Vbook Android với các extension sửa lần này**; kết quả là live website probes + kiểm tra script bằng Node + ZIP đồng bộ.

## Bản sửa có căn cứ

| Extension | Trước | Sau | Sửa chữa / chứng cứ |
|---|---:|---:|---|
| Omega Scans | v1 | v2 | Thiếu `config.js`, `gen.js`, `/latest` trả 404. Viết lại home/list, bìa Next.js, detail, 37 chapters và `img[data-fallback-index]`; ngừng quảng bá search API chưa xác minh |
| AC QQ | v1 | v2 | `gen.js` sai cú pháp; m.ac.qq.com chuyển sang ac.qq.com. Phục hồi danh sách với `a.mod-cover-list-thumb` và `img[data-original]`; detail có 150 link chương mẫu, một số chức năng đọc tài khoản phải kiểm thử Vbook |
| Book QQ | v1 | v2 | `chap.js` và `toc.js` không parse; sửa nhánh chapter VIP và nhãn Free/VIP |
| Tiên Vực | v13 | v14 | Chống crash `next.toString()` khi kết thúc và sửa tính tổng trang đúng bội số 10 |
| Myrics | v1 | v2 | Chống crash trang cuối trong `gen.js`/`source.js`, sửa host sai `tienvuc.vn` về `myrics.com` |
| SachHayOnline | v2 | v3 | `gen.js` xóa nhầm hai ký tự đầu URL; `toc.js` tạo link lỗi; `chap.js` thêm `.html` gây 404 và lấy thiếu đoạn. Đã đối chiếu sách Ái tình miếu chương 1, HTML đầy đủ và bìa chi tiết |
| Dingdian | v1 | v2 | Danh mục chỉ có text nhưng extension lấy một ảnh bìa của truyện khác cho tất cả mục; bỏ bìa giả, chuẩn hóa ảnh thật trang chi tiết |

**ManhwaHentai (v3) được ngừng phát hành và xóa source trong working tree**: domain `manhwahentai.me` hiện chuyển nội dung sang kho ảnh AI `/post/...` và `/tags/...`, không còn lộ trình truyện nhiều chương WordPress `/webtoon-genre` / `.wp-manga-chapter` mà extension sử dụng. Giữ được toàn bộ file lịch sử trên Git. Dù trang HTTP200, không thể coi nó là nguồn truyện hoạt động.

## Nguồn chưa kết luận hoạt động trọn vẹn

- **Hố Truyện**: web list/search/detail/mục lục đều có dữ liệu; toc có 12 chương được ghim phía trước 1440 chương chính nên code bỏ qua 12 đầu là có chủ đích; ảnh detail của mẫu có thể là ảnh placeholder do website.
- **Say Hentai**: web detail, bìa và danh sách chương truy cập được; thử một URL chương cụ thể gặp Cloudflare HTTP403 từ CI, không kết luận nội dung trang có lỗi hay không.
- **WuxiaWorld**: home HTTP200 nhưng HTML chưa có nội dung truyện khi chưa chạy JavaScript; script Vbook cũ có thể không còn khớp.
- **Myrics, BookQQ, Tiên Vực**: HTTP site hợp lệ và sửa lỗi JavaScript rõ ràng, nhưng các API đặc thù và nội dung chương có yêu cầu phiên đăng nhập hoặc có thể thay đổi, chưa có bảo chứng end-to-end.
- **Qimao, ManhuaGui, DouJins, MangaRead, CiWeiMao, bFaloo, Tadu, Royalroad, cùng các extension chưa được thử từng chương**: website trả nội dung, nhưng chưa kiểm thử hoàn chỉnh bằng engine Vbook; chưa tự ý tăng phiên bản nếu không thay source.

## Phát hành

- Registry **22 → 21**; danh mục, README và tất cả ZIP đã sửa phải đồng bộ cùng version.
- Có thể phục hồi ManhwaHentai bằng Git history nếu xuất hiện website truyện tương thích.
- Công cụ `tools/check_published_scripts.py` được bổ sung vào CI nhằm kiểm tra cú pháp và các file `load()`/script cho **toàn bộ** extension phát hành thay vì chỉ 4 thư mục.
- Sau update, người dùng làm mới URL repo trong Vbook, cài bản version mới và thử `Home → Detail → TOC → Chapter`; nếu ảnh/chương trống, cần ảnh màn hình và log thực Vbook.
