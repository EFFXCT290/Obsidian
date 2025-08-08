import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Font configuration for the application
 * Uses Geist Sans for body text and Geist Mono for code/monospace text
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Application metadata
 * 
 * Defines metadata for the application including title, description, and other SEO-related information.
 * This metadata is used by search engines and social media platforms.
 */
export const metadata: Metadata = {
  title: "Obsidian Tracker",
  description: "The OverPowered Torrent Tracker",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

/**
 * Root Layout Component
 * 
 * The main layout component that wraps all pages in the application.
 * Features:
 * - Global font configuration (Geist Sans and Mono)
 * - Dark theme by default (VS Code style)
 * - SEO metadata configuration
 * 
 * This layout provides:
 * - Consistent styling across all pages
 * - Dark theme for better developer experience
 * - Proper HTML structure and accessibility
 * 
 * @param children - React components to be rendered within the layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-text`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
