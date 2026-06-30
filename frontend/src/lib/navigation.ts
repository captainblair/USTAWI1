export type NavLink = {
  href: string;
  label: string;
  matchPath?: string;
  matchHash?: string;
  external?: boolean;
};

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
  { href: "/saved", label: "Saved", matchPath: "/saved" },
  { href: "/profile", label: "Profile", matchPath: "/profile" },
  { href: "/#how-it-works", label: "How it works", matchHash: "how-it-works" },
  { href: "/#why-ustawi", label: "Why Ustawi", matchHash: "why-ustawi" },
  { href: "/#testimonials", label: "Testimonials", matchHash: "testimonials" },
  { href: "/#faq", label: "FAQ", matchHash: "faq" },
  { href: "/#contact", label: "Contact", matchHash: "contact" },
];
