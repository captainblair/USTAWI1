export type NavLink = {
  href: string;
  label: string;
  matchPath?: string;
  matchHash?: string;
  external?: boolean;
};

/** Signed-in account shortcuts shown in mobile nav drawers. */
export function getAccountNavLinks(role: string): NavLink[] {
  const links: NavLink[] = [];

  if (role === "TENANT") {
    links.push(
      { href: "/dashboard", label: "Dashboard", matchPath: "/dashboard" },
      { href: "/applications", label: "Applications", matchPath: "/applications" },
      { href: "/leases", label: "Leases", matchPath: "/leases" },
      { href: "/payments", label: "Payments", matchPath: "/payments" },
      { href: "/maintenance", label: "Maintenance", matchPath: "/maintenance" },
      { href: "/notifications", label: "Notifications", matchPath: "/notifications" },
      { href: "/saved", label: "Saved", matchPath: "/saved" },
    );
  }

  if (role === "LANDLORD" || role === "AGENT") {
    links.push(
      { href: "/landlord", label: "Dashboard", matchPath: "/landlord" },
      { href: "/landlord/properties", label: "Properties", matchPath: "/landlord/properties" },
      { href: "/landlord/applications", label: "Applications", matchPath: "/landlord/applications" },
      { href: "/landlord/leases", label: "Leases", matchPath: "/landlord/leases" },
      { href: "/landlord/maintenance", label: "Maintenance", matchPath: "/landlord/maintenance" },
      { href: "/notifications", label: "Notifications", matchPath: "/notifications" },
    );
  }

  if (role === "ADMIN") {
    links.push(
      { href: "/admin", label: "Admin", matchPath: "/admin" },
      { href: "/inspector", label: "Inspector", matchPath: "/inspector" },
    );
  }

  if (role === "INSPECTOR") {
    links.push({ href: "/inspector", label: "Inspector", matchPath: "/inspector" });
  }

  links.push({ href: "/profile", label: "Profile", matchPath: "/profile" });
  return links;
}

/** Homepage navbar — wireframe-inspired, Nenasasa-style */
export const HOME_NAV_LINKS: NavLink[] = [
  { href: "/properties", label: "Search", matchPath: "/properties" },
  { href: "/#how-it-works", label: "How it works", matchHash: "how-it-works" },
  { href: "/#why-ustawi", label: "Why Ustawi", matchHash: "why-ustawi" },
  { href: "/#testimonials", label: "Testimonials", matchHash: "testimonials" },
  { href: "/#faq", label: "FAQ", matchHash: "faq" },
  { href: "/#contact", label: "Contact", matchHash: "contact" },
];

/** Inner pages — extended navigation */
export const APP_NAV_LINKS: NavLink[] = [
  { href: "/properties", label: "Search", matchPath: "/properties" },
  { href: "/applications", label: "Applications", matchPath: "/applications" },
  { href: "/leases", label: "Leases", matchPath: "/leases" },
  { href: "/maintenance", label: "Maintenance", matchPath: "/maintenance" },
  { href: "/saved", label: "Saved", matchPath: "/saved" },
  { href: "/profile", label: "Profile", matchPath: "/profile" },
  { href: "/#how-it-works", label: "How it works", matchHash: "how-it-works" },
  { href: "/#why-ustawi", label: "Why Ustawi", matchHash: "why-ustawi" },
  { href: "/#testimonials", label: "Testimonials", matchHash: "testimonials" },
  { href: "/#faq", label: "FAQ", matchHash: "faq" },
  { href: "/#contact", label: "Contact", matchHash: "contact" },
];
