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
      { path: "jobs", label: "Job", icon: FileCheck2, badge: "soon" },
      { path: "reviews", label: "Review", icon: FileCheck2, badge: "soon" },
      { path: "reports", label: "Report", icon: FileCheck2, badge: "soon" },
      { path: "disputes", label: "Dispute", icon: FileCheck2, badge: "soon" },
    ],
  },
  {
    title: "Tài chính",
    items: [
      { path: "escrow", label: "Ký quỹ", icon: Vault, badge: "soon" },
      { path: "fees", label: "Phí", icon: Vault, badge: "soon" },
      { path: "sanctions", label: "Chế tài", icon: Users, badge: "soon" },
      { path: "monitoring", label: "Giám sát", icon: LayoutDashboard, badge: "soon" },
      { path: "audit", label: "Audit", icon: FileCheck2, badge: "soon" },
      { path: "reconciliation", label: "Đối soát", icon: Vault, badge: "soon" },
    ],
  },
];

export const adminHref = (locale: string, path: string) =>
  path ? `/${locale}/admin/${path}` : `/${locale}/admin`;
