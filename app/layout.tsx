import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EssaySpace — UTS Essay",
  description: "Aplikasi ujian essay online untuk SMK",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
