import { Poppins } from "next/font/google";
import { SiteChrome } from "@/components/layout/site-chrome";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = rootMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col bg-white font-sans font-normal leading-relaxed text-ustawi-navy antialiased">
        <QueryProvider>
          <AuthProvider>
            <SiteChrome>{children}</SiteChrome>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
