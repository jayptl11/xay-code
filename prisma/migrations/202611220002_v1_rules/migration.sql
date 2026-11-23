ALTER TABLE "Settings" ADD CONSTRAINT "Settings_commissionBps_check"
  CHECK ("commissionBps" BETWEEN 0 AND 10000);
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_price_check" CHECK ("price" > 0);
ALTER TABLE "ExtraQuote" ADD CONSTRAINT "ExtraQuote_price_check" CHECK ("price" > 0);
ALTER TABLE "MoneyMovement" ADD CONSTRAINT "MoneyMovement_amount_check" CHECK ("amount" > 0);
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_snapshot_check"
  CHECK ("rateBps" BETWEEN 0 AND 10000 AND "base" >= 0 AND "original" >= 0);
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_reduction_check" CHECK ("reduction" > 0);
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_amount_check" CHECK ("amount" > 0);
ALTER TABLE "PayoutLine" ADD CONSTRAINT "PayoutLine_amount_check" CHECK ("amount" > 0);
ALTER TABLE "Content" ADD CONSTRAINT "Content_portfolio_consent_check"
  CHECK ("type" <> 'PORTFOLIO' OR NOT "published" OR "consent");

INSERT INTO "Content" ("id", "type", "title", "description", "published", "position") VALUES
  ('service-portfolio', 'SERVICE', 'Website cá nhân & portfolio', 'Portfolio, landing page và website giới thiệu sản phẩm.', true, 10),
  ('service-business', 'SERVICE', 'Website doanh nghiệp & bán hàng', 'Trang giới thiệu doanh nghiệp, danh mục sản phẩm hoặc cửa hàng trực tuyến.', true, 20),
  ('service-operations', 'SERVICE', 'Phần mềm quản lý & đặt lịch', 'Công cụ theo dõi công việc, đặt lịch và quản lý dữ liệu theo quy trình của bạn.', true, 30),
  ('service-api', 'SERVICE', 'Backend, API & tích hợp', 'Xây API, kết nối phần mềm và tự động hóa những bước lặp lại.', true, 40),
  ('service-maintenance', 'SERVICE', 'Sửa lỗi, nâng cấp & triển khai', 'Tìm lỗi, bổ sung chức năng hoặc đưa dự án hiện có lên máy chủ.', true, 50),
  ('service-mentorship', 'SERVICE', 'Kèm cặp & review code', 'Hướng dẫn triển khai ý tưởng, giải thích mã nguồn và review code.', true, 60);
