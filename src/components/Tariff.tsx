import { PRODUCTS, CATEGORIES, fmt } from "@/lib/catalog";
import { Card } from "@/components/ui";

export function Tariff() {
  return (
    <div className="space-y-4">
      {CATEGORIES.map((cat) => {
        const items = PRODUCTS.filter((p) => p.category === cat);
        if (items.length === 0) return null;
        return (
          <Card key={cat} className="overflow-hidden">
            <div className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
              {cat}
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Ítem</th>
                  <th className="text-right px-2 py-2 font-medium">Socio</th>
                  <th className="text-right px-4 py-2 font-medium">No socio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      <div className="font-medium">{p.name}</div>
                      {p.info && <div className="text-xs text-muted-foreground">{p.info}</div>}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-socio font-semibold">
                      {fmt(p.socio)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">
                      {fmt(p.noSocio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );
      })}
    </div>
  );
}
