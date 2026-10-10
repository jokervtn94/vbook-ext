# Vbook-Ext: Báo cáo rà soát website nguồn — 2026-10-10

**Phạm vi**: 41 extension đang xuất hiện trong `plugin.json` tại thời điểm kiểm tra (trước khi tạo `master` riêng) tại thời điểm kiểm tra. Bốn extension lưu trong repo nhưng chưa được công bố không thuộc mẫu số 41.

> **ĐÍNH CHÍNH (10/10/2026):** Đây là báo cáo sàng lọc nguồn web, không phải kết quả kiểm thử Vbook. Kiểm tra lại cùng ngày cho thấy:
> - `https://foxtruyen2.com/truyen-moi-cap-nhat.html` chuyển tiếp đến domain không phải nguồn truyện; **không được tự động cập nhật `truyengg` sang foxtruyen2.com**.
> - `https://novelbuddy.com/latest` *và* `https://novelbuddy.me/latest` đều có nội dung được ghi nhận; **không được kết luận novelbuddy.com đã chết** chỉ dựa trên một redirect.
> - `https://manhuavn2.com/` và `https://tranh18.cc/update` có trang truyện; cần kiểm tra lại API, selector và chương trước khi đổi URL trong extension.
> - Vì bằng chứng thay đổi, các nhóm `DOMAIN_MOVED` / `REPLACE_OR_RETIRE` dưới đây chỉ là **ưu tiên rà soát**, không phải quyết định thay domain được phép thực hiện ngay.
## Kết quả

| Nhóm | Số lượng | Ý nghĩa |
|---|---:|---|
| WEB_VISIBLE | 18 | Có bằng chứng trang nguồn trả nội dung truyện hoặc ứng dụng đọc sách (một số bằng chứng từ chỉ mục gần đây); **chưa xác minh Vbook crawler hoạt động** |
| DOMAIN_MOVED | 4 | Nguồn redirect sang host khác; cần đồng bộ cấu hình, đường dẫn sinh bởi scraper và đối chiếu selector/API |
| REPLACE_OR_RETIRE | 6 | Nguồn ngừng, domain parked, domain dùng cho dịch vụ khác hoặc rõ ràng không giống nguồn đọc truyện cũ; cần sửa/tìm nguồn khác hoặc ngừng hỗ trợ |
| UNVERIFIED | 13 | Không có đủ bằng chứng trực tiếp gần đây để kết luận (timeout, chặn bot, subdomain khác, index cũ) |

**Kết luận thận trọng**: 10/41 extension thuộc diện **cần xử lý ưu tiên** ở mức nguồn website; 13/41 **cần kiểm tra bổ sung**; 18/41 **có tín hiệu website còn hoạt động**. Không được ghi 18 là 'extension đã chạy thử thành công'. Số extension đã kiểm thử trọn vẹn luồng Vbook: **0/41**.

## Danh sách chi tiết

| # | Thư mục | Tên | Trạng thái | Quan sát / hành động | Trang chứng cứ |
|---:|---|---|---|---|---|
| 1 | `truyengg` | Truyện GG | `DOMAIN_MOVED` | Trang chủ chuyển hướng đến foxtruyen2.com; tuyến /truyen-moi-cap-nhat.html còn nội dung, nhưng `src/config.js` vẫn dùng truyengg.com. | [Nguồn](https://foxtruyen2.com/truyen-moi-cap-nhat.html) |
| 2 | `manhuavn` | ManhuaVN [Free Chap] | `DOMAIN_MOVED` | Trang chủ chuyển hướng đến manhuavn2.com; extension còn gọi API độc lập `mhvn.truyensieuhay.com` và ảnh `admin.manhuavn.top` (chưa xác thực). | [Nguồn](https://manhuavn2.com/) |
| 3 | `lightnovel` | LightNovel VN | `REPLACE_OR_RETIRE` | quykiep.com nay hiển thị portal tổng hợp/SEO, không tương ứng chắc chắn với trang truyện trước đây; `src/gen.js` vẫn lọc `.flex[itemtype='https://schema.org/Book']`. | [Nguồn](https://quykiep.com/) |
| 4 | `monkeyd` | MonkeyD VN | `UNVERIFIED` | Trang chủ không mở được qua công cụ; có trang truyện được máy tìm kiếm ghi nhận ~5 tháng trước, chưa xác thực hiện tại. | [Nguồn](https://monkeyd.net.vn/tim-kiem?page=9) |
| 5 | `omegascans` | Omega Scans | `WEB_VISIBLE` | Trang web trả nội dung truyện. | [Nguồn](https://omegascans.org/) |
| 6 | `123truyen` | 123 Truyện | `WEB_VISIBLE` | Trang chủ không mở được bằng công cụ, nhưng mục danh sách truyện được lập chỉ mục trong tuần qua. | [Nguồn](https://123truyen.vn/danh-sach/truyen-full) |
| 7 | `tienvuc` | Tiên Vực | `WEB_VISIBLE` | Trang truyện hiển thị bình thường. | [Nguồn](https://tienvuc.me/) |
| 8 | `truyenconvert` | Truyện Convert | `UNVERIFIED` | Không truy cập/không tìm được bằng chứng mới đáng tin cậy. | [Nguồn](https://truyenconvert.net) |
| 9 | `docsachhay` | Đọc Sách Hay | `UNVERIFIED` | Không truy cập/không tìm được bằng chứng mới đáng tin cậy. | [Nguồn](https://docsachhay.net) |
| 10 | `baotangtruyen` | Bảo Tàng Truyện | `REPLACE_OR_RETIRE` | Địa chỉ chuyển đến `ww547.baotangtruyen14.com` (dạng domain đỗ), không xác nhận thư viện truyện hoạt động. | [Nguồn](https://baotangtruyen14.com/) |
| 11 | `sayhentai` | Say Hentai | `UNVERIFIED` | Không truy cập được bằng công cụ; chưa kết luận trạng thái máy chủ. | [Nguồn](https://sayhentai.one) |
| 12 | `tranh18` | Tranh 18 | `DOMAIN_MOVED` | Trang chủ đổi sang tranh18.cc; đường dẫn `/update` trên domain mới có danh sách, `src/config.js` vẫn dùng tranh18.com. | [Nguồn](https://tranh18.cc/update) |
| 13 | `giangthe` | Giáng Thế | `UNVERIFIED` | Không truy cập/không tìm được bằng chứng mới đáng tin cậy. | [Nguồn](https://giangthe.com) |
| 14 | `hotruyen` | Hố Truyện | `WEB_VISIBLE` | Trang truyện hoạt động và có nội dung. | [Nguồn](https://hotruyen1.com/) |
| 15 | `zingtruyen` | Zing Truyện | `UNVERIFIED` | Không truy cập/không tìm được bằng chứng mới đáng tin cậy. | [Nguồn](https://zingtruyen.store) |
| 16 | `sttruyen` | ST Truyện | `REPLACE_OR_RETIRE` | Domain hiển thị trang parking / có thể bán; `src/home.js` còn dùng các URL `/cat/...` cũ. | [Nguồn](https://sttruyen.com/) |
| 17 | `qimao` | Qimao | `WEB_VISIBLE` | Trang chủ có danh sách tiểu thuyết. | [Nguồn](https://www.qimao.com/) |
| 18 | `acqq` | AC QQ | `WEB_VISIBLE` | Trang chủ m.ac.qq.com hiển thị truyện tranh. | [Nguồn](https://m.ac.qq.com/) |
| 19 | `manhuagui` | Manhua Gui | `WEB_VISIBLE` | Trang chủ có danh sách truyện. | [Nguồn](https://www.manhuagui.com/) |
| 20 | `hetushu` | Hetushu 和图书 | `WEB_VISIBLE` | Trang chủ có danh sách truyện. | [Nguồn](https://www.hetushu.com/) |
| 21 | `doujins` | DouJins | `WEB_VISIBLE` | Trang web có thư viện truyện. | [Nguồn](https://doujins.com/) |
| 22 | `bookqq` | Book QQ | `WEB_VISIBLE` | Website QQ Reading có dữ liệu truyện. | [Nguồn](https://book.qq.com/) |
| 23 | `myrics` | Myrics | `UNVERIFIED` | `www.myrics.com` hiển thị nội dung hôm nay, nhưng hostname trong catalog là `myrics.com` và truy cập apex thất bại; cần so sánh. | [Nguồn](https://www.myrics.com/) |
| 24 | `20xs` | 20xs | `WEB_VISIBLE` | Máy tìm kiếm ghi nhận nội dung 20xs.org trong tháng gần đây; mở trực tiếp thất bại. | [Nguồn](https://www.20xs.org/quanbuxiaoshuo/) |
| 25 | `mangaread` | Manga Read | `WEB_VISIBLE` | Website có danh sách manga. | [Nguồn](https://www.mangaread.org/) |
| 26 | `sachhayonline` | SachHayOnline | `WEB_VISIBLE` | Thư viện sách hiển thị nội dung. | [Nguồn](https://www.sachhayonline.com/) |
| 27 | `novelbuddy` | Novel Buddy | `DOMAIN_MOVED` | Redirect sang novelbuddy.me, trang `/latest` mới hoạt động; `src/gen.js` và `detail.js` vẫn hardcode novelbuddy.com. | [Nguồn](https://novelbuddy.me/latest) |
| 28 | `tsumino` | TsuMiNo | `REPLACE_OR_RETIRE` | Trang chủ chính thức thông báo ngừng hoạt động hoàn toàn. | [Nguồn](https://www.tsumino.com/) |
| 29 | `dingdian` | Dingdian 【顶点】 | `WEB_VISIBLE` | Trang chủ hiển thị thư viện. | [Nguồn](https://www.dingdian666.com/) |
| 30 | `ciweimao` | CiWeiMao 【刺猬猫】 | `UNVERIFIED` | www.ciweimao.com không mở được qua công cụ nhưng `wap.ciweimao.com` có nội dung; cần kiểm tra URL/anti-bot. | [Nguồn](https://wap.ciweimao.com/) |
| 31 | `vipbns` | 【VIP】Bạch Ngọc Sách | `REPLACE_OR_RETIRE` | bnsvip.net hiển thị trang parked/rao bán; code còn gọi API `be-app-vip.com`, chưa xác minh API này. | [Nguồn](https://bnsvip.net/) |
| 32 | `wuxiaworld` | Wuxia World | `WEB_VISIBLE` | Trang chủ tải JavaScript shell; chưa kiểm tra các request ứng dụng / nội dung chương. | [Nguồn](https://www.wuxiaworld.com/) |
| 33 | `kissaway` | KissLove (Raw) | `UNVERIFIED` | Có title phù hợp nhưng không trích được nội dung; cần kiểm tra JS/anti-bot. | [Nguồn](https://klz9.com/) |
| 34 | `manhwahentai` | ManhwaHentai | `REPLACE_OR_RETIRE` | Domain hiện là site tạo ảnh AI, không phải trang danh sách truyện; `src/home.js` vẫn dùng các route `/webtoon-genre/...`. | [Nguồn](https://manhwahentai.me/) |
| 35 | `bfaloo` | bFaloo | `UNVERIFIED` | `b.faloo.com` không mở được qua công cụ; `www.faloo.com` còn hoạt động và có liên kết đến b.faloo.com; chưa kết luận bị hỏng. | [Nguồn](https://www.faloo.com/) |
| 36 | `tadu` | Tadu (塔读) | `WEB_VISIBLE` | Trang chủ timeout qua công cụ; trang `www.tadu.com/store` còn sách. | [Nguồn](https://www.tadu.com/store) |
| 37 | `royalroad` | Royalroad | `WEB_VISIBLE` | Royal Road có trang chủ `/home` và mục truyện. | [Nguồn](https://www.royalroad.com/home) |
| 38 | `ztruyen` | zTruyện | `WEB_VISIBLE` | ztruyen.vn trả về danh sách truyện. | [Nguồn](https://ztruyen.vn/) |
| 39 | `docsach24` | docsach24 | `UNVERIFIED` | Có nội dung được lập chỉ mục khoảng 5 tháng trước; truy cập trực tiếp hiện lỗi. | [Nguồn](https://docsach24.co/) |
| 40 | `8ternal` | 8ternal | `UNVERIFIED` | Có nội dung được lập chỉ mục khoảng 2 tháng trước; truy cập trực tiếp hiện lỗi. | [Nguồn](https://comic.8ternal.com/) |
| 41 | `vozer` | Vozer | `UNVERIFIED` | Không truy cập/không tìm được bằng chứng mới đáng tin cậy. | [Nguồn](https://vozer.vn) |

## Quy trình cập nhật an toàn

1. Kiểm tra mỗi nguồn bằng ứng dụng Vbook (home, search, detail, toc, chap); kiểm tra redirect và JS rendering.
2. Với DOMAIN_MOVED, đối chiếu `metadata.source`, `regexp`, `config.js`, các URL cố định trong từng `src/*.js`, API/image subdomains và CSS selectors; **không chỉ thay host đại trà**.
3. Với REPLACE_OR_RETIRE, kiểm tra lần nữa qua browser thường và DNS/API. Không tự thay bằng nguồn khác chưa tương thích hoặc xóa thư mục.
4. Với UNVERIFIED, test từ máy người dùng và mạng khác trước khi gắn nhãn hỏng. HTTP 403/timeout thường không chứng minh website chết.
5. Chỉ tăng phiên bản và rebuild `plugin.zip` sau khi sửa mã nguồn và thử nghiệm thực tế. Không đưa domain mới vào catalog trước khi có gói ZIP tương thích.

**Độ tin cậy**: kiểm tra trang web qua dịch vụ duyệt công khai và tìm kiếm web ngày 2026-10-10 (nhiều bản được crawl sớm hơn ngày báo cáo), đối chiếu một số `src/*.js` trong repo. Chưa chạy engine JavaScript đặc thù Vbook, chưa đo DNS, HTTP status đầy đủ tại thiết bị người dùng, chưa kiểm thử anti-bot, tài khoản hay chương VIP. Kết quả có thể thay đổi theo thời gian/vùng mạng.

**Liên quan**: Issue #3 — https://github.com/jokervtn94/vbook-ext/issues/3
