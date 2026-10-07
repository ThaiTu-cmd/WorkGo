export interface NavItem {
  titleKey: string;
  href: string;
  icon: string;
  badge?: string;
  featureFlag?: string;
}

export const CLIENT_NAV_ITEMS: NavItem[] = [
  {
    titleKey: "nav.dashboard",
    href: "/client",
    icon: "LayoutDashboard",
  },
  {
    titleKey: "nav.posts",
    href: "/posts",
    icon: "Briefcase",
  },
  {
    titleKey: "nav.myPosts",
    href: "/client/posts",
    icon: "FileText",
  },
  {
    titleKey: "nav.applications",
    href: "/client/applications",
    icon: "Inbox",
  },
  {
    titleKey: "nav.wallet",
    href: "/wallet",
    icon: "Wallet",
  },
  {
    titleKey: "nav.settings",
    href: "/settings",
    icon: "Settings",
  },
];

export const PROVIDER_NAV_ITEMS: NavItem[] = [
  {
    titleKey: "nav.dashboard",
    href: "/provider",
    icon: "LayoutDashboard",
  },
  {
    titleKey: "nav.posts",
    href: "/posts",
    icon: "Briefcase",
  },
  {
    titleKey: "nav.providerProfile",
    href: "/settings?tab=provider",
    icon: "ShieldCheck",
  },
  {
    titleKey: "nav.wallet",
    href: "/wallet",
    icon: "Wallet",
  },
  {
    titleKey: "nav.settings",
    href: "/settings",
    icon: "Settings",
  },
];
