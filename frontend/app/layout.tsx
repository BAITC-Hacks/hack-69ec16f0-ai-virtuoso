import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AKIM OS",
  description: "Аким на 5 часов — AI-симулятор управления Астаной"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
