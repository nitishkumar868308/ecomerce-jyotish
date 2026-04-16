"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import "react-international-phone/style.css";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProgressBar } from "@/components/ui/loader/ProgressBar";
import { API_CONFIG } from "@/lib/api";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-[var(--bg-primary)] text-[var(--text-primary)]`}
      >
        <ThemeProvider>
          <QueryProvider>
            <GoogleOAuthProvider clientId={API_CONFIG.GOOGLE_CLIENT_ID}>
              <AuthProvider>
                <ProgressBar />
                {children}
                <Toaster
                  position="top-right"
                  reverseOrder={false}
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                      boxShadow: "var(--shadow-md)",
                    },
                  }}
                />
              </AuthProvider>
            </GoogleOAuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
