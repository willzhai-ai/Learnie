import type { Metadata } from "next";
import { Inter, Comic_Neue } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const comicNeue = Comic_Neue({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-comic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "英语冒险岛 - 趣味口语学习游戏",
  description: "通过游戏化方式激发孩子学习英语口语的兴趣！完成任务获得积分，兑换真实奖励。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} ${comicNeue.variable} font-sans min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
