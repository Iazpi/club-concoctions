import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PRODUCTS, CATEGORIES, fmt, getProduct, type Category } from "@/lib/catalog";
import { Card } from "@/components/ui";

function monthKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(k: string) {
  const [y, m] = k.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

export function History() {
  const events = useStore((s) => s.events);

  const months = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      e.consumptions.forEach((c) => set.add(monthKey(c.ts)));
      if (e.consumptions.length === 0) set.add(monthKey(new Date(e.date).getTime()));
    });
    const arr = Array.from(set).sort().reverse();
    return arr;
  }, [events]);

  const [month, setMonth] = useState<string | null>(months[0] ?? null);
  const activeMonth = month && months.includes(month) ? month : months[0] ?? null;

  const stats = useMemo(() => {
    if (!activeMonth) return null;
    const byProduct = new Map<string, { qty: number; revenue: number }>();
    let totalRevenue = 0;
    let totalQty = 0;
    for (const e of events) {
      for (const c of e.consumptions) {
        if (monthKey(c.ts) !== activeMonth) continue;
        const cur = byProduct.get(c.productId) ?? { qty: 0, revenue: 0 };
        cur.qty += c.qty;
        cur.revenue += c.qty * c.unitPrice;
        byProduct.set(c.productId, cur);
        totalQty += c.qty;
        totalRevenue += c.qty * c.unitPrice;
      }
    }
    const byCategory = new Map<Category, { qty: number; revenue: number; items: { id: string; qty: number; revenue: number }[] }>();
    CATEGORIES.forEach((c) => byCategory.set(c, { qty: 0, revenue: 0, items: [] }));
    byProduct.forEach((v, pid) => {
      const p = getProduct(pid);
      if (!p) return;
      const bucket = byCategory.get(p.category)!;
      bucket.qty += v.qty;
      bucket.revenue += v.revenue;
      bucket.items.push({ id: pid, qty: v.qty, revenue: v.revenue });
    });
    byCategory.forEach((v) => v.items.sort((a, b) => b.qty - a.qty));
    return { totalRevenue, totalQty, byCategory };
  }, [events, activeMonth]);

  if (months.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Todavía no hay consumiciones registradas.
      </Card>
    );
  }

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
        {stats && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Consumiciones</p>
              <p className="text-2xl font-bold">{stats.totalQty}</p>
            </div>
            <div className="rounded-lg bg-primary text-primary-foreground p-3">
              <p className="text-xs opacity-80">Ingresos</p>
              <p className="text-2xl font-bold">{fmt(stats.totalRevenue)}</p>
            </div>
          </div>
        )}
      </Card>

      {stats &&
        CATEGORIES.map((cat) => {
          const bucket = stats.byCategory.get(cat)!;
          if (bucket.qty === 0) return null;
          return (
            <Card key={cat} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{cat}</h3>
                <div className="text-sm text-muted-foreground">
                  {bucket.qty} uds · <span className="font-semibold text-primary">{fmt(bucket.revenue)}</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm">
                {bucket.items.map((it) => {
                  const p = getProduct(it.id);
                  return (
                    <li key={it.id} className="flex items-center justify-between">
                      <span className="truncate">{p?.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        <span className="font-semibold text-foreground">{it.qty}</span> · {fmt(it.revenue)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
    </div>
  );
}
