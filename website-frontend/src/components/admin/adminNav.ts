import {
  BadgeCheck,
  FileCheck2,
  FolderTree,
  LayoutDashboard,
  Users,
  Vault,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  /** Path under /[locale]/admin; "" is the dashboard. */
  path: string;
  label: string;
  icon: LucideIcon;
  labelKey?: "payouts" | "fees" | "monitoring" | "audit" | "reconciliation";
  /** Shown as a small tag; "soon" items have a placeholder page only. */
  badge?: "soon";
};

export type AdminNavGroup = { title: string; items: AdminNavItem[] };

// Sidebar menu. To add a feature: add an item here and create
// src/app/[locale]/admin/<path>/page.tsx.
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Tổng quan",
    items: [{ path: "", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Provider",
    items: [
      { path: "providers", label: "Quản lý Provider", icon: BadgeCheck },
      { path: "verifications", label: "Giấy tờ xác minh", icon: FileCheck2 },
      { path: "score-reviews", label: "Xét điểm 0–4", icon: FileCheck2 },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { path: "users", label: "Người dùng", icon: Users },
      { path: "categories", label: "Danh mục", icon: FolderTree },
    ],
  },
  {
    title: "Kiểm duyệt",
    items: [
      { path: "jobs", label: "Job", icon: FileCheck2 },
      { path: "reviews", label: "Review", icon: FileCheck2 },
      { path: "reports", label: "Report", icon: FileCheck2 },
      { path: "disputes", label: "Dispute", icon: FileCheck2 },
    ],
  },
  {
    title: "Tài chính",
    items: [
      { path: "escrow", label: "Ký quỹ", icon: Vault },
      { path: "fees", label: "Phí", labelKey: "fees", icon: Vault },
      { path: "payouts", label: "Lệnh rút tiền", labelKey: "payouts", icon: Vault },
      { path: "sanctions", label: "Chế tài", icon: Users },
      { path: "monitoring", label: "Giám sát", labelKey: "monitoring", icon: LayoutDashboard },
      { path: "audit", label: "Audit", labelKey: "audit", icon: FileCheck2 },
      { path: "reconciliation", label: "Đối soát", labelKey: "reconciliation", icon: Vault },
    ],
  },
];

export const adminHref = (locale: string, path: string) =>
  path ? `/${locale}/admin/${path}` : `/${locale}/admin`;
