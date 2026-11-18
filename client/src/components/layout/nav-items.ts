import { LayoutDashboardIcon, StethoscopeIcon, UsersIcon, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/doctors", label: "Doctors", icon: StethoscopeIcon },
  { href: "/patients", label: "Patients", icon: UsersIcon },
];
