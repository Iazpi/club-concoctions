import { useMemo, useState } from "react";
import { PRODUCTS, CATEGORIES, price, fmt, type Product } from "@/lib/catalog";
import type { Attendee, Event } from "@/lib/store";
import { addConsumption } from "@/lib/store";
import { Card, Chip } from "@/components/ui";
import { X } from "lucide-react";

export function AddConsumptionSheet({
  event,
  attendee,
  onClose,
}: {
  event: Event;
  attendee: Attendee;
  onClose: () => void;
}) {
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const base = q
      ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
      : PRODUCTS.filter((p) => p.category === cat);
    return base;
  }, [cat, q]);

  const add = (p: Product) => {
    addConsumption(event.id, attendee.id, p.id, price(p, attendee.socio), 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <Card className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-b-none sm:rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Añadir consumición</h2>
            <p className="text-sm text-muted-foreground">
              {attendee.name} · <Chip tone={attendee.socio ? "socio" : "accent"}>{attendee.socio ? "Socio" : "No socio"}</Chip>
            </p>
          </div>
          <button className="btn-ghost !p-2" onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-border">
          <input
            className="input-base"
            placeholder="Buscar producto…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {!q && (
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`chip ${
                    c === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => add(p)}
              className="text-left rounded-lg border border-border bg-card hover:bg-muted transition-colors p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                {p.info && <div className="text-xs text-muted-foreground truncate">{p.info}</div>}
              </div>
              <div className="font-semibold text-primary shrink-0">{fmt(price(p, attendee.socio))}</div>
            </button>
          ))}
          {list.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-8">
              Sin resultados.
            </p>
          )}
        </div>

        <div className="p-3 border-t border-border">
          <button className="btn-primary w-full" onClick={onClose}>
            Hecho
          </button>
        </div>
      </Card>
    </div>
  );
}
