import type { Metadata } from "next";
import { Epilogue, Public_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const bodyFont = Epilogue({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const fontHeadline = Public_Sans({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
});

const fontLabel = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-label",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Theft Guard AI — Dashboard",
  description: "Live surveillance and alerts for Theft Guard AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${fontHeadline.variable} ${fontLabel.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
