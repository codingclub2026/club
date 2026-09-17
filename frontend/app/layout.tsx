import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import BackendLoader from "@/components/BackendLoader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://codeved.vasudevai.in"),
  title: "CodeVed — Technical Fest 2026",
  description: "India's premier technical festival. Discover events, compete, and connect.",
  verification: {
    google: "MLrf7m9hjAG3Lxonag5zkqoY87BGiRbhR88f1W_2OiU",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <BackendLoader>{children}</BackendLoader>
        </body>
      </html>
    </ClerkProvider>
  );
}
