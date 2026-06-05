import type { Metadata } from "next";
import "./globals.css";
import AlertContainer from "@/components/AlertModal";

export const metadata: Metadata = {
  title: "PhotoGen — AI Event Photography",
  description: "Find your event photos instantly with AI-powered face recognition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <AlertContainer />
      </body>
    </html>
  );
}
