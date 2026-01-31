import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const displayFont = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-display'
});

const bodyFont = Inter({ 
  subsets: ["latin"],
  variable: '--font-body'
});

const monoFont = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: "OmniCampus - University Voice Platform",
  description: "A verified university-only space to speak up—anonymous when you need it, supported when it matters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
