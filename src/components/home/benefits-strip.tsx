import { benefits } from "@/data/mock-store";
import { HeartIcon, ShieldIcon, SparklesIcon, TruckIcon } from "@/components/ui/icons";

const iconMap = {
  heart: HeartIcon,
  shield: ShieldIcon,
  sparkles: SparklesIcon,
  truck: TruckIcon
};

export function BenefitsStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-4 rounded-[2rem] border border-white/60 bg-white/75 p-5 shadow-[0_20px_50px_rgba(31,36,84,0.08)] backdrop-blur md:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit) => {
          const Icon = iconMap[benefit.icon as keyof typeof iconMap];

          return (
            <div key={benefit.title} className="flex gap-4 rounded-[1.5rem] px-2 py-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-violet-deep)]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <p className="font-bold text-[var(--ink)]">{benefit.title}</p>
                <p className="text-sm leading-6 text-[var(--muted)]">{benefit.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
