import type { Metadata } from "next";
import { Inter, Space_Grotesk, Outfit, Playfair_Display, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SyncSlides – AI Presentations, Forged",
  description:
    "Create stunning, professional presentations in seconds with AI. Choose from premium themes, customize every slide, and export as PowerPoint.",
  keywords: ["AI", "presentations", "PowerPoint", "PPTX", "slide deck", "SyncSlides"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${outfit.variable} ${playfair.variable} ${poppins.variable} font-sans antialiased`}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(23, 23, 23, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </body>
    </html>
  );
}
