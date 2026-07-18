import type { Metadata } from "next"
import { siteConfig } from "./site"

type MetadataProps = {
  title?: string
  description?: string
}

export const createMetadata = ({
  title,
  description,
}: MetadataProps = {}): Metadata => ({
  title: title ? `${title} | ${siteConfig.name}` : siteConfig.name,

  description: description ?? siteConfig.description,

  applicationName: siteConfig.name,

  metadataBase: new URL(siteConfig.url),

  authors: [
    {
      name: siteConfig.author,
    },
  ],

  creator: siteConfig.author,

  keywords: ["AI", "Chat", "LLM", "OpenAI", "Claude", "Gemini", "NeuruChat"],

  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: title ?? siteConfig.name,
    description: description ?? siteConfig.description,
  },

  twitter: {
    card: "summary_large_image",
    title: title ?? siteConfig.name,
    description: description ?? siteConfig.description,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
})
