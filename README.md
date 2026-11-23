# Xây Code

Website dịch vụ lập trình theo yêu cầu, với trang quản trị và cổng cộng tác viên. Luồng chính đi từ gửi yêu cầu đến báo giá, nghiệm thu, ghi khoản thu và trả hoa hồng thủ công.

## Chạy trên máy

Yêu cầu Node.js 22.12 trở lên và PostgreSQL. Nếu đã có PostgreSQL, tạo một database riêng rồi dùng chuỗi kết nối của nó. Nếu đã cài Docker, chạy database dev bằng `docker compose up -d postgres`.

1. Chạy `npm ci`.
2. Sao chép `.env.example` thành `.env`, điền `DATABASE_URL` và `BETTER_AUTH_URL`. Tạo secret bằng `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` rồi lưu vào `BETTER_AUTH_SECRET`.
3. Chạy `npm exec -- prisma generate` và `npm run db:migrate`.
4. Tạo admin bằng `npm run admin:create -- --email email-cua-ban@example.com` và đặt mật khẩu khi CLI hỏi.
5. Chạy `npm run dev`. Mở [trang chủ](http://localhost:3000) hoặc [trang đăng nhập](http://localhost:3000/dang-nhap).

Trong cài đặt, điền tỷ lệ hoa hồng bạn áp dụng, email/Zalo công khai và kiểm tra nội dung chính sách trước khi cấp tài khoản. Admin tạo affiliate ở trang **Cộng tác viên**, sau đó chuyển mật khẩu tạm qua kênh riêng. Affiliate đổi mật khẩu khi đăng nhập lần đầu.

## Thử nhận yêu cầu (đợt 2)

1. Mở một mục trong **Bạn cần xây gì?** và bấm **Trao đổi về hạng mục này**. Form chọn sẵn loại dự án. Điền liên hệ, mô tả và xác nhận đồng ý để nhận mã dạng `YC-000123`. Màn xác nhận có nút **Gửi yêu cầu khác** để mở form mới.
2. Thử gửi qua link affiliate trong cửa sổ riêng tư hoặc đăng nhập affiliate để gửi thay khách. Khi gửi thay, affiliate cần đồng ý phiên bản chính sách hiện hành và xác nhận khách cho phép chia sẻ thông tin.
3. Trong **Tổng quan** của admin, mở thông báo có mã vừa nhận. Yêu cầu ở trạng thái **Mới nhận**. Kiểm tra nguồn rồi bấm **Bắt đầu trao đổi** hoặc đóng yêu cầu kèm lý do.

## Thử một dự án

1. Mở link của affiliate trong trình duyệt khách và gửi yêu cầu. Trong **Yêu cầu & báo giá**, soạn phạm vi và nhập từng đợt thanh toán. Tổng các đợt bằng giá phát triển. Sao chép bản nháp để gửi cho khách, rồi **Đánh dấu đã gửi**. Để trống giờ gửi để dùng giờ hiện tại.
2. Khi khách xác nhận, nhập thời điểm theo giờ Việt Nam và nội dung xác nhận. Bấm **Xem lại trước khi chốt**, kiểm tra giá, người giới thiệu, hạn và hoa hồng dự kiến. Bấm **Xác nhận và tạo dự án** để chuyển sang **Chờ cọc**. Với giá thử 6.000.000đ và tỷ lệ 10%, hoa hồng dự kiến là 600.000đ.
3. Ghi khoản cọc 2.000.000đ và bắt đầu làm. Ghi nốt 4.000.000đ, xác nhận bàn giao rồi ghi nhận nghiệm thu. Nếu báo giá cho bàn giao trước, hoa hồng vẫn chờ cho tới khi đã thu đủ.
4. Trong **Hoa hồng**, chọn khoản đủ điều kiện, chuyển tiền bên ngoài web và lưu mã giao dịch. Affiliate xem được lần trả trong cổng của mình.

Chỉ dự án đầu tiên của khách được xét hoa hồng. Thời hạn 60 ngày tính từ yêu cầu giới thiệu hợp lệ đầu tiên. Lượt đã ghi nhận vẫn được xét nếu affiliate bị khóa sau đó. Dự án hủy không có hoa hồng. Khoản hoàn tiền được ghi riêng, còn hủy bản ghi dành cho lỗi nhập liệu.

## Kiểm tra

- `npm run lint`, `npm run typecheck`, `npm test` và `npm run build`.
- `npm run test:e2e` chạy trên một DB kiểm thử. Khởi động app, tạo admin riêng, đặt `TEST_BASE_URL`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`. Cài trình duyệt bằng `npx playwright install chromium` hoặc đặt `TEST_BROWSER_CHANNEL=msedge` để dùng Edge đã cài trên Windows. Để chỉ chạy luồng nhận yêu cầu, dùng `npm run test:e2e -- -g "đợt 2"`.

## VPS

Trỏ DNS vào VPS. Dùng `compose.prod.yaml` với `SITE_DOMAIN`, `BETTER_AUTH_URL=https://ten-mien-cua-ban`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD` và `DATABASE_URL=postgresql://xayma:MAT_KHAU_DA_URL_ENCODE@postgres:5432/xayma`. Dùng mật khẩu riêng cho production.

```sh
docker compose -f compose.prod.yaml up -d --build
docker compose -f compose.prod.yaml run --rm migrate npm run admin:create -- --email email-cua-ban@example.com
```

Caddy làm HTTPS. PostgreSQL chỉ mở trong mạng Compose. Đặt lịch dump hằng ngày ra nơi lưu trữ riêng và thử phục hồi vào một DB trống trước khi nhận khách thật. Ví dụ dump từ shell Linux trên VPS:

```sh
docker compose -f compose.prod.yaml exec -T postgres pg_dump -U xayma -Fc xayma > xayma.dump
```

Phục hồi vào DB thử nghiệm `xayma_restore` đã tạo riêng:

```sh
docker compose -f compose.prod.yaml exec -T postgres pg_restore -U xayma --no-owner --exit-on-error -d xayma_restore < xayma.dump
```
