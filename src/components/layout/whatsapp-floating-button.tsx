"use client";

import { WhatsAppIcon } from "@/components/ui/icons";
import { buildGenericMessage, buildWhatsAppLink, type WhatsappSettings } from "@/lib/whatsapp";
import { useStore } from "@/store/store-provider";

/**
 * Rendered once, globally, by SiteShell — only when patilandia-whatsapp's admin settings say
 * `enabled` and have a real phone number (see getWhatsappSettings()'s "null means don't render"
 * convention). Reads `whatsappMessage` from the store so a specific page (a product, for example)
 * can make this button say something more relevant than the generic default without SiteShell
 * needing to know anything about that page.
 */
export function WhatsAppFloatingButton({ settings }: { settings: WhatsappSettings }) {
  const { whatsappMessage } = useStore();
  const href = buildWhatsAppLink(settings.phoneNumber, whatsappMessage ?? buildGenericMessage(settings.defaultMessage));

  return (
    <a
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-violet)] text-white shadow-[0_16px_40px_rgba(94,76,214,0.35)] transition hover:bg-[var(--brand-violet-deep)] md:bottom-6 md:right-6"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
