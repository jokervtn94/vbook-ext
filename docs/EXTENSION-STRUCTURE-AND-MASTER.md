# Vbook-Ext — chuẩn extension và bảo trì

Nguồn tham khảo: [Vbook Extension README](https://github.com/duongden/vbook)
và [Vbook extension testing](https://github.com/Darkrai9x/vbook-extensions).

## Cấu trúc bắt buộc

Mỗi extension sử dụng thư mục riêng `<extension>/`:

```text
<extension>/
  plugin.json     # Metadata + ánh xạ script
  icon.png        # Icon cài đặt
  plugin.zip      # Gói phát hành thực tế
  src/
    detail.js     # Thông tin truyện
    toc.js        # Danh sách chương
    chap.js       # Nội dung chương
    home.js       # Tuỳ chọn
    genre.js      # Tuỳ chọn
    search.js     # Tuỳ chọn
    page.js       # Tuỳ chọn, nếu mục lục nhiều trang
```

`plugin.json` cần `metadata.name`, `metadata.author`, `metadata.version` (số nguyên dương),
`metadata.source`, `metadata.regexp`, `metadata.locale`, `metadata.type`,
và `script.detail/toc/chap` trỏ đến tên tệp tồn tại trong `src/`.

**Hợp đồng dữ liệu**:

- home/genre trả `Response.success([{title,input,script}])`
- danh sách truyện/search trả `Response.success([{name,link,host,cover,description}],next)`
- detail trả thông tin truyện `name`, `cover`, `author`, `description`, ...
- toc trả `Response.success([{name,url,host}])`
- chap trả `Response.success(content)`

Chú ý: `next` phải rỗng hoặc `null` khi hết trang. Script phải phù hợp JavaScript engine chạy trong Vbook; không suy luận rằng JavaScript hiện đại chạy được chỉ vì CI Python thành công.

## Kiểm tra nhanh

```shell
python tools/validate_extensions.py
python tools/audit_structure.py
python tools/inspect_packages.py 123truyen sachhayonline novelbuddy
python main.py --check
```

Công cụ chỉ kiểm tra *cấu trúc* và tính nhất quán, không kết luận website đích hoạt động hoặc selectors vẫn đúng.

## Quy tắc sửa extension

1. Kiểm tra domain thực, redirect, API nguồn, ảnh, các endpoint trong `src/*.js`.
2. Sửa `plugin.json` trong thư mục và script liên quan; giữ ghi nhận tác giả cũ, ghi bổ sung người bảo trì nếu có.
3. Chạy thử trên ứng dụng Vbook: home → danh sách → detail → toc → chap và tìm kiếm.
4. Tăng `metadata.version` **khi có thay đổi phát hành**, rebuild `plugin.zip`, kiểm tra metadata ZIP.
5. Đồng bộ version/source/icon/path tại `plugin.json` gốc; tái sinh README bằng `python main.py`.
6. Đưa thay đổi qua CI, lưu kết quả test trong PR trước khi công bố.

Chỉ dùng công cụ rebuild với folder cụ thể:
```shell
python tools/build_extensions.py 123truyen sachhayonline --apply
```

## Phân biệt chủ sở hữu và tác giả

Kho phát hành riêng thuộc `jokervtn94/vbook-ext`.
Tên tác giả trong extension cũ thể hiện người viết mã nguồn ban đầu,
**không phải** URL phụ thuộc vào kho upstream và không nên xoá chỉ để đổi chủ repository.
Không xoá license gốc nếu có; việc sửa nguồn không chuyển quyền tác giả.

## Chuyển nhánh mặc định

Đã có nhánh `master` độc lập trong chính repository.
Để thiết lập mặc định, chủ repo cần vào
**Settings → General → Default branch → master → Update** trên GitHub.
Việc đổi mặc định không tự thay địa chỉ Git remote trên máy cá nhân.

Kiểm tra remote ở máy lập trình:
```shell
git remote -v
git remote set-url origin https://github.com/jokervtn94/vbook-ext.git
git branch --set-upstream-to=origin/master master
```

Nếu đang có remote `upstream` trỏ kho gốc và không muốn đồng bộ nữa,
**sau khi kiểm tra** có thể chạy `git remote remove upstream`.
