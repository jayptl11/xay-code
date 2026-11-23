import { db } from "./db";

export const OTHER_SERVICE = "other";

export const publishedServiceFilter = { type: "SERVICE", published: true } as const;

const previewServices = [
  ["Website cá nhân & portfolio", "Portfolio, landing page và website giới thiệu sản phẩm."],
  ["Website doanh nghiệp & bán hàng", "Trang giới thiệu doanh nghiệp, danh mục sản phẩm hoặc cửa hàng trực tuyến."],
  ["Phần mềm quản lý & đặt lịch", "Công cụ theo dõi công việc, đặt lịch và quản lý dữ liệu theo quy trình của bạn."],
  ["Backend, API & tích hợp", "Xây API, kết nối phần mềm và tự động hóa những bước lặp lại."],
  ["Sửa lỗi, nâng cấp & triển khai", "Tìm lỗi, bổ sung chức năng hoặc đưa dự án hiện có lên máy chủ."],
  ["Kèm cặp & review code", "Hướng dẫn triển khai ý tưởng, giải thích mã nguồn và review code."],
];

export async function getPublishedServices() {
  if (!process.env.DATABASE_URL) {
    // Allow the public design preview to render before a development database is configured.
    return previewServices.map(([title, description], index) => ({ id: "preview-" + index, title, description }));
  }
  return db.content.findMany({
    where: publishedServiceFilter,
    select: { id: true, title: true, description: true },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });
}
