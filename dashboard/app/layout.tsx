import type { Metadata } from "next";
import { Epilogue, Public_Sans, Space_Grotesk } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const fontBody = Epilogue({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
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
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className={`${fontBody.variable} ${fontHeadline.variable} ${fontLabel.variable} font-body antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
