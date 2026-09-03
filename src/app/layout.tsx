import type { Metadata } from "next";

import "@/app/globals.css";

import { SiteShell } from "@/components/layout/site-shell";
import { StoreProvider } from "@/store/store-provider";

export const metadata: Metadata = {
  title: {
    default: "Patilandia | Un mundo hecho para ellos",
    template: "%s | Patilandia"
  },
  description:
    "E-commerce premium para mascotas con camas, textiles, accesorios y una experiencia fantástica preparada para integrarse con Medusa.",
  openGraph: {
    title: "Patilandia",
    description: "Un mundo hecho para ellos.",
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
