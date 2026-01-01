import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Samruddhi - Business Management Platform",
  description: "Complete business management solution for Indian businesses with GST, invoicing, inventory, and more. Drive prosperity with Samruddhi.",
  icons: {
    icon: "/samruddhi-logo-icon.svg",
    shortcut: "/samruddhi-logo-icon.svg",
    apple: "/samruddhi-logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
