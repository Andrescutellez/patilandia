import type { Metadata } from "next";

import "@/app/globals.css";

import { SiteShell } from "@/components/layout/site-shell";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site-config";
import { StoreProvider } from "@/store/store-provider";

const DEFAULT_DESCRIPTION =
  "Camitas, juguetes, accesorios y alimento premium para perros y gatos, con una estética fantástica propia. Envíos a toda Colombia.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "camas para perros",
    "camas para gatos",
    "accesorios para mascotas",
    "juguetes para mascotas",
    "tienda de mascotas Colombia",
    "Patilandia"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: SITE_NAME,
    url: "/",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "/images/patilandia/hero-fantasy.png", width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    images: ["/images/patilandia/hero-fantasy.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <StoreProvider>
          <SiteShell>{children}</SiteShell>
        </StoreProvider>
      </body>
    </html>
  );
}
