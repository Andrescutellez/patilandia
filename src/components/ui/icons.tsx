import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

function Svg({
  className,
  children,
  viewBox = "0 0 24 24",
  fill = "none"
}: IconProps & {
  children: React.ReactNode;
  viewBox?: string;
  fill?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
      fill={fill}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M5 19a7 7 0 0 1 14 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <Svg className={className} fill="currentColor">
      <path d="M12 21c-.4 0-.7-.1-1-.4l-6.2-5.8A5.5 5.5 0 0 1 12 6.3a5.5 5.5 0 0 1 7.2 8.5L13 20.6c-.3.3-.6.4-1 .4Z" />
    </Svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
      <circle cx="17" cy="20" r="1.5" fill="currentColor" />
      <path
        d="M4 5h2l2 9h9l2-6H7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  );
}

export function PawIcon({ className }: IconProps) {
  return (
    <Svg className={className} fill="currentColor" viewBox="0 0 28 28">
      <path d="M8.6 11.7c1.4 0 2.5-1.6 2.5-3.6S10 4.5 8.6 4.5 6 6 6 8.1s1.1 3.6 2.6 3.6Zm10.8 0c1.4 0 2.6-1.6 2.6-3.6s-1.2-3.6-2.6-3.6-2.6 1.6-2.6 3.6 1.1 3.6 2.6 3.6Zm-5.4-1.9c1.6 0 2.8-1.8 2.8-4s-1.2-4-2.8-4-2.8 1.8-2.8 4 1.3 4 2.8 4Zm7.2 8.7c0-3.5-3.2-6.4-7.2-6.4s-7.2 2.9-7.2 6.4c0 2.1 1.2 4 3.1 5 1.1.6 2.4.8 3.7.8h.8c1.3 0 2.5-.2 3.6-.8 2-1 3.2-2.9 3.2-5Zm-14.4-6.8c1.4 0 2.6-1.6 2.6-3.6S8.2 4.5 6.8 4.5 4.2 6 4.2 8.1s1.2 3.6 2.6 3.6Z" />
    </Svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3l1.7 4.8L18.5 9l-4.8 1.2L12 15l-1.7-4.8L5.5 9l4.8-1.2L12 3Z" fill="currentColor" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" fill="currentColor" />
    </Svg>
  );
}

export function CrownIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M4 17 6.7 7.8 12 13l5.3-5.2L20 17M5 17h14v3H5z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M12 3 5 6v5c0 4.3 2.7 8.1 7 10 4.3-1.9 7-5.7 7-10V6l-7-3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="m9.5 12 1.7 1.8L15 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </Svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <Svg className={className} fill="currentColor">
      <path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L3 9.4l6.2-.9L12 2.8Z" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </Svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4 11 8-6 8 6v9h-5v-6H9v6H4z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
    </Svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="2" />
    </Svg>
  );
}

export function ShirtIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="m8 5 4-2 4 2 3 4-3 2v9H8v-9L5 9l3-4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  );
}

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case "bed":
      return (
        <Svg className={className}>
          <path d="M4 12h16v6H4zM6 12V9a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v3" stroke="currentColor" strokeWidth="2" />
        </Svg>
      );
    case "ball":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M7 7c2 2 8 8 10 10M15.5 5.5a8 8 0 0 1-8 8M8.5 18.5a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="2" />
        </Svg>
      );
    case "bowl":
      return (
        <Svg className={className}>
          <path d="M5 13h14c0 3.3-2.7 6-6 6h-2c-3.3 0-6-2.7-6-6Z" stroke="currentColor" strokeWidth="2" />
          <path d="M8 10a2 2 0 1 1 4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </Svg>
      );
    case "treat":
      return (
        <Svg className={className}>
          <path d="M10 5a2.5 2.5 0 0 1 4 0l4 6a4 4 0 0 1-3.3 6H9.3A4 4 0 0 1 6 11l4-6Z" stroke="currentColor" strokeWidth="2" />
          <path d="M10 9h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </Svg>
      );
    case "collar":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="m16.5 16.5 1.8 1.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </Svg>
      );
    case "brush":
      return (
        <Svg className={className}>
          <path d="M7 13 15 5l4 4-8 8H7z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
          <path d="M5 19h7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </Svg>
      );
    case "carrier":
      return (
        <Svg className={className}>
          <rect x="4" y="7" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M9 7a3 3 0 0 1 6 0M9 12h6M9 15h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </Svg>
      );
    default:
      return <ShirtIcon className={className} />;
  }
}
