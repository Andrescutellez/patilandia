import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Páginas transaccionales/personales — sin valor de indexación, y el carrito/checkout
        // dependen de un token de sesión por usuario, así que un rastreador nunca vería nada útil.
        disallow: ["/carrito", "/checkout", "/cuenta"]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
