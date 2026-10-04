import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "丑团官方网站",
  description: "丑团官方网站，正在开发中，敬请期待。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
