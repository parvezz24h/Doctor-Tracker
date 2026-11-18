import { Suspense } from "react";

import { Brand } from "./brand";
import { CommandMenu } from "./command-menu";
import { MobileNav } from "./mobile-nav";
import { PageTitle } from "./page-title";
import { SidebarNav, SidebarNavFallback } from "./sidebar-nav";
import { SidebarToggle } from "./sidebar-toggle";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen transition-[padding] duration-200 lg:pl-64 lg:sidebar-collapsed:pl-[4.5rem]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex lg:sidebar-collapsed:w-[4.5rem]">
        <div className="flex h-16 items-center border-b px-5 sidebar-collapsed:px-[1.125rem]">
          <Brand />
        </div>
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-3 pt-4">
          <Suspense fallback={<SidebarNavFallback />}>
            <SidebarNav />
          </Suspense>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8 2xl:px-10">
        <MobileNav />
        <SidebarToggle className="-ml-2 hidden lg:flex" />
        <Brand className="lg:hidden" />
        <Suspense fallback={null}>
          <PageTitle />
        </Suspense>
        <div className="ml-auto flex items-center gap-1.5">
          <CommandMenu />
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <main id="main" className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 2xl:px-10">
        {children}
      </main>
    </div>
  );
}
