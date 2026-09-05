import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center py-2", className)}
    >
      <Image
        src="/images/patilandia/logo-rectangular.png"
        alt="Patilandia - Un mundo hecho para ellos"
        width={1512}
        height={600}
        priority
        className="h-16 w-auto"
      />
    </Link>
  );
}