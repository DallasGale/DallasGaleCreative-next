import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dallas Gale Creative | Web Developer & UI Designer",
  description:
    "Experienced frontend developer and digital designer based in Melbourne, Australia. Over a decade of expertise in web development for agencies and startups across Australia, LA, and NYC. View my portfolio and contact me for custom web solutions.",
  keywords: [
    "Frontend development",
    "React developer",
    "web design",
    "web developer",
    "responsive web design",
    "Melbourne web developer",
    "Yarra Valley web design",
    "Australian web design",
    "freelance web developer",
    "freelance web designer",
    "custom website development",
    "portfolio sites for creatives",
    "JAMstack websites",
  ],
  authors: [{ name: "Dallas Gale" }],
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/android-icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-icon-180x180.png", sizes: "180x180" }],
  },
  manifest: "/favicon/manifest.json",
};

const GA_ID = "G-0Q7YLR9V6J";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body>
        {children}

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
