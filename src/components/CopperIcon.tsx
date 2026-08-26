import type { ReactNode } from "react";

/**
 * Icono con efecto "tubo de cobre" en relieve, como la referencia:
 * trazo grueso redondeado, sombra oscura inferior, cuerpo cobre y
 * brillo claro en la parte superior. Sin recuadros ni fondos.
 */
export function CopperIcon({
  icon,
  className,
}: {
  icon: ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex copper-icon ${className ?? ""}`}>
      {/* Sombra oscura inferior (relieve) */}
      <span
        className="absolute inset-0 inline-flex items-center justify-center pointer-events-none copper-layer-shadow"
        aria-hidden="true"
      >
        {icon}
      </span>
      {/* Cuerpo cobre principal */}
      <span className="relative inline-flex items-center justify-center copper-layer-body">
        {icon}
      </span>
      {/* Brillo superior */}
      <span
        className="absolute inset-0 inline-flex items-center justify-center pointer-events-none copper-layer-highlight"
        aria-hidden="true"
      >
        {icon}
      </span>
    </span>
  );
}
