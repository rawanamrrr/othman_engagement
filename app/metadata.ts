import { Metadata } from "next";

const SITE_URL = "https://othman-rita.digitivaa.com";
const TITLE = "Othman & Rita's Engagement";
const DESCRIPTION = "Celebrating the start of our journey together";
const IMAGE_URL = `${SITE_URL}/invitation-design-arabic.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  generator: "Next.js",
  
  // Open Graph / Facebook
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Othman & Rita's Engagement",
    images: [
      {
        url: IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Othman & Rita's Engagement Invitation",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    site: "@yourtwitterhandle", // Replace with your Twitter handle if you have one
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE_URL],
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  // Additional metadata
  keywords: ["engagement", "wedding", "celebration", "Othman", "Rita"],
  authors: [{ name: "Othman & Rita" }],
  themeColor: "#ffffff",
  manifest: "/site.webmanifest",
};
