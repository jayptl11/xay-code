# Thiết kế web dịch vụ lập trình có người giới thiệu (affiliate)

*Tài liệu nghiệp vụ và thiết kế chi tiết · Cập nhật 22/11/2026*

## 1. Tổng quan

Web nhận làm dự án lập trình/web thuê. Người giới thiệu (affiliate) đưa khách về và nhận hoa hồng. Chủ dự án vừa code vừa quản lý toàn bộ qua web.

**Chuỗi nghiệp vụ duy nhất:** nhận yêu cầu → báo giá → làm dự án → thu tiền → trả hoa hồng.

### 1.1 Vai trò

| Vai trò | Là ai | Tài khoản |
| --- | --- | --- |
| Khách hàng | Người cần làm phần mềm/web | Không cần |
| Affiliate | Người giới thiệu khách, nhận hoa hồng | Chủ dự án tạo |
| Quản trị viên | Chủ dự án | Có |
| Người thực hiện | Lập trình viên cộng tác được giao việc | Tự đăng ký, chủ dự án duyệt |

### 1.2 Nguyên tắc nền

1. Mã affiliate chỉ cho biết ai mang khách về. Giá và hoa hồng được chốt riêng từng dự án, chỉ chủ dự án xác nhận.
2. Trao đổi và thương lượng với khách diễn ra ngoài web (Zalo/email). Web chỉ lưu kết quả đã thống nhất.
3. Tiền thu và tiền trả đều do chủ dự án xác nhận thủ công. Không có thanh toán trực tuyến.
4. Giá và hoa hồng đã chốt được lưu cố định. Thay đổi phải có lý do và để lại lịch sử.
5. Mỗi người chỉ thấy phần dữ liệu thuộc về mình.

### 1.3 Các quyết định đã chốt

| Vấn đề | Quyết định |
| --- | --- |
| Mức hoa hồng | Một tỷ lệ phần trăm cố định cho mọi dự án, không bậc thang, không sàn. Chủ dự án đặt con số trong phần cài đặt |
| Dự án lặp lại của cùng khách sau 60 ngày | Không chia hoa hồng |
| Mức cọc, thời hạn bảo hành, điều khoản | Thương lượng với từng khách, nhập vào báo giá của dự án đó |
| Hosting sau bàn giao | Thương lượng với từng khách, nhập vào báo giá của dự án đó |

## 2. Quy tắc nghiệp vụ

### 2.1 Ghi nhận affiliate

1. Một dự án ghi nhận tối đa một affiliate. Một khách có thể có nhiều dự án, mỗi dự án xác định người giới thiệu riêng.
2. Mỗi yêu cầu có **ngày ghi nhận** (lúc yêu cầu vào hệ thống). Cửa sổ ghi nhận là 60 ngày kể từ ngày này.
3. Dự án được chốt trong cửa sổ với cùng khách (trùng SĐT/Zalo/email đã chuẩn hóa, hoặc cùng công ty) thì ghi cho affiliate đó, kể cả khi khách liên hệ thẳng chủ dự án.
4. Dự án chốt sau 60 ngày, hoặc dự án lặp lại của khách đó sau 60 ngày, không có hoa hồng.
5. Hai affiliate cùng giới thiệu một khách: ghi cho người có yêu cầu ghi nhận trước. Chủ dự án xử lý ngoại lệ trước khi nhận làm.
6. Yêu cầu còn đang thương lượng khi hết cửa sổ: chủ dự án có thể gia hạn riêng cho yêu cầu đó, ghi lý do và thông báo cho affiliate.
7. Click link hoặc điền form không tạo hoa hồng. Hoa hồng chỉ có khi dự án được chốt và chủ dự án xác nhận người giới thiệu.
8. Affiliate không báo giá và không cam kết thay chủ dự án.
9. Affiliate tự gửi khách phải xác nhận khách đã đồng ý chia sẻ thông tin liên hệ.
10. Mã giới thiệu từ link được ghi nhớ 60 ngày trên trình duyệt của khách. Mã không tồn tại hoặc đã khóa vẫn được lưu và đánh dấu “không hợp lệ”.

### 2.2 Báo giá và giá

1. Báo giá gồm: phạm vi công việc, sản phẩm bàn giao, giá, lịch thanh toán (cọc, các đợt, còn lại), ngày bắt đầu và dự kiến bàn giao, thời hạn bảo hành, hosting sau bàn giao, điều khoản riêng.
2. Mức cọc, bảo hành, hosting, điều khoản được thương lượng và nhập theo từng báo giá. Không có giá trị mặc định cố định.
3. Sửa báo giá đã gửi thì tạo phiên bản mới. Chỉ phiên bản khách đã xác nhận mới thành giá chốt.
4. Khách xác nhận bằng văn bản (tin nhắn/email). Web lưu nội dung hoặc ảnh chụp xác nhận và ngày xác nhận.
5. Phát sinh ngoài phạm vi: lập báo giá bổ sung gắn vào dự án, ghi rõ có tính hoa hồng hay không. **Giá trị dự án = giá chốt + các báo giá bổ sung đã xác nhận.**

### 2.3 Hoa hồng

1. **Hoa hồng = tỷ lệ cố định × giá trị phát triển dự án đã chốt.** Tỷ lệ do chủ dự án đặt ở cài đặt chung. Đổi tỷ lệ chỉ áp dụng cho dự án chốt sau đó, không ảnh hưởng dự án đã chốt.
2. Khi chốt, lưu cố định: tỷ lệ áp dụng, giá cơ sở, số tiền hoa hồng (làm tròn đến đồng). Báo giá bổ sung có tính hoa hồng thì cộng thêm theo cùng tỷ lệ của dự án đó.
3. Phí hosting/bảo trì sau bàn giao không tính hoa hồng.
4. Sửa giá hoặc hoa hồng sau khi chốt phải ghi lý do. Affiliate được thông báo.
5. **Đủ điều kiện trả** khi dự án “Hoàn thành” **và** khách đã thanh toán đủ giá trị phát triển dự án. Nếu sau đó khoản thu bị hủy làm dự án không còn thu đủ, khoản hoa hồng chưa trả quay về “Dự kiến”.
6. Trả thủ công ngoài hệ thống. Chủ dự án ghi nhận ngày, số tiền, mã giao dịch. Một lần trả có thể gồm nhiều khoản hoa hồng. Mỗi khoản chỉ được trả một lần.
7. Dự án hủy hoặc hoàn tiền: chủ dự án nhập số hoa hồng sau điều chỉnh theo phần việc và tiền thực thu đã thống nhất (có thể bằng 0), kèm lý do. Lớn hơn 0 thì chuyển “Đủ điều kiện trả”, bằng 0 thì “Đã hủy”.
8. Có tranh chấp: chuyển “Tạm giữ” cho đến khi xử lý xong.
9. Lưu họ tên, thông tin ngân hàng người nhận và chứng từ chi để phục vụ kê khai thuế. Chủ dự án cần hỏi kế toán hoặc cơ quan thuế về nghĩa vụ khi trả hoa hồng cho cá nhân theo quy định hiện hành.
10. Affiliate đổi thông tin ngân hàng thì chủ dự án phải xác nhận trước khi áp dụng cho lần trả tiếp theo.

### 2.4 Thu tiền

1. Mỗi khoản thu lưu: ngày, số tiền, loại (cọc / đợt giữa / còn lại / bổ sung / phí hosting-bảo trì), ghi chú, chứng từ.
2. **Đã thu / Còn phải thu** tự tính trên giá trị phát triển dự án. Phí hosting-bảo trì tính riêng, không nằm trong khoản còn phải thu của dự án.
3. Khoản thu ghi sai thì hủy kèm lý do rồi nhập lại, không xóa.
4. Mã nguồn và bản triển khai chính thức chỉ bàn giao sau khi thu đủ, trừ khi báo giá có thỏa thuận khác.

### 2.5 Phạm vi dịch vụ

1. **Nhận:** website cá nhân/landing/portfolio; web bán hàng, quản lý, đặt lịch; backend, API, tích hợp; sửa lỗi, hoàn thiện, nâng cấp dự án có sẵn; triển khai lên hosting/server; kèm cặp, review code cho người học làm dự án của chính họ.
2. **Không nhận:** làm hộ bài tập, đồ án, luận văn để người khác nộp như sản phẩm của mình. Web và tài liệu cho affiliate không dùng cách nói này, affiliate không được giới thiệu loại việc đó, chủ dự án có quyền từ chối.
3. Dự án chỉ được đưa lên trang “Dự án đã làm” khi khách đồng ý.

### 2.6 Dữ liệu cá nhân

1. Form có ô đồng ý cho phép lưu thông tin để liên hệ.
2. Affiliate chỉ thấy tên khách và dự án của mình. SĐT/email khách hiển thị rút gọn (ví dụ 0912\*\*\*789).
3. Người thực hiện không thấy giá khách trả, hoa hồng và thông tin liên hệ khách, trừ khi chủ dự án cho phép.
4. Affiliate phải đồng ý trang chính sách cộng tác viên khi nhận tài khoản. Hệ thống lưu phiên bản chính sách và ngày đồng ý. Chính sách đổi thì yêu cầu đồng ý lại.

## 3. Trạng thái và điều kiện chuyển

### 3.1 Yêu cầu

| Trạng thái | Chuyển sang | Điều kiện |
| --- | --- | --- |
| Mới nhận | Đang trao đổi | Chủ dự án mở và bắt đầu trao đổi |
| Đang trao đổi | Đã báo giá | Báo giá được gửi cho khách |
| Đã báo giá | Đã nhận | Khách xác nhận báo giá, chủ dự án chuyển thành dự án |
| Mới nhận / Đang trao đổi / Đã báo giá | Không tiếp tục | Chủ dự án đóng, bắt buộc có lý do |

### 3.2 Báo giá

Nháp → Đã gửi → **Khách đã xác nhận** / Bị từ chối / Bị thay bằng phiên bản mới.

### 3.3 Dự án

| Trạng thái | Chuyển sang | Điều kiện |
| --- | --- | --- |
| Chờ cọc | Đang làm | Có khoản cọc được ghi nhận, hoặc chủ dự án cho bắt đầu (ghi lý do) |
| Đang làm | Chờ khách phản hồi | Đã gửi demo hoặc bản cập nhật cho khách |
| Chờ khách phản hồi | Đang làm | Khách yêu cầu chỉnh sửa trong phạm vi |
| Đang làm / Chờ khách phản hồi | Đã bàn giao | Đã thu đủ (hoặc có thỏa thuận khác trong báo giá) và đã gửi sản phẩm |
| Đã bàn giao | Hoàn thành | Khách nghiệm thu hoặc hai bên thống nhất kết thúc. Ghi ngày và cách xác nhận |
| Mọi trạng thái trước Hoàn thành | Đã hủy | Chủ dự án hủy, bắt buộc có lý do |

**Bàn giao** là đã gửi sản phẩm. **Hoàn thành** là khách đã xác nhận.

### 3.4 Hoa hồng

| Trạng thái | Chuyển sang | Điều kiện |
| --- | --- | --- |
| Dự kiến | Đủ điều kiện trả | Tự động: dự án Hoàn thành **và** thu đủ |
| Đủ điều kiện trả | Đã trả | Chủ dự án ghi nhận lần chuyển tiền |
| Đủ điều kiện trả | Dự kiến | Khoản thu bị hủy làm dự án không còn thu đủ |
| Dự kiến / Đủ điều kiện trả | Tạm giữ | Có tranh chấp. Trở lại trạng thái cũ khi xử lý xong |
| Dự kiến / Đủ điều kiện trả | Đã hủy | Dự án hủy và hoa hồng điều chỉnh bằng 0 |

### 3.5 Giao việc cho người thực hiện

Đã giao → Đang làm → Đã nộp → **Đã duyệt** / Cần sửa (quay lại Đang làm). Tiền công: Chưa trả → Đã trả.

## 4. Các luồng chi tiết

### Luồng 1. Khách gửi yêu cầu

1. Khách xem dịch vụ, dự án đã làm, quy trình, rồi bấm “Gửi yêu cầu dự án”.
2. Khách điền form. Nếu vào bằng link affiliate, mã giới thiệu tự điền.
3. Khách tick đồng ý lưu thông tin, gửi form.
4. Hệ thống tạo yêu cầu “Mới nhận”, chuẩn hóa thông tin liên hệ, so trùng với khách đã có, trả về **mã yêu cầu**.
5. Chủ dự án nhận thông báo.

Chưa coi là dự án đã nhận làm.

### Luồng 2. Affiliate đưa khách về

**Cách A (khách tự điền):** affiliate gửi link riêng cho khách, khách điền form như luồng 1.

**Cách B (affiliate gửi thay):**

1. Affiliate đăng nhập, chọn “Gửi dự án mới”.
2. Nhập thông tin khách và yêu cầu. Tùy chọn: ngân sách khách dự kiến, giá đã trao đổi sơ bộ, deadline, ghi chú riêng cho chủ dự án.
3. Xác nhận khách đã đồng ý chia sẻ thông tin.
4. Gửi. Yêu cầu vào hệ thống gắn với affiliate, ngày ghi nhận là lúc gửi.

Các con số affiliate nhập chỉ là đề xuất.

### Luồng 3. Xử lý yêu cầu, báo giá, chốt dự án

1. Chủ dự án xem yêu cầu mới. Hệ thống cảnh báo nếu khách trùng yêu cầu hoặc dự án đã có.
2. Chủ dự án liên hệ khách ngoài web, ghi chú kết quả, chỉnh phạm vi. Trạng thái “Đang trao đổi”.
3. Lập báo giá (mục 2.2), gồm cả mức cọc, bảo hành, hosting và điều khoản đã thương lượng với khách.
4. Nếu có affiliate: xác nhận người giới thiệu theo quy tắc 2.1, kiểm tra còn trong cửa sổ 60 ngày. Hệ thống tính hoa hồng theo tỷ lệ cố định hiện hành.
5. Gửi báo giá qua Zalo/email, trạng thái “Đã báo giá”.
6. Khách xác nhận bằng văn bản. Chủ dự án nhập nội dung xác nhận và ngày.
7. Chủ dự án chuyển yêu cầu thành dự án. Giá, tỷ lệ và số tiền hoa hồng được lưu cố định. Hoa hồng ở “Dự kiến”.
8. Nếu không đi tiếp: đóng yêu cầu “Không tiếp tục” kèm lý do.

### Luồng 4. Thực hiện dự án

1. Dự án ở “Chờ cọc”. Khi ghi nhận cọc (hoặc chủ dự án cho bắt đầu), chuyển “Đang làm”.
2. Chủ dự án lập danh sách việc chính (ví dụ: giao diện, API, kiểm thử, demo, bàn giao) và đánh dấu hoàn thành dần.
3. Lưu link tài liệu, mã nguồn, demo.
4. Gửi demo, trạng thái “Chờ khách phản hồi”. Khách yêu cầu chỉnh sửa trong phạm vi thì quay về “Đang làm”.
5. Ngoài phạm vi: lập báo giá bổ sung (luồng 7).
6. Thu đủ, gửi sản phẩm: “Đã bàn giao”.
7. Khách nghiệm thu hoặc hai bên thống nhất kết thúc: “Hoàn thành”.
8. Bảo hành sửa lỗi trong thời hạn ghi ở báo giá. Hosting sau bàn giao theo thỏa thuận trong báo giá.

Affiliate xem được tiến độ tổng quát. Chi phí và ghi chú nội bộ thì không.

### Luồng 5. Thu tiền

1. Khách chuyển khoản theo lịch trong báo giá.
2. Chủ dự án kiểm tra tiền về, ghi từng khoản (ngày, số tiền, loại, chứng từ).
3. Hệ thống cập nhật **đã thu / còn phải thu**. Khoản quá hạn hiển thị nổi bật trên bảng tổng quan.
4. Khoản ghi sai: hủy kèm lý do rồi nhập lại.
5. Phí hosting/bảo trì (nếu có) ghi riêng, không ảnh hưởng điều kiện hoa hồng.

### Luồng 6. Hoa hồng

1. Khi chốt, hoa hồng “Dự kiến”. Affiliate thấy giá chốt, tỷ lệ, số tiền và điều kiện nhận.
2. Dự án “Hoàn thành” và thu đủ thì hoa hồng tự thành “Đủ điều kiện trả”. Chủ dự án thấy trong danh sách chờ trả.
3. Chủ dự án chuyển tiền ngoài hệ thống, chọn các khoản đã chuyển, ghi ngày, số tiền, mã giao dịch, chứng từ.
4. Các khoản thành “Đã trả”. Affiliate thấy trong trang hoa hồng và lịch sử nhận. Hệ thống không cho trả trùng.

### Luồng 7. Thay đổi và ngoại lệ

- **Đổi giá/hoa hồng sau chốt:** chủ dự án sửa kèm lý do, lịch sử được lưu, affiliate được thông báo.
- **Phát sinh ngoài phạm vi:** báo giá bổ sung, ghi rõ có tính hoa hồng hay không, khách xác nhận bằng văn bản.
- **Hủy dự án:** chuyển “Đã hủy” kèm lý do, hai bên thống nhất phần việc đã làm và số tiền thực thu/hoàn, chủ dự án nhập hoa hồng điều chỉnh (quy tắc 2.3.7).
- **Tranh chấp:** hoa hồng sang “Tạm giữ” đến khi xử lý xong.
- **Hai affiliate trùng khách:** xử lý theo quy tắc 2.1.5 trước khi nhận làm.

### Luồng 8. Quản lý affiliate

1. Chủ dự án tạo tài khoản: họ tên, SĐT, email, thông tin ngân hàng. Hệ thống cấp mã (ví dụ CTV001) và link giới thiệu.
2. Affiliate đăng nhập lần đầu, đọc và đồng ý chính sách cộng tác viên.
3. Chủ dự án xem từng affiliate: yêu cầu đã gửi, dự án, hoa hồng dự kiến/đủ điều kiện/đã trả.
4. Affiliate đổi thông tin ngân hàng thì chủ dự án xác nhận trước khi dùng cho lần trả sau.
5. Chủ dự án khóa hoặc mở lại tài khoản khi cần. Tài khoản bị khóa không đăng nhập được, nhưng hoa hồng đã chốt vẫn được ghi nhận và xử lý.

Không có đăng ký affiliate công khai.

### Luồng 9. Người thực hiện

1. Đăng ký cộng tác, khai kỹ năng và portfolio.
2. Chủ dự án duyệt hoặc từ chối hồ sơ.
3. Chủ dự án giao một dự án hoặc một phần việc, hai bên chốt **tiền công** và deadline.
4. Người thực hiện cập nhật tiến độ và nộp sản phẩm (link, ghi chú).
5. Chủ dự án kiểm tra: “Đã duyệt” hoặc “Cần sửa”. Chỉ sau khi duyệt mới bàn giao cho khách.
6. Chủ dự án ghi nhận trả tiền công (ngày, số tiền, mã giao dịch).

**Tiền công người làm và hoa hồng người giới thiệu là hai khoản riêng.** Một người giữ cả hai vai thì được ghi rõ ở từng dự án.

### Luồng 10. Quản lý nội dung website

Chủ dự án chỉnh danh sách dịch vụ, dự án đã làm (chỉ đăng khi khách đồng ý), thông tin liên hệ, trang quy trình, trang chính sách cộng tác viên. Có thể ẩn/hiện và sắp xếp thứ tự.

### Ví dụ một dự án đi hết luồng (tỷ lệ minh họa 10%)

1. Chủ dự án tạo tài khoản cho A, mã CTV001.
2. A gửi yêu cầu của khách cần web quản lý. Ngày ghi nhận là ngày A gửi.
3. Chủ dự án trao đổi với khách, chốt giá 6.000.000đ, mức cọc và bảo hành thương lượng riêng với khách đó. Hoa hồng cho A là 600.000đ.
4. Khách xác nhận báo giá và đặt cọc 2.000.000đ. Dự án bắt đầu.
5. Gửi demo, chỉnh sửa, thu nốt 4.000.000đ, bàn giao, khách nghiệm thu.
6. Hoa hồng của A thành “Đủ điều kiện trả”. Chủ dự án chuyển 600.000đ và ghi nhận. A thấy “Đã trả”.

## 5. Thiết kế màn hình

### 5.1 Website công khai

| Trang | Nội dung |
| --- | --- |
| Trang chủ | Giới thiệu dịch vụ, loại dự án nhận làm, vài sản phẩm tiêu biểu, quy trình ngắn, nút “Gửi yêu cầu dự án” và “Trao đổi qua Zalo” |
| Dịch vụ | Từng nhóm dịch vụ: mô tả, ví dụ sản phẩm bàn giao, thông tin khách cần chuẩn bị. Dự án cần khảo sát hiển thị “Báo giá theo yêu cầu” |
| Dự án đã làm | Tên, ảnh/video demo, bài toán, chức năng chính, công nghệ, link demo, nút “Gửi yêu cầu tương tự” |
| Quy trình & liên hệ | Các bước từ yêu cầu đến bàn giao, cách báo giá, thanh toán, bảo hành (nêu rõ điều khoản được thương lượng theo từng dự án), thông tin liên hệ |
| Gửi yêu cầu | Form bên dưới |
| Chính sách cộng tác viên | Quy tắc ghi nhận, hoa hồng, điều kiện nhận, loại việc không nhận, bảo mật thông tin khách, thuế |

**Form gửi yêu cầu:**

| Trường | Bắt buộc | Kiểm tra |
| --- | --- | --- |
| Tên người liên hệ | Có | Không để trống |
| SĐT/Zalo | Một trong hai | Số điện thoại hợp lệ, được chuẩn hóa trước khi lưu |
| Email | Một trong hai | Đúng định dạng |
| Loại dự án | Có | Chọn từ danh sách dịch vụ hoặc “Khác” |
| Tên dự án | Không |  |
| Mô tả yêu cầu | Có | Tối thiểu vài câu |
| Thời gian mong muốn | Không | Ngày hoặc khoảng thời gian |
| Ngân sách dự kiến | Không | Số hoặc khoảng |
| Link tài liệu/mã nguồn/mẫu tham khảo | Không | Nhiều link, đúng định dạng |
| Mã người giới thiệu | Không | Tự điền từ link, chỉ đọc |
| Đồng ý lưu thông tin để liên hệ | Có | Phải tick |

Có chống gửi spam và giới hạn số lần gửi liên tiếp từ một nguồn. Sau khi gửi hiển thị mã yêu cầu (dạng YC-000123) và thông báo sẽ được liên hệ.

### 5.2 Cổng affiliate

| Màn hình | Nội dung và thao tác |
| --- | --- |
| Tổng quan | Số yêu cầu đã gửi, dự án đang làm, hoa hồng dự kiến, hoa hồng đủ điều kiện, tổng đã nhận. Link giới thiệu và nút sao chép |
| Gửi dự án mới | Thông tin khách (tên, SĐT/Zalo/email), loại dự án, mô tả, link tài liệu, ngân sách khách dự kiến, giá đã trao đổi sơ bộ, deadline, ghi chú riêng. Bắt buộc tick xác nhận khách đồng ý chia sẻ thông tin |
| Dự án của tôi | Danh sách: mã, tên, ngày gửi, trạng thái tiếp nhận, giá chốt, hoa hồng, tiến độ, trạng thái hoa hồng. Lọc theo trạng thái. Yêu cầu bị trùng hoặc ngoài cửa sổ ghi nhận hiển thị lý do |
| Chi tiết dự án | Thông tin khách (rút gọn liên hệ), giá khách thanh toán, tỷ lệ và số tiền hoa hồng, điều kiện nhận, tiến độ tổng quát, ghi chú chủ dự án chọn chia sẻ, lịch sử thay đổi giá/hoa hồng |
| Hoa hồng | Bốn số: dự kiến, đủ điều kiện, tổng đã nhận, tạm giữ. Danh sách các lần chuyển (ngày, số tiền, mã giao dịch, các dự án trong lần đó) |
| Tài khoản | Xem và sửa họ tên, SĐT, email. Sửa ngân hàng thì ở trạng thái chờ chủ dự án xác nhận. Đổi mật khẩu |
| Chính sách | Nội dung chính sách hiện hành và ngày đã đồng ý |

### 5.3 Trang quản trị

| Màn hình | Nội dung và thao tác |
| --- | --- |
| Tổng quan | Yêu cầu mới chưa xử lý; báo giá chờ phản hồi; dự án đang làm; dự án gần hoặc quá hạn; khoản khách còn phải thanh toán; hoa hồng chờ trả; cảnh báo trùng khách; yêu cầu sắp hết cửa sổ ghi nhận |
| Yêu cầu | Danh sách lọc theo trạng thái, nguồn, affiliate. Chi tiết: thông tin khách, mô tả, đề xuất của affiliate, cảnh báo trùng, ghi chú trao đổi, hạn ghi nhận (gia hạn kèm lý do), nút lập báo giá, nút đóng yêu cầu |
| Báo giá | Soạn và xem các phiên bản. Nhập đủ các trường mục 2.2.1, chọn affiliate và xem hoa hồng được tính, xuất nội dung để gửi Zalo/email, ghi nhận xác nhận của khách, chuyển thành dự án |
| Dự án | Danh sách lọc theo trạng thái, hạn. Chi tiết: khách, phạm vi chốt, giá trị (gồm báo giá bổ sung), ngày bắt đầu và deadline, trạng thái, danh sách việc chính, link tài liệu/mã nguồn/demo/bàn giao, khoản thu, affiliate và hoa hồng, giao việc, ghi chú nội bộ, ghi chú chia sẻ affiliate, cờ cho phép đưa lên portfolio |
| Khoản thu | Danh sách theo dự án, ngày, loại. Thêm khoản thu, hủy khoản kèm lý do. Hiển thị đã thu / còn phải thu và khoản quá hạn |
| Affiliate | Danh sách và hồ sơ: thông tin liên hệ, ngân hàng (kèm thay đổi chờ xác nhận), các yêu cầu và dự án đã gửi, hoa hồng theo trạng thái, phiên bản chính sách đã đồng ý. Tạo, sửa, khóa, mở lại |
| Hoa hồng & lần trả | Danh sách khoản đủ điều kiện, tạm giữ. Chọn khoản để ghi nhận một lần trả (ngày, số tiền, mã giao dịch, chứng từ). Lịch sử các lần trả |
| Người thực hiện | Duyệt hồ sơ, giao việc, theo dõi nộp bài, duyệt hoặc yêu cầu sửa, ghi nhận trả tiền công |
| Nội dung website | Dịch vụ, dự án đã làm, trang liên hệ, quy trình, chính sách cộng tác viên (có phiên bản) |
| Cài đặt | Tỷ lệ hoa hồng hiện hành (có lịch sử thay đổi), độ dài cửa sổ ghi nhận (60 ngày), thông tin liên hệ hiển thị công khai, kênh nhận thông báo |
| Báo cáo | Tiền đã thu theo tháng; số yêu cầu theo nguồn và tỷ lệ chuyển thành dự án; hoa hồng đã trả theo affiliate và theo tháng |
| Nhật ký thay đổi | Tra cứu mọi thay đổi theo bản ghi, người, thời gian |

### 5.4 Cổng người thực hiện

| Màn hình | Nội dung |
| --- | --- |
| Hồ sơ | Họ tên, liên hệ, kỹ năng, portfolio, trạng thái duyệt |
| Việc của tôi | Danh sách việc được giao: dự án, phạm vi, deadline, tiền công, trạng thái |
| Chi tiết việc | Mô tả, tài liệu, nộp sản phẩm, ghi chú của chủ dự án, lịch sử trả tiền công |

Không hiển thị giá khách trả, hoa hồng và thông tin liên hệ khách.

## 6. Mô hình dữ liệu

| Đối tượng | Các trường chính |
| --- | --- |
| Người dùng | Vai trò, họ tên, SĐT, email, thông tin đăng nhập, trạng thái (hoạt động/khóa), lần đăng nhập cuối |
| Affiliate | Người dùng, mã (CTV001), thông tin ngân hàng, thay đổi ngân hàng chờ xác nhận, phiên bản chính sách đã đồng ý và ngày, ghi chú nội bộ |
| Khách hàng | Tên, SĐT chuẩn hóa, Zalo, email chuẩn hóa, công ty |
| Yêu cầu | Mã YC, khách, loại, tên dự án, mô tả, thời gian mong muốn, ngân sách dự kiến, link, nguồn (link affiliate / affiliate tự gửi / trực tiếp), mã giới thiệu, affiliate liên kết, mã hợp lệ hay không, ngày ghi nhận, hạn ghi nhận, lý do gia hạn, đề xuất của affiliate (ngân sách, giá sơ bộ, deadline, ghi chú), cờ trùng, trạng thái, lý do đóng |
| Ghi chú trao đổi | Yêu cầu hoặc dự án, nội dung, người ghi, thời gian, có chia sẻ cho affiliate hay không |
| Báo giá | Yêu cầu, số phiên bản, phạm vi, sản phẩm bàn giao, giá, lịch thanh toán (các đợt: nội dung, số tiền, hạn), ngày bắt đầu, ngày dự kiến bàn giao, bảo hành, hosting sau bàn giao (khách tự lo hoặc chủ dự án giữ, kèm phí và chu kỳ), điều khoản riêng, trạng thái, ngày gửi, nội dung và ngày khách xác nhận |
| Báo giá bổ sung | Dự án, nội dung, giá, có tính hoa hồng hay không, trạng thái, xác nhận của khách |
| Dự án | Mã DA, yêu cầu, khách, affiliate, báo giá chốt, giá trị phát triển, ngày bắt đầu, deadline, trạng thái, link tài liệu/mã nguồn/demo/bàn giao, ngày bàn giao, ngày hoàn thành và cách xác nhận, lý do hủy, ghi chú nội bộ, ghi chú chia sẻ affiliate, cho phép đưa lên portfolio |
| Việc chính | Dự án, tên việc, thứ tự, trạng thái |
| Khoản thu | Dự án, ngày, số tiền, loại, ghi chú, chứng từ, hiệu lực hay đã hủy, lý do hủy |
| Hoa hồng | Dự án, affiliate, tỷ lệ áp dụng, giá cơ sở, số tiền, số tiền điều chỉnh và lý do, trạng thái, lần trả đã gắn |
| Lần trả hoa hồng | Affiliate, ngày, tổng tiền, mã giao dịch, chứng từ, các khoản hoa hồng đã trả |
| Hồ sơ người thực hiện | Người dùng, kỹ năng, portfolio, trạng thái duyệt |
| Giao việc | Dự án, người thực hiện, phạm vi, tiền công, deadline, trạng thái, sản phẩm nộp, ghi chú kiểm tra |
| Trả tiền công | Giao việc, ngày, số tiền, mã giao dịch |
| Nội dung công khai | Dịch vụ, dự án mẫu, trang tĩnh (liên hệ, quy trình, chính sách), thứ tự, ẩn/hiện |
| Cài đặt | Tỷ lệ hoa hồng (kèm lịch sử), cửa sổ ghi nhận, thông tin liên hệ, kênh thông báo |
| Nhật ký thay đổi | Người thực hiện, thời gian, đối tượng, giá trị cũ và mới, lý do |
| Thông báo | Người nhận, sự kiện, nội dung, đã đọc hay chưa |

Tiền lưu bằng số nguyên theo đồng. Giá và hoa hồng đã chốt là giá trị lưu cố định, không tính lại khi cài đặt thay đổi.

## 7. Phân quyền

| Chức năng | Khách | Affiliate | Quản trị | Người thực hiện |
| --- | --- | --- | --- | --- |
| Xem web công khai, gửi yêu cầu | Có | Có | Có | Có |
| Gửi dự án qua cổng |  | Có | Có |  |
| Xem yêu cầu và dự án |  | Chỉ của mình | Tất cả | Chỉ việc được giao |
| Xem thông tin liên hệ khách đầy đủ |  | Không (rút gọn) | Có | Không |
| Xem giá khách trả |  | Chỉ dự án của mình | Có | Không |
| Xem hoa hồng |  | Chỉ của mình | Tất cả | Không |
| Lập và sửa báo giá, chốt giá, chốt hoa hồng |  |  | Có |  |
| Ghi khoản thu, ghi lần trả hoa hồng/tiền công |  |  | Có |  |
| Tạo, khóa affiliate; duyệt người thực hiện |  |  | Có |  |
| Sửa nội dung website, cài đặt |  |  | Có |  |
| Xem nhật ký thay đổi |  |  | Có |  |

## 8. Thông báo

| Sự kiện | Gửi cho |
| --- | --- |
| Yêu cầu mới (từ khách hoặc affiliate) | Quản trị |
| Phát hiện khách trùng | Quản trị |
| Yêu cầu sắp hết cửa sổ ghi nhận | Quản trị |
| Khoản thu quá hạn, dự án gần hoặc quá hạn | Quản trị |
| Affiliate đổi thông tin ngân hàng | Quản trị |
| Người thực hiện nộp sản phẩm | Quản trị |
| Yêu cầu của affiliate được tiếp nhận hoặc đóng | Affiliate |
| Dự án chốt, đổi trạng thái chính (bắt đầu, bàn giao, hoàn thành, hủy) | Affiliate |
| Giá hoặc hoa hồng bị điều chỉnh (kèm lý do) | Affiliate |
| Hoa hồng đổi trạng thái (đủ điều kiện, tạm giữ, đã trả) | Affiliate |
| Giao việc mới, cần sửa, đã duyệt, đã trả tiền công | Người thực hiện |

Thông báo hiển thị trong web và gửi thêm qua email hoặc Zalo theo kênh chủ dự án chọn.

## 9. Kiểm tra dữ liệu và nhật ký

1. Chuẩn hóa SĐT (bỏ khoảng trắng, đổi đầu +84 thành 0) và email (chữ thường) trước khi lưu và so trùng.
2. Mã YC, DA, CTV là duy nhất và không đổi.
3. Giá, số tiền hoa hồng, khoản thu là số nguyên không âm. Tổng thu không vượt giá trị dự án trừ khi chủ dự án xác nhận (ghi lý do).
4. Mỗi dự án có tối đa một affiliate. Mỗi khoản hoa hồng chỉ nằm trong một lần trả.
5. Hoa hồng chỉ chuyển “Đủ điều kiện trả” bằng điều kiện tự động ở 3.4, chủ dự án không bật thủ công.
6. Mọi thay đổi giá, hoa hồng, trạng thái, khoản thu, lần trả, gia hạn cửa sổ ghi nhận đều ghi nhật ký: ai, lúc nào, giá trị cũ và mới, lý do.
7. Khoản thu, lần trả, nhật ký không xóa được. Chỉ hủy kèm lý do.

## 10. Tình huống ngoại lệ

| Tình huống | Xử lý |
| --- | --- |
| Khách bỏ qua affiliate, liên hệ thẳng chủ dự án | Nếu còn trong 60 ngày và trùng thông tin liên hệ, vẫn ghi cho affiliate (2.1.3) |
| Khách quay lại làm dự án mới sau 60 ngày | Không có hoa hồng (2.1.4) |
| Thương lượng kéo dài quá 60 ngày | Chủ dự án gia hạn cho yêu cầu đó, ghi lý do, thông báo affiliate |
| Hai affiliate cùng gửi một khách | Ghi cho người có ngày ghi nhận trước, báo cho người còn lại |
| Link affiliate có mã không tồn tại hoặc đã khóa | Vẫn lưu yêu cầu, đánh dấu mã không hợp lệ để chủ dự án xem |
| Affiliate bị khóa khi còn hoa hồng chưa trả | Hoa hồng đã chốt vẫn được xử lý bình thường |
| Khách chỉ trả một phần rồi dừng | Dự án hủy hoặc tạm dừng, hoa hồng điều chỉnh theo tiền thực thu (2.3.7) |
| Khoản thu nhập sai | Hủy kèm lý do, nhập lại. Hoa hồng tự cập nhật điều kiện |
| Giá thay đổi vì thêm chức năng | Báo giá bổ sung, ghi rõ có tính hoa hồng hay không |
| Khách chưa thanh toán đủ sau khi đã bàn giao | Dự án vẫn “Đã bàn giao”, hoa hồng giữ ở “Dự kiến” cho đến khi thu đủ |
| Người thực hiện cũng là affiliate | Tiền công và hoa hồng ghi riêng ở từng dự án |

## 11. Ngoài phạm vi

Đăng ký affiliate công khai, thanh toán trực tuyến, tự động rút hoa hồng, chat hoặc đàm phán giá trong web, quản lý công việc phức tạp, hoa hồng nhiều cấp, bậc thang hoặc sàn hoa hồng.

## 12. Còn cần điền

1. Con số tỷ lệ hoa hồng cố định (đặt trong cài đặt).
2. Nội dung chính sách cộng tác viên và điều khoản mẫu gửi khách (mức cọc, bảo hành, hosting sẽ thương lượng riêng từng dự án).
3. Hình thức hoạt động của chủ dự án (cá nhân hay hộ kinh doanh), cách xuất hóa đơn, kèm hướng dẫn thuế từ kế toán.
