import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { getProduct, SOCIOS, type Category } from "@/lib/catalog";
import { Card } from "@/components/ui";
import { ChevronDown } from "lucide-react";

const ALCOHOL_CATS: Category[] = [
  "CERVEZA / SIDRA",
  "VINO",
  "VERMUT / APERITIVO",
  "COMBINADOS",
  "CAVA / CHAMPAGNE",
];

function monthKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(k: string) {
  const [y, m] = k.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

const TROPHIES = ["🏆", "🥈", "🥉"];

export function MvpMonth() {
  const events = useStore((s) => s.events);

  const months = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.consumptions.forEach((c) => set.add(monthKey(c.ts))));
    set.add(monthKey(Date.now()));
    return Array.from(set).sort().reverse();
  }, [events]);

  const [month, setMonth] = useState<string | null>(months[0] ?? null);
  const activeMonth = month && months.includes(month) ? month : months[0] ?? null;
  const [expanded, setExpanded] = useState<string | null>(null);

  const ranking = useMemo(() => {
    const totals = new Map<string, { qty: number; byProduct: Map<string, number> }>();
    SOCIOS.forEach((s) => totals.set(s, { qty: 0, byProduct: new Map() }));

    for (const e of events) {
      const attMap = new Map<string, string>();
      for (const a of e.attendees) {
        if (a.socio && SOCIOS.includes(a.name)) attMap.set(a.id, a.name);
      }
      for (const c of e.consumptions) {
        if (monthKey(c.ts) !== activeMonth) continue;
        const name = attMap.get(c.attendeeId);
        if (!name) continue;
        const p = getProduct(c.productId);
        if (!p || !ALCOHOL_CATS.includes(p.category)) continue;
        const entry = totals.get(name)!;
        entry.qty += c.qty;
        entry.byProduct.set(c.productId, (entry.byProduct.get(c.productId) ?? 0) + c.qty);
      }
    }

    return Array.from(totals.entries())
      .map(([name, v]) => ({ name, qty: v.qty, byProduct: v.byProduct }))
      .sort((a, b) => b.qty - a.qty);
  }, [events, activeMonth]);

  const anyConsumption = ranking.some((r) => r.qty > 0);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <label className="block text-sm font-medium mb-2">Mes</label>
        <select
          className="input-base"
          value={activeMonth ?? ""}
          onChange={(e) => setMonth(e.target.value)}
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        <p className="mt-3 text-xs text-muted-foreground">
          Clasificación de socios por número de consumiciones alcohólicas
          (cerveza/sidra, vino, vermut, combinados y cava/champagne). Pincha en un socio para ver el detalle.
        </p>
      </Card>

      {!anyConsumption ? (
        <Card className="p-8 text-center text-muted-foreground">
          Todavía no hay consumiciones alcohólicas de socios este mes.
        </Card>
      ) : (
        <Card className="p-4">
          <ol className="space-y-2">
            {ranking.map((r, i) => {
              const isOpen = expanded === r.name;
              const bg =
                i === 0
                  ? "bg-yellow-500/15 border border-yellow-500/40"
                  : i === 1
                    ? "bg-gray-400/15 border border-gray-400/40"
                    : i === 2
                      ? "bg-amber-700/15 border border-amber-700/40"
                      : "bg-muted border border-transparent";
              const items = Array.from(r.byProduct.entries())
                .map(([id, qty]) => ({ id, qty, name: getProduct(id)?.name ?? id }))
                .sort((a, b) => b.qty - a.qty);
              return (
                <li key={r.name} className={`rounded-lg ${bg} overflow-hidden`}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : r.name)}
                    disabled={r.qty === 0}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left disabled:cursor-default"
                  >
                    <div className="w-9 text-center tabular-nums">
                      {i < 3 ? (
                        <span className="text-2xl leading-none" aria-label={`Puesto ${i + 1}`}>
                          {TROPHIES[i]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 font-semibold">{r.name}</div>
                    <div className="tabular-nums">
                      <span className="font-bold text-lg">{r.qty}</span>
                      <span className="text-xs text-muted-foreground ml-1">uds</span>
                    </div>
                    {r.qty > 0 && (
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>
                  {isOpen && items.length > 0 && (
                    <div className="px-3 pb-3 pt-1">
                      <ul className="rounded-md bg-background/60 divide-y divide-border">
                        {items.map((it) => (
                          <li key={it.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                            <span className="truncate">{it.name}</span>
                            <span className="tabular-nums font-semibold">{it.qty}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </Card>
      )}
    </div>
  );
}
