import { useMemo, useState } from "react";
import {
  useShopping,
  addShoppingItem,
  markShoppingBought,
  markShoppingPending,
  deleteShoppingItem,
  clearBoughtShopping,
  type ShoppingItem,
} from "@/lib/store";
import { SOCIOS } from "@/lib/catalog";
import { Card, Input, EmptyState } from "@/components/ui";
import { Plus, Check, Trash2, RotateCcw } from "lucide-react";

type Tab = "pendientes" | "comprados";

const relative = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function Shopping() {
  const [tab, setTab] = useState<Tab>("pendientes");
  const items = useShopping();

  const pending = useMemo(
    () => items.filter((i) => !i.bought).sort((a, b) => b.createdAt - a.createdAt),
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
          <h2 className="text-center text-xl font-bold tracking-wide">LISTA DE COMPRA</h2>
          <AddForm />
          {pending.length === 0 ? (
            <EmptyState title="No falta nada" hint="Añade lo que se esté acabando." />
          ) : (
            <div className="space-y-2">
              {pending.map((i) => (
                <PendingRow key={i.id} item={i} onBought={() => setTab("comprados")} />
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

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    addShoppingItem({
      name: n,
      category: "Otros",
      addedBy: "",
    });
    setName("");
  };

  return (
    <Card className="p-3">
      <div className="flex gap-2">
        <Input
          placeholder="¿Qué falta?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="flex-1"
        />
        <button
          type="button"
          className="btn-primary flex items-center gap-1 disabled:opacity-50"
          disabled={!name.trim()}
          onClick={submit}
        >
          <Plus className="w-4 h-4" /> Añadir
        </button>
      </div>
    </Card>
  );
}

function PendingRow({ item, onBought }: { item: ShoppingItem; onBought: () => void }) {
  const [open, setOpen] = useState(false);
  const [buyer, setBuyer] = useState(SOCIOS[0] ?? "");

  const mark = () => {
    markShoppingBought(item.id, buyer);
    onBought();
  };

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <button
          className="w-6 h-6 rounded-md border-2 border-socio text-socio grid place-items-center shrink-0"
          onClick={() => setOpen((v) => !v)}
          aria-label="Marcar como comprado"
        >
          {open ? <Check className="w-4 h-4" /> : null}
        </button>
        <p className="flex-1 font-semibold min-w-0">{item.name}</p>
        <button className="btn-ghost !p-2 text-destructive" onClick={() => deleteShoppingItem(item.id)} aria-label="Eliminar">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
          <select
            className="input-base flex-1"
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
          >
            {SOCIOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="btn-primary flex items-center gap-1" onClick={mark}>
            <Check className="w-4 h-4" /> Comprado
          </button>
        </div>
      )}
    </Card>
  );
}

function BoughtRow({ item }: { item: ShoppingItem }) {
  return (
    <Card className="p-3 opacity-70">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-md bg-socio text-socio-foreground grid place-items-center shrink-0">
          <Check className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold line-through">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            Comprado por {item.boughtBy || "-"} el {item.boughtAt ? relative(item.boughtAt) : "-"}
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
