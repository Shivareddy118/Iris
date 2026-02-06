import type { Metadata, Viewport } from "next"
import { Roboto_Mono } from "next/font/google"
import "./globals.css"

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
})

export const metadata: Metadata = {
  title: "IRIS - Intelligent Response Interface System",
  description: "Your AI-powered personal assistant with file management, music playback, and voice control.",
}

export const viewport: Viewport = {
  themeColor: "#00bcd4",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${robotoMono.variable} font-mono antialiased`}>
        {children}
      </body>
    </html>
  )
}
