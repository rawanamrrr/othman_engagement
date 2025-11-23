import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://othmanandrita.netlify.app"),
  title: "Welcome to Our Beginning",
  description: "Celebrating the start of our journey together",
  generator: "Digitiva",
  openGraph: {
    url: "https://othmanandrita.netlify.app",
    type: "website",
    title: "Welcome to Our Beginning",
    description: "Celebrating the start of our journey together",
    images: [
      {
        url: "https://othmanandrita.netlify.app/invitation-design-arabic.jpg",
        width: 1200,
        height: 630,
        alt: "Our Engagement Invitation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Welcome to Our Beginning",
    description: "Celebrating the start of our journey together",
    images: ["https://othmanandrita.netlify.app/invitation-design-arabic.jpg"],
  },
  icons: {
    icon: "/invitation-design-arabic.jpg",
    apple: "/invitation-design-arabic.jpg",
  },
};
