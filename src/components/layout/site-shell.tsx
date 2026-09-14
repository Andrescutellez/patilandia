import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/layout/whatsapp-floating-button";
import { getWhatsappSettings } from "@/lib/whatsapp";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  // null when Vendure is unreachable or the admin disabled it — see getWhatsappSettings()'s
  // "null means don't render" convention. Never blocks the rest of the page: this fetch is
  // independent of everything else SiteShell renders.
  const whatsappSettings = await getWhatsappSettings();

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <MobileBottomNav />
      {whatsappSettings ? <WhatsAppFloatingButton settings={whatsappSettings} /> : null}
    </>
  );
}
