import { CATEGORIES, fmt, type Product } from "@/lib/catalog";
import { useProducts, updateProduct, addProduct, deleteProduct } from "@/lib/store";
import { Card } from "@/components/ui";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import { useState } from "react";

export function Tariff() {
  const products = useProducts();
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {editing
            ? "Edita nombres y precios, o añade nuevas filas con el +"
            : "Precios vigentes"}
        </p>
        <button className={editing ? "btn-primary" : "btn-secondary"} onClick={() => setEditing((v) => !v)}>
          {editing ? (
            <>
              <Check className="w-4 h-4" /> Hecho
            </>
          ) : (
            <>
              <Pencil className="w-4 h-4" /> Editar precios
            </>
          )}
        </button>
      </div>

      {CATEGORIES.map((cat) => {
        const items = products.filter((p) => p.category === cat);
        return (
          <Card key={cat} className="overflow-hidden">
            <div className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center justify-between gap-2">
              <span>{cat}</span>
              {editing && (
                <button
                  onClick={() => addProduct(cat)}
                  className="rounded-full bg-white/25 hover:bg-white/40 p-1 transition-colors"
                  aria-label={`Añadir ítem en ${cat}`}
                  title="Añadir fila"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            {items.length === 0 && !editing ? null : (
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Ítem</th>
                    <th className="text-right px-2 py-2 font-medium">Socio</th>
                    <th className="text-right px-4 py-2 font-medium">No socio</th>
                    {editing && <th className="w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) =>
                    editing ? (
                      <EditRow key={p.id} p={p} />
                    ) : (
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
                    ),
                  )}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-xs text-muted-foreground">
                        Sin ítems. Usa el + para añadir.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function EditRow({ p }: { p: Product }) {
  return (
    <tr className="border-b border-border last:border-0 align-top">
      <td className="px-3 py-2 space-y-1">
        <input
          className="input-base !py-1 text-sm font-medium"
          value={p.name}
          onChange={(e) => updateProduct(p.id, { name: e.target.value })}
        />
        <input
          className="input-base !py-1 text-xs"
          placeholder="Detalle (opcional)"
          value={p.info ?? ""}
          onChange={(e) => updateProduct(p.id, { info: e.target.value })}
        />
      </td>
      <td className="px-1 py-2 w-24">
        <PriceInput value={p.socio} onChange={(v) => updateProduct(p.id, { socio: v })} />
      </td>
      <td className="px-2 py-2 w-24">
        <PriceInput value={p.noSocio} onChange={(v) => updateProduct(p.id, { noSocio: v })} />
      </td>
      <td className="px-1 py-2">
        <button
          className="btn-ghost !p-1.5 text-destructive"
          onClick={() => {
            if (confirm(`¿Borrar "${p.name}" de la tarifa?`)) deleteProduct(p.id);
          }}
          aria-label="Borrar ítem"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function PriceInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      step="0.5"
      min="0"
      inputMode="decimal"
      className="input-base !py-1 text-right tabular-nums"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}
