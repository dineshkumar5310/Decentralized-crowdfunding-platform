import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import Navigation from "./navigation";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "POL Crowdfunding - Decentralized Funding Platform",
  description: "Launch and support innovative projects with blockchain-powered crowdfunding on Polygon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <Navigation />
        <main className="relative">
          {children}
        </main>
      </body>
    </html>
  );
}
