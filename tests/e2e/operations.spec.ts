import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.TEST_ADMIN_EMAIL ?? "admin@example.test";
const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? "";
const stamp = Date.now().toString(36);

async function login(page: Page, email: string, password: string) {
  await page.goto("/dang-nhap");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}

async function createAffiliate(page: Page, name: string, email: string) {
  await page.goto("/admin/affiliate");
  await page.getByLabel("Họ và tên").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Số điện thoại").fill("0912345678");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo CTV" })).toBeVisible();
  const password = await page.locator(".copy-row code").innerText();
  const row = page.getByRole("row").filter({ hasText: email });
  const affiliateCode = await row.locator("code").innerText();
  return { password, affiliateCode };
}

async function activate(page: Page, email: string, password: string) {
  await login(page, email, password);
  await expect(page).toHaveURL(/doi-mat-khau/);
  await page.getByLabel("Mật khẩu hiện tại").fill(password);
  const newPassword = "Affiliate-Test-" + stamp;
  await page.getByLabel("Mật khẩu mới (từ 12 ký tự)", { exact: true }).fill(newPassword);
  await page.getByLabel("Nhập lại mật khẩu mới").fill(newPassword);
  await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
  await expect(page).toHaveURL(/\/affiliate$/);
}

const vietnamTime = (millis = Date.now()) => new Date(millis + 7 * 3600_000).toISOString().slice(0, 16);

async function addSchedule(page: Page, day: string, ...amounts: string[]) {
  for (const [i, amount] of amounts.entries()) {
    if (i > 0) await page.getByRole("button", { name: "Thêm đợt thanh toán" }).click();
    await page.getByLabel(`Tên đợt ${i + 1}`, { exact: true }).fill(i ? "Còn lại" : "Đặt cọc");
    await page.getByLabel(`Số tiền đợt ${i + 1} (đồng)`, { exact: true }).fill(amount);
    await page.getByLabel(`Hạn đợt ${i + 1}`, { exact: true }).fill(day);
  }
}

async function setRate(page: Page, rate: string) {
  await page.goto("/admin/cai-dat");
  await page.getByLabel("Tỷ lệ hoa hồng mặc định (%)").fill(rate);
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã lưu cài đặt" })).toBeVisible();
}

async function reviewQuote(page: Page, confirmedAt: string, evidence: string) {
  await page.getByLabel("Ngày giờ khách xác nhận").fill(confirmedAt);
  await page.getByLabel("Nội dung hoặc link xác nhận").fill(evidence);
  await page.getByRole("button", { name: "Xem lại trước khi chốt" }).click();
}

test("đăng nhập, cách ly dữ liệu, từ giới thiệu đến trả hoa hồng", async ({ page, browser, baseURL }) => {
  test.skip(!adminPassword, "Cần tài khoản admin trên một DB kiểm thử riêng.");
  const a = await browser.newPage({ baseURL });
  const b = await browser.newPage({ baseURL });
  const guest = await browser.newPage({ baseURL });
  const emailA = "alpha-" + stamp + "@example.test";
  const emailB = "beta-" + stamp + "@example.test";
  const title = "Web đặt lịch " + stamp;

  await guest.goto("/admin/affiliate");
  await expect(guest).toHaveURL(/dang-nhap/);
  await login(page, adminEmail, adminPassword);
  await expect(page).toHaveURL(/\/admin$/);
  const alpha = await createAffiliate(page, "Affiliate Alpha", emailA);
  const beta = await createAffiliate(page, "Affiliate Beta", emailB);
  expect(alpha.affiliateCode).not.toBe(beta.affiliateCode);
  await activate(a, emailA, alpha.password);
  await activate(b, emailB, beta.password);
  await b.goto("/admin/affiliate");
  await expect(b).toHaveURL(/\/affiliate$/);
  await expect(b.getByText(alpha.affiliateCode)).toHaveCount(0);

  await guest.goto("/?ref=" + alpha.affiliateCode);
  await guest.getByRole("link", { name: "Gửi yêu cầu dự án" }).click();
  await expect(guest.getByLabel("Mã người giới thiệu")).toHaveValue(alpha.affiliateCode);
  await guest.getByLabel("Tên người liên hệ").fill("Khách kiểm thử");
  await guest.getByLabel("Email", { exact: true }).fill("khach-" + stamp + "@example.test");
  await guest.getByLabel("Loại dự án").selectOption({ label: "Phần mềm quản lý & đặt lịch" });
  await guest.getByLabel("Tên dự án (nếu có)").fill(title);
  await guest.getByLabel("Mô tả yêu cầu").fill("Ứng dụng cho khách hàng đặt lịch và nhân viên duyệt lịch.");
  await guest.getByRole("checkbox").check();
  await guest.getByRole("button", { name: "Gửi yêu cầu", exact: true }).click();
  await expect(guest.getByRole("status").filter({ hasText: "Đã gửi yêu cầu YC-" })).toBeVisible();
  await a.reload();
  await expect(a.getByText(title)).toBeVisible();
  await b.goto("/affiliate", { waitUntil: "domcontentloaded" });
  await expect(b.getByRole("heading", { name: "Xin chào, Affiliate Beta" })).toBeVisible();
  await expect(b.getByText(title)).toHaveCount(0);

  await setRate(page, "10");
  await page.goto("/admin/yeu-cau");
  await page.getByRole("link", { name: title }).click();
  const day = await page.getByLabel("Ngày bắt đầu").inputValue();
  await page.getByLabel("Sản phẩm bàn giao").fill("Mã nguồn và tài liệu");
  await page.getByLabel("Giá phát triển (đồng)").fill("6000000");
  await page.getByLabel("Dự kiến bàn giao").fill(day);
  await addSchedule(page, day, "2000000", "3999999");
  await page.getByLabel("Bảo hành", { exact: true }).fill("30 ngày");
  await page.getByLabel("Hosting sau bàn giao").fill("Khách tự quản lý");
  const draft = page.getByRole("button", { name: "Lưu bản nháp" });
  await draft.click();
  await expect(page.getByRole("alert").filter({ hasText: "Tổng các đợt thanh toán phải bằng giá phát triển" })).toBeVisible();
  await page.getByLabel("Số tiền đợt 2 (đồng)").fill("4000000");
  await draft.click();
  await expect(page.getByText("Phiên bản 1 · 6.000.000 ₫ · Nháp")).toBeVisible();
  await page.getByRole("button", { name: "Đánh dấu đã gửi" }).click();
  await expect(page.getByText("Phiên bản 1 · 6.000.000 ₫ · Đã gửi")).toBeVisible();
  await expect(page.getByLabel("Số tiền đợt 2 (đồng)")).toHaveValue("4000000");
  await page.getByLabel("Điều khoản riêng").fill("Điều khoản cập nhật cho bản 2");
  await draft.click();
  await expect(page.getByText("Phiên bản 1 · 6.000.000 ₫ · Đã gửi")).toBeVisible();
  await expect(page.getByText("Phiên bản 2 · 6.000.000 ₫ · Nháp")).toBeVisible();
  await page.getByRole("button", { name: "Đánh dấu đã gửi" }).click();
  await expect(page.getByText("Phiên bản 1 · 6.000.000 ₫ · Đã thay thế")).toBeVisible();
  await reviewQuote(page, vietnamTime(Date.now() - 24 * 3600_000), "Khách đồng ý qua email");
  await expect(page.getByRole("alert").filter({ hasText: "Giờ khách xác nhận phải từ lúc gửi báo giá" })).toBeVisible();
  const at = vietnamTime();
  await reviewQuote(page, at, "Khách xác nhận bản 2 qua email");
  const preview = page.getByRole("region", { name: "Bản xem lại báo giá" });
  await expect(preview).toContainText("600.000 ₫");
  const rateTab = await page.context().newPage();
  await setRate(rateTab, "12");
  const confirm = (tab: Page) => tab.getByRole("button", { name: "Xác nhận và tạo dự án" });
  await confirm(page).click();
  await expect(page.getByRole("alert").filter({ hasText: "Thông tin chốt đã thay đổi" })).toBeVisible();
  await expect(preview).toContainText("720.000 ₫");
  await expect(page.getByRole("link", { name: /Mở dự án DA-/ })).toHaveCount(0);
  const quoteUrl = page.url();
  await rateTab.goto(quoteUrl);
  await reviewQuote(rateTab, at, "Khách xác nhận bản 2 qua email");
  await expect(rateTab.getByRole("region", { name: "Bản xem lại báo giá" })).toContainText("720.000 ₫");
  const isQuoteResponse = (response: import("@playwright/test").Response) => response.request().method() === "POST" && response.url() === quoteUrl;
  await Promise.all([
    page.waitForResponse(isQuoteResponse), rateTab.waitForResponse(isQuoteResponse),
    confirm(page).click(), confirm(rateTab).click(),
  ]);
  await expect.poll(async () => {
    const alerts = await Promise.all([page, rateTab].map((tab) => tab.getByRole("alert").allTextContents()));
    return alerts.flat().join(" ");
  }).toMatch(/Yêu cầu đã kết thúc|Dữ liệu vừa được cập nhật|Dữ liệu đang được cập nhật/);
  await setRate(rateTab, "20");
  await rateTab.close();
  await page.goto(quoteUrl);
  await expect(page.getByRole("link", { name: /Mở dự án DA-/ })).toHaveCount(1);
  await page.goto("/admin/du-an");
  await expect(page.getByRole("link", { name: title, exact: true })).toHaveCount(1);
  await page.goto(quoteUrl);
  await page.getByRole("link", { name: /Mở dự án DA-/ }).click();
  await expect(page.getByText("Chờ cọc", { exact: true })).toBeVisible();
  await expect(page.getByText(/Dự kiến 720\.000 ₫/)).toBeVisible();
  await page.getByText("Ghi khoản thu hoặc hoàn", { exact: true }).click();
  const addMoney = async (value: string, label: string, refund = false) => {
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Ghi giao dịch" }) });
    await form.getByLabel("Loại giao dịch").selectOption(refund ? "refund" : "receipt");
    await form.getByLabel("Số tiền (đồng)").fill(value);
    await form.getByLabel("Nội dung", { exact: true }).fill(label);
    if (refund) await form.getByLabel("Ghi chú / Lý do hoàn hoặc thu vượt").fill("Hoàn theo thỏa thuận kiểm thử");
    await form.getByRole("button", { name: "Ghi giao dịch" }).click();
    await expect(page.getByRole("cell", { name: new RegExp(label) }).first()).toBeVisible();
  };
  await addMoney("2000000", "Cọc kiểm thử");
  await page.getByText("Bắt đầu làm", { exact: true }).first().click();
  await page.getByRole("button", { name: "Bắt đầu làm" }).click();
  await expect(page.getByText("Đang làm", { exact: true })).toBeVisible();
  await page.getByText("Chờ khách phản hồi", { exact: true }).first().click();
  await page.getByLabel("Thông tin bản demo hoặc cập nhật đã gửi").fill("Đã gửi link demo cho khách");
  await page.getByRole("button", { name: "Chờ khách phản hồi" }).click();
  await expect(page.locator(".page-title")).toContainText("Chờ khách phản hồi");
  await page.getByText("Quay lại đang làm", { exact: true }).first().click();
  await page.getByRole("button", { name: "Quay lại đang làm" }).click();
  await expect(page.locator(".page-title")).toContainText("Đang làm");
  await addMoney("4000000", "Phần còn lại kiểm thử");
  await page.getByText("Ghi đã bàn giao", { exact: true }).first().click();
  await page.getByLabel("Thông tin bàn giao").fill("Đã gửi mã nguồn");
  await page.getByRole("button", { name: "Ghi đã bàn giao" }).click();
  await page.getByText("Ghi hoàn thành", { exact: true }).first().click();
  await page.getByLabel("Ngày và cách khách nghiệm thu").fill("Khách xác nhận hôm nay");
  await page.getByRole("button", { name: "Ghi hoàn thành" }).click();
  await expect(page.getByText("Đủ điều kiện trả", { exact: true })).toBeVisible();
  const projectUrl = page.url();
  await page.getByRole("link", { name: "Ghi nhận lần trả", exact: true }).click();
  await page.getByLabel(new RegExp(title)).check();
  await page.getByLabel("Số tiền đã chuyển (đồng)").fill("720000");
  const referencePrefix = "TEST-" + stamp;
  await page.getByLabel("Mã giao dịch", { exact: true }).fill(referencePrefix + "-1");
  const otherAdmin = await page.context().newPage();
  await otherAdmin.goto("/admin/hoa-hong");
  await otherAdmin.getByLabel(new RegExp(title)).check();
  await otherAdmin.getByLabel("Số tiền đã chuyển (đồng)").fill("720000");
  await otherAdmin.getByLabel("Mã giao dịch", { exact: true }).fill(referencePrefix + "-2");
  const isPayoutResponse = (response: import("@playwright/test").Response) =>
    response.request().method() === "POST" && response.url().endsWith("/admin/hoa-hong");
  await Promise.all([
    page.waitForResponse(isPayoutResponse),
    otherAdmin.waitForResponse(isPayoutResponse),
    page.getByRole("button", { name: "Ghi nhận đã chuyển" }).click(),
    otherAdmin.getByRole("button", { name: "Ghi nhận đã chuyển" }).click(),
  ]);
  await expect.poll(async () => {
    const messages = await Promise.all([page, otherAdmin].map((tab) => tab.getByRole("alert").allTextContents()));
    return messages.flat().join(" ");
  }).toMatch(/Có khoản đã trả hoặc chưa đủ điều kiện\.|Dữ liệu đang được cập nhật\./);
  await expect.poll(async () => {
    await page.goto("/admin/hoa-hong");
    return page.getByRole("cell", { name: new RegExp(referencePrefix) }).count();
  }).toBe(1);
  await otherAdmin.close();
  await expect(page.getByLabel(new RegExp(title))).toHaveCount(0);
  await page.goto(projectUrl);
  await page.getByText("Ghi khoản thu hoặc hoàn", { exact: true }).click();
  await addMoney("1000000", "Hoàn kiểm thử", true);
  await a.reload();
  await expect(a.getByRole("cell", { name: new RegExp(referencePrefix) })).toBeVisible();
  await b.goto("/affiliate", { waitUntil: "domcontentloaded" });
  await expect(b.getByRole("heading", { name: "Xin chào, Affiliate Beta" })).toBeVisible();
  await expect(b.getByText(new RegExp(referencePrefix))).toHaveCount(0);

  const followup = "Dự án thứ hai " + stamp;
  await guest.goto("/gui-yeu-cau");
  await guest.getByLabel("Tên người liên hệ").fill("Khách kiểm thử");
  await guest.getByLabel("Email", { exact: true }).fill(("khach-" + stamp + "@example.test").toUpperCase());
  await guest.getByLabel("Loại dự án").selectOption({ label: "Phần mềm quản lý & đặt lịch" });
  await guest.getByLabel("Tên dự án (nếu có)").fill(followup);
  await guest.getByLabel("Mô tả yêu cầu").fill("Dự án thứ hai với cùng địa chỉ email khách hàng.");
  await guest.getByRole("checkbox").check();
  await guest.getByRole("button", { name: "Gửi yêu cầu", exact: true }).click();
  await expect(guest.getByRole("status").filter({ hasText: "Đã gửi yêu cầu YC-" })).toBeVisible();
  await page.goto("/admin/yeu-cau");
  await page.getByRole("link", { name: followup }).click();
  await page.getByLabel("Sản phẩm bàn giao").fill("Mã nguồn và tài liệu");
  await page.getByLabel("Giá phát triển (đồng)").fill("2000000");
  await page.getByLabel("Dự kiến bàn giao").fill(day);
  await addSchedule(page, day, "1000000", "1000000");
  await page.getByLabel("Bảo hành", { exact: true }).fill("30 ngày");
  await page.getByLabel("Hosting sau bàn giao").fill("Khách tự quản lý");
  await page.getByRole("button", { name: "Lưu bản nháp" }).click();
  await page.getByRole("button", { name: "Đánh dấu đã gửi" }).click();
  await reviewQuote(page, vietnamTime(), "Khách đồng ý dự án thứ hai qua email");
  await expect(page.getByRole("region", { name: "Bản xem lại báo giá" })).toContainText("Khách đã có dự án trước đó.");
  await page.getByRole("button", { name: "Xác nhận và tạo dự án" }).click();
  await page.getByRole("link", { name: /Mở dự án DA-/ }).click();
  await expect(page.getByText("Dự án này không phát sinh hoa hồng.")).toBeVisible();
  await page.getByText("Ghi khoản thu hoặc hoàn", { exact: true }).click();
  await addMoney("1000000", "Cọc dự án thứ hai");
  await page.getByText("Hủy dự án", { exact: true }).first().click();
  const cancel = page.locator("form").filter({ has: page.getByRole("button", { name: "Hủy dự án", exact: true }) });
  await cancel.getByLabel("Lý do hủy").fill("Khách dừng sau khi cọc");
  await cancel.getByRole("button", { name: "Hủy dự án", exact: true }).click();
  await expect(page.getByText("Đã hủy", { exact: true })).toBeVisible();
  await expect(page.getByText("Dự án này không phát sinh hoa hồng.")).toBeVisible();

  await page.goto("/admin/affiliate");
  await page.getByRole("row").filter({ hasText: emailA }).getByRole("button", { name: "Khóa tài khoản" }).click();
  await expect(page.getByRole("row").filter({ hasText: emailA }).getByText("Đã khóa", { exact: true })).toBeVisible();
  await a.reload();
  await expect(a).toHaveURL(/dang-nhap/);
  await Promise.all([a.close(), b.close(), guest.close()]);
});

test("đợt 2 nhận đúng loại dự án và nguồn, kiểm tra chính sách affiliate", async ({ page, browser, baseURL }) => {
  test.skip(!adminPassword, "Cần tài khoản admin trên một DB kiểm thử riêng.");
  const guest = await browser.newPage({ baseURL, viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const a = await browser.newPage({ baseURL });
  const b = await browser.newPage({ baseURL });
  const emailA = "intake-a-" + stamp + "@example.test";
  const emailB = "intake-b-" + stamp + "@example.test";
  const contact = "khach-intake-" + stamp + "@example.test";
  const service = "Dịch vụ kiểm thử " + stamp;
  const submit = (tab: Page) => tab.getByRole("button", { name: "Gửi yêu cầu", exact: true });
  const notice = (tab: Page) => tab.getByRole("status").filter({ hasText: /Đã gửi yêu cầu YC-\d{6}\./ });
  const consent = (tab: Page) => tab.getByRole("checkbox", { name: /đồng ý/ });
  const fill = async (tab: Page, label: string, phone = "") => {
    await tab.getByLabel("Tên người liên hệ").fill("Khách đợt 2");
    await tab.getByLabel("Email", { exact: true }).fill(contact);
    await tab.getByLabel("Số điện thoại / Zalo").fill(phone);
    await tab.getByLabel("Tên dự án (nếu có)").fill(label);
    await tab.getByLabel("Mô tả yêu cầu").fill("Cần xây dựng trang để khách hàng tự đặt lịch trực tuyến.");
  };
  const waitForRequest = async (tab: Page) => {
    await expect(notice(tab)).toBeVisible();
    return (await notice(tab).innerText()).match(/YC-\d{6}/)![0];
  };

  try {
    await login(page, adminEmail, adminPassword);
    await expect(page).toHaveURL(/\/admin$/);
    const alpha = await createAffiliate(page, "Intake Alpha " + stamp, emailA);
    const beta = await createAffiliate(page, "Intake Beta " + stamp, emailB);
    await activate(a, emailA, alpha.password);
    await activate(b, emailB, beta.password);

    await page.goto("/admin/cai-dat");
    await page.getByText("Thêm dịch vụ hoặc dự án mẫu", { exact: true }).click();
    const added = page.locator("details").filter({ has: page.getByText("Thêm dịch vụ hoặc dự án mẫu", { exact: true }) });
    await added.getByLabel("Tiêu đề").fill(service);
    await added.getByLabel("Mô tả", { exact: true }).fill("Loại dịch vụ dùng để kiểm thử danh mục công khai.");
    await added.getByLabel("Hiển thị trên website").check();
    await added.getByRole("button", { name: "Thêm nội dung" }).click();
    await expect(added.getByRole("status").filter({ hasText: "Đã lưu nội dung" })).toBeVisible();

    await guest.goto("/#dich-vu");
    const serviceRow = guest.locator("#dich-vu details").filter({ hasText: service });
    if (await serviceRow.getAttribute("open") === null) await serviceRow.locator("summary").click();
    await serviceRow.getByRole("link", { name: "Trao đổi về hạng mục này" }).click();
    const serviceOption = guest.locator("select[name=category] option:checked");
    await expect(serviceOption).toHaveText(service);
    await expect(guest.getByLabel("Tên dự án (nếu có)")).toHaveValue("");
    await expect(guest.getByLabel("Mã người giới thiệu")).toHaveCount(0);
    await fill(guest, "Intake trực tiếp " + stamp, "+84 (912) 345-678");
    await consent(guest).check();
    await submit(guest).click();
    const directCode = await waitForRequest(guest);
    await expect(notice(guest)).toContainText("Xây Code sẽ liên hệ");
    await expect(submit(guest)).toHaveCount(0);
    await guest.getByRole("button", { name: "Gửi yêu cầu khác" }).click();
    await expect(guest.getByLabel("Tên người liên hệ")).toHaveValue("");

    await page.goto("/admin/cai-dat");
    const editing = page.locator("details").filter({ hasText: service });
    await editing.locator("summary").click();
    await editing.getByLabel("Tiêu đề").fill(service + " đã đổi tên");
    await editing.getByLabel("Hiển thị trên website").uncheck();
    await editing.getByRole("button", { name: "Lưu nội dung" }).click();
    await expect(page.getByText(service + " đã đổi tên · Đang ẩn")).toBeVisible();
    await fill(guest, "Intake dịch vụ cũ " + stamp);
    await consent(guest).check();
    await submit(guest).click();
    await expect(guest.getByRole("alert").filter({ hasText: "Loại dự án này không còn trong danh sách" })).toBeVisible();

    await a.goto("/affiliate/gui-yeu-cau");
    await expect(submit(a)).toHaveCount(0);
    await expect(a.getByRole("link", { name: "chính sách cộng tác viên" })).toBeVisible();
    await a.goto("/affiliate");
    await a.getByRole("button", { name: "Đồng ý chính sách" }).click();
    await expect(a.getByRole("heading", { name: "Đồng ý chính sách cộng tác viên" })).toHaveCount(0);
    await a.goto("/affiliate/gui-yeu-cau");
    await expect(submit(a)).toBeVisible();
    await fill(a, "Intake gửi thay " + stamp, "0912345678");
    await a.getByLabel("Loại dự án").selectOption({ label: "Khác" });
    await submit(a).click();
    expect(await consent(a).evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    await consent(a).check();

    await page.getByLabel("Nội dung chính sách").fill("Chính sách thử nghiệm đợt 2 · " + stamp);
    await page.getByRole("button", { name: "Công bố phiên bản mới" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Đã công bố phiên bản mới" })).toBeVisible();
    await b.getByRole("button", { name: "Đồng ý chính sách" }).click();
    await expect(b.getByRole("alert").filter({ hasText: "Chính sách đã cập nhật" })).toBeVisible();
    await submit(a).click();
    await expect(a.getByRole("alert").filter({ hasText: "Đọc và đồng ý chính sách cộng tác viên trước khi gửi" })).toBeVisible();
    await a.goto("/affiliate");
    await expect(a.getByText("Chính sách thử nghiệm đợt 2 · " + stamp)).toBeVisible();
    await a.getByRole("button", { name: "Đồng ý chính sách" }).click();
    await expect(a.getByRole("heading", { name: "Đồng ý chính sách cộng tác viên" })).toHaveCount(0);
    await a.goto("/affiliate/gui-yeu-cau");
    await expect(submit(a)).toBeVisible();
    const ownTitle = "Intake gửi thay " + stamp;
    await fill(a, ownTitle, "0912345678");
    await a.getByLabel("Loại dự án").selectOption({ label: "Khác" });
    await consent(a).check();
    await submit(a).click();
    const ownCode = await waitForRequest(a);
    await a.goto("/affiliate");
    const ownRow = a.getByRole("row").filter({ hasText: ownTitle });
    await expect(ownRow).toContainText("0912•••678");
    await expect(ownRow).toContainText("k•••@example.test");
    await expect(ownRow).not.toContainText(contact);
    await b.goto("/affiliate");
    await expect(b.getByText(ownTitle)).toHaveCount(0);
    await page.goto("/admin/affiliate");
    await page.getByRole("row").filter({ hasText: emailB }).getByRole("button", { name: "Khóa tài khoản" }).click();
    await expect(page.getByRole("row").filter({ hasText: emailB })).toContainText("Đã khóa");

    const referrals = [
      [alpha.affiliateCode, "Intake link hợp lệ " + stamp, "Intake Alpha " + stamp],
      ["CTV-KHONG-TON-TAI", "Intake link không tồn tại " + stamp, "Không hợp lệ"],
      [beta.affiliateCode, "Intake link đã khóa " + stamp, "Không hợp lệ"],
    ];
    for (const [code, title] of referrals) {
      const tab = await browser.newPage({ baseURL });
      try {
        await tab.goto("/?ref=" + code);
        await tab.getByRole("link", { name: "Gửi yêu cầu dự án", exact: true }).click();
        const referral = tab.getByLabel("Mã người giới thiệu");
        await expect(referral).toHaveValue(code);
        await expect(referral).not.toBeEditable();
        const cookie = (await tab.context().cookies()).find((item) => item.name === "xayma_ref");
        expect(cookie?.expires).toBeCloseTo(Math.floor(Date.now() / 1000) + 60 * 86400, -2);
        await fill(tab, title);
        await tab.getByLabel("Loại dự án").selectOption({ label: "Khác" });
        await consent(tab).check();
        await submit(tab).click();
        await waitForRequest(tab);
      } finally { await tab.close(); }
    }
    await page.goto("/admin");
    await page.getByRole("link", { name: "Yêu cầu mới " + directCode, exact: true }).click();
    await expect(page.locator(".page-title")).toContainText(directCode + " · " + service);
    await expect(page.locator(".page-title")).not.toContainText("đã đổi tên");
    await expect(page.getByRole("link", { name: /Mở dự án/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Bắt đầu trao đổi" }).click();
    await expect(page.locator(".page-title")).toContainText("Đang trao đổi");
    await page.getByText("Đóng yêu cầu", { exact: true }).first().click();
    await page.getByLabel("Lý do", { exact: true }).fill("Kết thúc kiểm thử");
    await page.getByRole("button", { name: "Đóng yêu cầu" }).click();
    await expect(page.locator(".page-title")).toContainText("Không tiếp tục");
    await page.goto("/admin/yeu-cau?status=NEW");
    await expect(page.getByRole("row").filter({ hasText: ownTitle })).toContainText(ownCode);
    await expect(page.getByRole("row").filter({ hasText: ownTitle })).toContainText("Affiliate gửi");
    for (const [, title, owner] of referrals) {
      const row = page.getByRole("row").filter({ hasText: title });
      await expect(row).toContainText("Mới nhận");
      await expect(row).toContainText("Trùng liên hệ");
      await expect(row).toContainText(owner);
    }
    await page.goto("/admin/yeu-cau?affiliate=" + alpha.affiliateCode);
    await expect(page.getByText(referrals[0][1], { exact: true })).toBeVisible();
    await expect(page.getByText(referrals[1][1], { exact: true })).toHaveCount(0);
    await expect(page.getByText(referrals[2][1], { exact: true })).toHaveCount(0);
  } finally {
    await Promise.all([guest.close(), a.close(), b.close()]);
  }
});

test("menu và chuyển động theo cuộn trên màn hình nhỏ", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 380 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Có ý tưởng\?\s+Mình cùng xây/i })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  const menu = page.locator(".public-mobile-menu");
  const toggle = menu.locator("summary");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("open", "");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(toggle).toBeFocused();

  const preview = page.locator(".booking-preview");
  await expect(preview).toHaveAttribute("data-motion", "waiting");
  await page.mouse.wheel(0, 440);
  await expect(preview).toHaveAttribute("data-motion", "shown");
  await expect(preview.locator(".booking-card")).toHaveCSS("opacity", "1");
  const day = preview.getByRole("button", { name: "Thứ năm, ngày 26" });
  await day.click();
  await expect(day).toHaveAttribute("aria-pressed", "true");
  const slot = preview.getByRole("button", { name: "10:30–11:00" });
  await slot.click();
  await expect(slot).toHaveAttribute("aria-pressed", "true");
  await expect(preview.locator("code")).toContainText('time: "10:30"');
  await expect(preview.getByRole("button", { name: /16:00–16:30/ })).toBeDisabled();
  const next = preview.getByRole("button", { name: /Tiếp tục.*10:30/ });
  await next.click();
  await expect(preview.getByText("Thứ năm, 26/11 · 10:30–11:00")).toBeVisible();
  await preview.getByRole("button", { name: "Chọn lại" }).click();
  await expect(next).toBeFocused();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(preview).toHaveAttribute("data-motion", "shown");

  await toggle.click();
  await menu.getByRole("link", { name: "Quy trình", exact: true }).click();
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(page).toHaveURL(/#quy-trinh$/);
  await expect(page.locator(".public-process")).toHaveAttribute("data-motion", "shown");

  await page.getByRole("link", { name: "Gửi yêu cầu dự án" }).click();
  await expect(page.getByRole("heading", { name: "Gửi yêu cầu dự án" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("giảm chuyển động hiển thị sẵn nội dung và minh họa", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 520 });
  await page.goto("/");
  const preview = page.locator(".booking-preview");
  await expect(preview.locator(".booking-card")).toHaveCSS("opacity", "1");
  await expect(preview.locator(".booking-card")).toHaveCSS("animation-name", "none");
  await page.getByRole("link", { name: "Xem dịch vụ" }).click();
  await expect(page.getByRole("heading", { name: "Bạn cần xây gì?" })).toBeInViewport();
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
});

test("các bước quy trình điều hướng và cập nhật chỉ báo khi cuộn", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1100, height: 520 });
  await page.goto("/#quy-trinh");
  const rail = page.getByRole("navigation", { name: "Các bước thực hiện" });
  const demo = rail.getByRole("link", { name: "Xem bản demo" });
  await demo.click();
  await expect(page).toHaveURL(/#buoc-3$/);
  await expect(demo).toHaveAttribute("aria-current", "step");
  await page.locator("#buoc-4").evaluate((step) => step.scrollIntoView({ block: "start" }));
  await expect(rail.getByRole("link", { name: "Nghiệm thu" })).toHaveAttribute("aria-current", "step");
});
