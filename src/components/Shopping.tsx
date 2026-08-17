import { useMemo, useState } from "react";
import {
  useShopping,
  addShoppingItem,
  markShoppingBought,
  markShoppingPending,
  deleteShoppingItem,
  clearBoughtShopping,
  SHOPPING_CATEGORIES,
  type ShoppingCategory,
  type ShoppingItem,
} from "@/lib/store";
import { SOCIOS, fmt } from "@/lib/catalog";
import { Card, Input, EmptyState } from "@/components/ui";
import { Plus, Check, Trash2, RotateCcw, AlertTriangle, ShoppingCart } from "lucide-react";

type Tab = "pendientes" | "comprados";

const relative = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function Shopping() {
  const [tab, setTab] = useState<Tab>("pendientes");
  const items = useShopping();

  const pending = useMemo(
    () =>
      items
        .filter((i) => !i.bought)
        .sort((a, b) => Number(b.urgent ?? false) - Number(a.urgent ?? false) || b.createdAt - a.createdAt),
    [items],
  );
  const bought = useMemo(
    () => items.filter((i) => i.bought).sort((a, b) => (b.boughtAt ?? 0) - (a.boughtAt ?? 0)),
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border">
        <TabBtn active={tab === "pendientes"} onClick={() => setTab("pendientes")} label="Pendientes" count={pending.length} />
        <TabBtn active={tab === "comprados"} onClick={() => setTab("comprados")} label="Comprados" count={bought.length} />
      </div>

      {tab === "pendientes" ? (
        <>
          <AddForm />
          {pending.length === 0 ? (
            <EmptyState title="No falta nada" hint="Añade un artículo cuando veas que se está acabando algo." />
          ) : (
            <div className="space-y-2">
              {pending.map((i) => (
                <PendingRow key={i.id} item={i} />
              ))}
            </div>
          )}
        </>
      ) : bought.length === 0 ? (
        <EmptyState title="Todavía no se ha comprado nada" hint="Aquí verás lo ya comprado y quién lo compró." />
      ) : (
        <div className="space-y-2">
          {bought.map((i) => (
            <BoughtRow key={i.id} item={i} />
          ))}
          <button
            className="btn-ghost w-full text-sm text-muted-foreground"
            onClick={() => {
              if (confirm("¿Vaciar el histórico de comprados?")) clearBoughtShopping();
            }}
          >
            Vaciar histórico
          </button>
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground"
      }`}
    >
      {label}
      {count ? <span className="ml-1 text-xs opacity-70">({count})</span> : null}
    </button>
  );
}

function AddForm() {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>("Otros");
  const [urgent, setUrgent] = useState(false);
  const [addedBy, setAddedBy] = useState(SOCIOS[0] ?? "");
  const [note, setNote] = useState("");

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    addShoppingItem({
      name: n,
      qty: qty.trim() || undefined,
      category,
      urgent,
      note: note.trim() || undefined,
      addedBy,
    });
    setName("");
    setQty("");
    setNote("");
    setUrgent(false);
  };

  return (
    <Card className="p-3 space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="¿Qué falta? (vasos, papel…)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="flex-1"
        />
        <Input
          placeholder="Cant."
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-20"
        />
      </div>
      <div className="flex gap-2">
        <select
          className="input-base flex-1"
          value={category}
          onChange={(e) => setCategory(e.target.value as ShoppingCategory)}
        >
          {SHOPPING_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="input-base flex-1" value={addedBy} onChange={(e) => setAddedBy(e.target.value)}>
          {SOCIOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <Input placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          Urgente
        </label>
        <button
          type="button"
          className="btn-primary flex items-center gap-1 disabled:opacity-50"
          disabled={!name.trim()}
          onClick={submit}
        >
          <Plus className="w-4 h-4" /> Añadir
        </button>
      </div>
      {!name.trim() && (
        <p className="text-xs text-muted-foreground">Escribe primero qué falta para poder añadirlo.</p>
      )}
    </Card>
  );
}

function PendingRow({ item }: { item: ShoppingItem }) {
  const [open, setOpen] = useState(false);
  const [buyer, setBuyer] = useState(SOCIOS[0] ?? "");
  const [cost, setCost] = useState("");

  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <button
          className="mt-0.5 w-6 h-6 rounded-md border-2 border-socio text-socio grid place-items-center shrink-0"
          onClick={() => setOpen((v) => !v)}
          aria-label="Marcar como comprado"
        >
          {open ? <Check className="w-4 h-4" /> : null}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold flex items-center gap-1 flex-wrap">
            {item.urgent && <AlertTriangle className="w-4 h-4 text-destructive" />}
            {item.name}
            {item.qty && <span className="text-muted-foreground font-normal">· {item.qty}</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.category} · lo anotó {item.addedBy} el {relative(item.createdAt)}
          </p>
          {item.note && <p className="text-xs italic text-muted-foreground mt-0.5">“{item.note}”</p>}
        </div>
        <button className="btn-ghost !p-2 text-destructive" onClick={() => deleteShoppingItem(item.id)} aria-label="Eliminar">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">¿Quién lo ha comprado?</p>
          <div className="flex gap-2">
            <select className="input-base flex-1" value={buyer} onChange={(e) => setBuyer(e.target.value)}>
              {SOCIOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Input
              placeholder="Coste €"
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-24"
            />
          </div>
          <button
            className="btn-primary w-full flex items-center justify-center gap-1"
            onClick={() => {
              const c = parseFloat(cost.replace(",", "."));
              markShoppingBought(item.id, buyer, Number.isFinite(c) ? c : undefined);
            }}
          >
            <ShoppingCart className="w-4 h-4" /> Marcar comprado
          </button>
        </div>
      )}
    </Card>
  );
}

function BoughtRow({ item }: { item: ShoppingItem }) {
  return (
    <Card className="p-3 opacity-70">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-6 h-6 rounded-md bg-socio text-socio-foreground grid place-items-center shrink-0">
          <Check className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold line-through">
            {item.name}
            {item.qty && <span className="font-normal"> · {item.qty}</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            Comprado por {item.boughtBy} el {item.boughtAt ? relative(item.boughtAt) : "-"}
            {typeof item.cost === "number" ? ` · ${fmt(item.cost)}` : ""}
          </p>
        </div>
        <button
          className="btn-ghost !p-2 text-info"
          onClick={() => markShoppingPending(item.id)}
          aria-label="Volver a pendiente"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button className="btn-ghost !p-2 text-destructive" onClick={() => deleteShoppingItem(item.id)} aria-label="Eliminar">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
