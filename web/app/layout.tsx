import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactGrab } from "./react-grab";
// import { Nudge } from "./__nudge";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://prompt-later.pages.dev",
  ),
  title: "Prompt Later",
  description: "Schedule Codex messages to be sent later",
  openGraph: {
    title: "Prompt Later",
    description: "Schedule Codex messages to be sent later",
    siteName: "Prompt Later",
    url: "https://prompt-later.pages.dev",
    images: [
      {
        url: "/prompt-later-icon.svg",
        width: 1024,
        height: 1024,
      },
    ],
  },
  icons: {
    icon: "/prompt-later-icon.svg",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Later",
    description: "Schedule Codex messages to be sent later",
    images: ["/prompt-later-icon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          themes={["light", "dark"]}
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
        <ReactGrab />
        {/* <Nudge /> */}
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}
