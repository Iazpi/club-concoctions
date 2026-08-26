import { cloneElement, type ReactElement } from "react";

export function GlossyIcon({
  icon,
  className,
}: {
  icon: ReactElement;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex glossy-icon ${className ?? ""}`}>
      {/* Capa base en terracota */}
      {cloneElement(icon, { className: "text-primary" })}
      {/* Reflejo de luz en la parte superior */}
      <span
        className="absolute inset-0 pointer-events-none glossy-icon-highlight"
        aria-hidden="true"
      >
        {cloneElement(icon, { className: "text-primary-foreground/80" })}
      </span>
      {/* Brillo radial sutil */}
      <span
        className="absolute inset-0 pointer-events-none glossy-icon-shine"
        aria-hidden="true"
      />
    </span>
  );
}
