import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Load the font from Google (no local files needed)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Axiom Pulse",
  description: "Token Discovery Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}