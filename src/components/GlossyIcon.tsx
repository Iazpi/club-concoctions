import type { ReactNode } from "react";

export function GlossyIcon({
  icon,
  className,
}: {
  icon: ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex glossy-icon ${className ?? ""}`}>
      {/* Capa base en terracota */}
      <span className="text-primary">{icon}</span>
      {/* Reflejo de luz en la parte superior */}
      <span
        className="absolute inset-0 inline-flex items-center justify-center pointer-events-none glossy-icon-highlight text-primary-foreground/80"
        aria-hidden="true"
      >
        {icon}
      </span>
      {/* Brillo radial sutil */}
      <span
        className="absolute inset-0 pointer-events-none glossy-icon-shine"
        aria-hidden="true"
      />
    </span>
  );
}
