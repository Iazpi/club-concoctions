import { useState } from "react";
import type { Event, Attendee } from "@/lib/store";
import {
  addAttendee,
  removeAttendee,
  updateAttendee,
  updateConsumptionQty,
  setSplitCleaning,
  setEventClosed,
  deleteEvent,
} from "@/lib/store";
import { getProduct, fmt, CLEANING_COST, SOCIOS } from "@/lib/catalog";
import { Card, Chip } from "@/components/ui";
import { AddConsumptionSheet } from "./AddConsumptionSheet";
import { Plus, Minus, Trash2, UserPlus, Users } from "lucide-react";

export function EventView({ event }: { event: Event }) {
  const [newName, setNewName] = useState("");
  const [sheetAtt, setSheetAtt] = useState<Attendee | null>(null);

  const totals = event.attendees.map((a) => {
    const items = event.consumptions.filter((c) => c.attendeeId === a.id);
    const subtotal = items.reduce((s, c) => s + c.unitPrice * c.qty, 0);
    return { a, items, subtotal };
  });

  const cleaningPer =
    event.splitCleaning && event.attendees.length > 0
      ? CLEANING_COST / event.attendees.length
      : 0;

  const grandTotal = totals.reduce((s, t) => s + t.subtotal, 0) + (event.splitCleaning ? CLEANING_COST : 0);

  const usedSocios = new Set(
    event.attendees.filter((a) => a.socio).map((a) => a.name),
  );
  const availableSocios = SOCIOS.filter((n) => !usedSocios.has(n));

  const addSocio = (name: string) => {
    if (!name) return;
    addAttendee(event.id, name, true);
  };

  const addGuest = () => {
    const n = newName.trim();
    if (!n) return;
    addAttendee(event.id, n, false);
    setNewName("");
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">{event.name}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(event.date).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{event.attendees.length} asistentes</span>
            <span className="mx-1 text-muted-foreground">·</span>
            <span className="font-semibold text-primary">{fmt(grandTotal)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={event.splitCleaning}
              onChange={(e) => setSplitCleaning(event.id, e.target.checked)}
              className="w-4 h-4 accent-[color:var(--primary)]"
            />
            Repartir limpieza ({fmt(CLEANING_COST)})
            {cleaningPer > 0 && (
              <span className="text-muted-foreground">→ {fmt(cleaningPer)} / persona</span>
            )}
          </label>
          <div className="ml-auto flex gap-2">
            <button
              className="btn-secondary"
              onClick={() => setEventClosed(event.id, !event.closed)}
            >
              {event.closed ? "Reabrir evento" : "Cerrar evento"}
            </button>
            <button
              className="btn-ghost text-destructive"
              onClick={() => {
                if (confirm(`¿Borrar el evento "${event.name}"?`)) deleteEvent(event.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {!event.closed && (
        <Card className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Añadir socio
            </h3>
            {availableSocios.length > 0 ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  className="input-base flex-1"
                  value=""
                  onChange={(e) => {
                    addSocio(e.target.value);
                    e.currentTarget.value = "";
                  }}
                >
                  <option value="" disabled>
                    Selecciona un socio…
                  </option>
                  {availableSocios.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todos los socios ya están añadidos.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Añadir no socio
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="input-base flex-1"
                placeholder="Nombre"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGuest()}
              />
              <button className="btn-primary" onClick={addGuest}>
                <UserPlus className="w-4 h-4" /> Añadir
              </button>
            </div>
          </div>
        </Card>
      )}

      {totals.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          Todavía no hay asistentes. Añade el primero para empezar a apuntar consumiciones.
        </Card>
      )}

      <div className="grid gap-3">
        {totals.map(({ a, items, subtotal }) => {
          const total = subtotal + cleaningPer;
          return (
            <Card key={a.id} className="p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">{a.name}</span>
                  <button
                    onClick={() => updateAttendee(event.id, a.id, { socio: !a.socio })}
                    className="hover:opacity-80"
                    title="Cambiar tipo"
                  >
                    <Chip tone={a.socio ? "socio" : "accent"}>{a.socio ? "Socio" : "No socio"}</Chip>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">{fmt(total)}</span>
                  {!event.closed && (
                    <button
                      className="btn-ghost !p-2 text-destructive"
                      onClick={() => {
                        if (confirm(`¿Quitar a ${a.name}?`)) removeAttendee(event.id, a.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {items.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {items.map((c) => {
                    const p = getProduct(c.productId);
                    return (
                      <li key={c.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">{p?.name ?? c.productId}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {!event.closed && (
                            <button
                              className="btn-ghost !p-1"
                              onClick={() => updateConsumptionQty(event.id, c.id, c.qty - 1)}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="w-6 text-center font-medium">{c.qty}</span>
                          {!event.closed && (
                            <button
                              className="btn-ghost !p-1"
                              onClick={() => updateConsumptionQty(event.id, c.id, c.qty + 1)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="w-16 text-right tabular-nums font-medium">
                            {fmt(c.unitPrice * c.qty)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {event.splitCleaning && (
                <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground flex justify-between">
                  <span>Parte limpieza</span>
                  <span>{fmt(cleaningPer)}</span>
                </div>
              )}

              {!event.closed && (
                <button
                  className="mt-3 btn-secondary w-full"
                  onClick={() => setSheetAtt(a)}
                >
                  <Plus className="w-4 h-4" /> Añadir consumición
                </button>
              )}
            </Card>
          );
        })}
      </div>

      {sheetAtt && (
        <AddConsumptionSheet
          event={event}
          attendee={sheetAtt}
          onClose={() => setSheetAtt(null)}
        />
      )}
    </div>
  );
}
