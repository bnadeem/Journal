import type { Metadata } from "next";
import { Inter, Kalam } from "next/font/google";
import AuthGuard from "@/components/auth/AuthGuard";
import Header from "@/components/layout/Header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Personal Journal",
  description: "Your thoughts, reflections, and journey through life",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${kalam.variable} antialiased font-sans`}
      >
        <AuthGuard>
          <Header />
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
