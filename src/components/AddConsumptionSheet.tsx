import { useMemo, useState } from "react";
import { CATEGORIES, SHAREABLE_IDS, price, fmt, type Product } from "@/lib/catalog";
import type { Attendee, Event } from "@/lib/store";
import { addConsumption, useProducts } from "@/lib/store";

import { Card, Chip } from "@/components/ui";
import { Check, X } from "lucide-react";


export function AddConsumptionSheet({
  event,
  attendee,
  onClose,
}: {
  event: Event;
  attendee: Attendee;
  onClose: () => void;
}) {
  const products = useProducts();
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [q, setQ] = useState("");
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);

  const list = useMemo(() => {
    const base = q
      ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
      : products.filter((p) => p.category === cat);
    return base;
  }, [cat, q, products]);


  const flashPulse = (id: string) => {
    setPulseId(id);
    window.setTimeout(
      () => setPulseId((current) => (current === id ? null : current)),
      350,
    );
  };

  const add = (p: Product) => {
    if (SHAREABLE_IDS.has(p.id)) {
      setShareProduct(p);
      return;
    }
    addConsumption(event.id, attendee.id, p.id, price(p, attendee.socio), 1);
    flashPulse(p.id);
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
          {list.map((p) => {
            const active = pulseId === p.id;
            const shareable = SHAREABLE_IDS.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => add(p)}
                className={`text-left rounded-lg border p-3 flex items-center justify-between gap-3 transition-all duration-200 ${
                  active
                    ? "bg-primary/20 border-primary ring-2 ring-primary scale-[0.98]"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate flex items-center gap-1.5">
                    {p.name}
                  </div>
                  {p.info && <div className="text-xs text-muted-foreground truncate">{p.info}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {active && <Check className="w-4 h-4 text-primary" />}
                  <span className="font-semibold text-primary">{fmt(price(p, attendee.socio))}</span>
                </div>
              </button>
            );
          })}
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

      {shareProduct && (
        <ShareDialog
          event={event}
          defaultAttendee={attendee}
          product={shareProduct}
          onClose={() => setShareProduct(null)}
          onConfirm={(ids, totalPrice) => {
            const per = totalPrice / ids.length;
            const isSplit = ids.length > 1;
            ids.forEach((id) => {
              addConsumption(event.id, id, shareProduct.id, per, 1, isSplit);
            });
            flashPulse(shareProduct.id);
            setShareProduct(null);
          }}

        />
      )}
    </div>
  );
}

function ShareDialog({
  event,
  defaultAttendee,
  product,
  onClose,
  onConfirm,
}: {
  event: Event;
  defaultAttendee: Attendee;
  product: Product;
  onClose: () => void;
  onConfirm: (attendeeIds: string[], totalPrice: number) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set([defaultAttendee.id]),
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allIds = event.attendees.map((a) => a.id);
  const allSelected = selected.size === allIds.length;

  // Price basis depends on the buyer/attendee that adds the bottle.
  const total = defaultAttendee.socio ? product.socio : product.noSocio;
  const per = selected.size > 0 ? total / selected.size : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <Card className="w-full sm:max-w-md flex flex-col rounded-b-none sm:rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate">{product.name}</h3>
            <p className="text-xs text-muted-foreground">
              ¿Entre quién repartimos el coste?
            </p>
          </div>
          <button className="btn-ghost !p-2" onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{fmt(total)}</span>
          </span>
          <button
            className="chip bg-muted text-muted-foreground"
            onClick={() =>
              setSelected(allSelected ? new Set() : new Set(allIds))
            }
          >
            {allSelected ? "Ninguno" : "Todos"}
          </button>
        </div>

        <div className="overflow-y-auto max-h-[50vh] p-2">
          {event.attendees.map((a) => {
            const on = selected.has(a.id);
            return (
              <label
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  on ? "bg-primary/15" : "hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(a.id)}
                  className="w-4 h-4 accent-[color:var(--primary)]"
                />
                <span className="flex-1 font-medium">{a.name}</span>
                <Chip tone={a.socio ? "socio" : "accent"}>
                  {a.socio ? "Socio" : "No socio"}
                </Chip>
              </label>
            );
          })}
        </div>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selected.size} {selected.size === 1 ? "persona" : "personas"}
            </span>
            <span className="font-semibold text-primary">
              {fmt(per)} / persona
            </span>
          </div>
          <button
            className="btn-primary w-full disabled:opacity-50"
            disabled={selected.size === 0}
            onClick={() => onConfirm(Array.from(selected), total)}
          >
            Añadir
          </button>
        </div>
      </Card>
    </div>
  );
}
