import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/lib/session-context";
import { themes } from "@/lib/themes";

// Apply the saved theme before first paint to avoid a flash of the default
// (Ground) palette. The var map is serialized from themes.ts (single source of
// truth); the browser script is a dependency-free IIFE. No stored theme or an
// unknown id → do nothing, since :root already equals Ground.
const themeVarsById = Object.fromEntries(themes.map((t) => [t.id, t.vars]));
const themeInitScript = `(function(){try{var id=localStorage.getItem('rehearse_theme');if(!id)return;var m=${JSON.stringify(
  themeVarsById,
)};var v=m[id];if(!v)return;var r=document.documentElement;for(var k in v)r.style.setProperty(k,v[k]);}catch(e){}})();`;

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-heading",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Rehearse — Interview prep that tells you the truth",
  description: "AI-powered interview coach for product designers pursuing AI-native roles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", cormorant.variable, dmSans.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
