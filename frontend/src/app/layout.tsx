import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteChrome } from "@/components/layout/site-chrome";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Ustawi — Find Safe Homes in Kenya",
  description:
    "Your trusted platform for secure living in Kenya. Search verified rentals with safety scores and M-Pesa payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col bg-white font-sans text-ustawi-navy antialiased">
        <QueryProvider>
          <SiteChrome>{children}</SiteChrome>
        </QueryProvider>
      </body>
    </html>
  );
}
