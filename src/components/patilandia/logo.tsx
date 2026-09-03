import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center", className)}
    >
      <Image
        src="/images/patilandia/logo-patilandia.png"
        alt="Patilandia - Un mundo hecho para ellos"
        width={220}
        height={80}
        priority
        className="h-auto w-[140px]"
      />
    </Link>
  );
}