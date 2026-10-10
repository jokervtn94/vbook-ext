# Chính sách nguồn tiếng Việt / tiếng Trung — 10/10/2026

Đã thực hiện lọc **ngôn ngữ nội dung** của nguồn truyện, không tin tuyệt đối trường `locale`.

**Loại bỏ hoàn toàn 6 extension tiếng Anh:** Omega Scans, DouJins, Manga Read, NovelBuddy, Wuxia World, Royalroad (gồm `src/`, `plugin.json`, `icon.png`, `plugin.zip`).

**Giữ 6 nguồn tiếng Việt:** ManhuaVN, Tiên Vực, Say Hentai, Tranh18, Hố Truyện, SachHayOnline.

**Giữ 11 nguồn tiếng Trung:** Qimao, AC QQ, Manhua Gui, Book QQ, Myrics, Dingdian, CiWeiMao, bFaloo, Tadu, 69Shuba, UUKanShu.

NovelBuddy từng ghi `vi-VN` nhưng website phát hành nội dung tiếng Anh; Dingdian từng ghi `vi-VN` nhưng thực tế tiếng Trung, nên giữ lại và đổi metadata sang `zh_CN` (v3).

CiWeiMao v5: bổ sung kiểm tra `chapter_access_key`, `chapter_content`, `encryt_keys` trước khi giải mã; không truy cập `.length` trên dữ liệu thiếu, trả lỗi CAPTCHA/đăng nhập nếu không có dữ liệu.

CI thêm `tools/validate_language_policy.py` để kiểm tra 17 nguồn được duyệt, metadata, và không tồn tại lại thư mục 6 nguồn đã xóa.

**Bổ sung:** Repo còn hai thư mục chưa phát hành là Knoxt (`en-EN`) và WebNovel (website cung cấp truyện tiếng Anh dù metadata ghi `vi-VN`); đã loại bỏ nốt cùng với 6 nguồn tiếng Anh đang phát hành. Tổng cộng xóa **8 thư mục nguồn không đạt tiêu chí**, nhưng chỉ **6 extension** bị gỡ khỏi catalog công khai.
