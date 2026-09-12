import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NGEBOLANG — Peta Sosial Mobilitas",
  description: "Peta sosial mobilitas warga Yogyakarta",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css"
        />
      </head>
      <body className="h-full">
        {children}
        {/* MapLibre GL JS di-load sebagai script global (bukan npm import) --
            import npm memicu MapLibre menghitung URL Web Worker-nya sendiri
            lewat import.meta.url, yang dibungkus Turbopack/webpack menjadi URL
            non-http sehingga worker gagal dimuat secara diam-diam (map.on('load')
            tidak pernah terpanggil, tanpa error). Lewat CDN, browser me-load file
            ini apa adanya sehingga import.meta.url tetap URL http(s) yang valid. */}
        <Script
          src="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
