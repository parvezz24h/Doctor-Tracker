import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { InlineScript } from "@/components/inline-script";
import { Providers } from "@/components/providers";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Doctor Tracker", template: "%s · Doctor Tracker" },
  description: "Manage doctors, their patients, and admission analytics in one secure portal.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
      // next-themes sets the theme class before hydration.
      suppressHydrationWarning
    >
      {/* Browser extensions add attributes to <body> before hydration. */}
      <body className="min-h-full" suppressHydrationWarning>
        {/* Restore the collapsed sidebar before the first paint, so it never jumps. */}
        <InlineScript html={`try{var s=localStorage.getItem("sidebar");if(s==="collapsed"||s==="expanded")document.documentElement.dataset.sidebar=s}catch(e){}`} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
