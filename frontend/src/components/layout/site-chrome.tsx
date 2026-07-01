"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ScrollToTop } from "@/components/layout/scroll-to-top";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isPropertyDetailRoute =
    /^\/properties\/[^/]+$/.test(pathname) || /^\/properties\/[^/]+\/apply$/.test(pathname);
  const isLeasesRoute = pathname === "/leases" || /^\/leases\/[^/]+$/.test(pathname);
  const isMaintenanceRoute = pathname === "/maintenance" || /^\/maintenance\/[^/]+$/.test(pathname);
  const isNotificationsRoute = pathname === "/notifications";
  const isLandlordRoute = pathname === "/landlord" || pathname.startsWith("/landlord/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isInspectorRoute = pathname === "/inspector" || pathname.startsWith("/inspector/");
  const isTenantDashboardRoute = pathname === "/dashboard";
  const isPaymentsRoute = pathname === "/payments" || pathname.startsWith("/payments/");

  if (
    isAuthRoute ||
    isPropertyDetailRoute ||
    isLeasesRoute ||
    isMaintenanceRoute ||
    isNotificationsRoute ||
    isLandlordRoute ||
    isAdminRoute ||
    isInspectorRoute ||
    isTenantDashboardRoute ||
    isPaymentsRoute
  ) {
    return <>{children}</>;
  }

  return (
    <>
      {!isHome && <Header />}
      {children}
      {!isHome && <Footer />}
      <ScrollToTop />
    </>
  );
}
