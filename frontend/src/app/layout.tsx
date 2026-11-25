import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: {
    default: "유스링크 — 근거로만 답하는 청년정책 상담",
    template: "%s · 유스링크",
  },
  description:
    "검색된 정책 공고를 근거로만 답하는 청년정책 상담 서비스. 거주 지역 조건을 먼저 걸러 내게 해당되는 정책만 안내합니다.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c0c" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
