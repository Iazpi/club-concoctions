import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { getProduct, SOCIOS, type Category } from "@/lib/catalog";
import { Card } from "@/components/ui";
import { Trophy } from "lucide-react";

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

const MEDAL_COLORS = [
  "text-yellow-500", // gold
  "text-gray-400", // silver
  "text-amber-700", // bronze
];

export function MvpMonth() {
  const events = useStore((s) => s.events);

  const months = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.consumptions.forEach((c) => set.add(monthKey(c.ts))));
    // always include current month
    set.add(monthKey(Date.now()));
    return Array.from(set).sort().reverse();
  }, [events]);

  const [month, setMonth] = useState<string | null>(months[0] ?? null);
  const activeMonth = month && months.includes(month) ? month : months[0] ?? null;

  const ranking = useMemo(() => {
    const totals = new Map<string, number>();
    SOCIOS.forEach((s) => totals.set(s, 0));

    for (const e of events) {
      // Map attendeeId -> name (only if socio and matches known SOCIOS)
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
        totals.set(name, (totals.get(name) ?? 0) + c.qty);
      }
    }

    return Array.from(totals.entries())
      .map(([name, qty]) => ({ name, qty }))
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
          (cerveza/sidra, vino, vermut, combinados y cava/champagne).
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
              const medal = i < 3 ? MEDAL_COLORS[i] : null;
              return (
                <li
                  key={r.name}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                    i === 0
                      ? "bg-yellow-500/15 border border-yellow-500/40"
                      : i === 1
                        ? "bg-gray-400/15 border border-gray-400/40"
                        : i === 2
                          ? "bg-amber-700/15 border border-amber-700/40"
                          : "bg-muted"
                  }`}
                >
                  <div className="w-8 text-center font-bold text-lg tabular-nums">
                    {medal ? (
                      <Trophy className={`w-6 h-6 mx-auto ${medal}`} fill="currentColor" />
                    ) : (
                      <span className="text-muted-foreground">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 font-semibold">{r.name}</div>
                  <div className="tabular-nums">
                    <span className="font-bold text-lg">{r.qty}</span>
                    <span className="text-xs text-muted-foreground ml-1">uds</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}
    </div>
  );
}
