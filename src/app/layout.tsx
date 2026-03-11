import type { Metadata } from "next";
import { Oswald, Inter, Caveat } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// TODO: Pas metadata aan naar jouw organisatie en domein
export const metadata: Metadata = {
  metadataBase: new URL("https://jouwdomein.nl"),
  title: "Donatieactie | Uw Organisatie",
  description:
    "Steun onze donatieactie! Doneer eenvoudig via Tikkie en help ons het doel te bereiken.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Steun onze donatieactie!",
    description:
      "Help ons het doel te bereiken. Doneer eenvoudig en veilig via Tikkie!",
    type: "website",
    locale: "nl_NL",
    siteName: "Donatieactie",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 2048,
        height: 1152,
        alt: "Donatieactie",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Steun onze donatieactie!",
    description:
      "Help ons het doel te bereiken. Doneer eenvoudig en veilig via Tikkie!",
    images: ["/images/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${oswald.variable} ${inter.variable} ${caveat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
