import { useMemo, useState } from "react";
import {
  useShopping,
  addShoppingItem,
  markShoppingBought,
  markShoppingPending,
  deleteShoppingItem,
  clearBoughtShopping,
  type ShoppingItem,
  type ShoppingListKind,
} from "@/lib/store";
import { SOCIOS } from "@/lib/catalog";
import { searchProvider, LIST_LABEL } from "@/lib/provider-catalog";
import { Card, Input, EmptyState } from "@/components/ui";
import { Plus, Check, Trash2, RotateCcw, Wine, Utensils } from "lucide-react";

type Tab = "pendientes" | "comprados";

const relative = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const listOf = (i: ShoppingItem): ShoppingListKind => i.list ?? "menaje";

export function Shopping() {
  const [tab, setTab] = useState<Tab>("pendientes");
  const [list, setList] = useState<ShoppingListKind>("bodega");
  const items = useShopping();

  const pending = useMemo(
    () => items.filter((i) => !i.bought).sort((a, b) => b.createdAt - a.createdAt),
    [items],
  );
  const bought = useMemo(
    () => items.filter((i) => i.bought).sort((a, b) => (b.boughtAt ?? 0) - (a.boughtAt ?? 0)),
    [items],
  );

  const pendingInList = pending.filter((i) => listOf(i) === list);
  const boughtInList = bought.filter((i) => listOf(i) === list);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border">
        <TabBtn active={tab === "pendientes"} onClick={() => setTab("pendientes")} label="Pendientes" count={pending.length} />
        <TabBtn active={tab === "comprados"} onClick={() => setTab("comprados")} label="Comprados" count={bought.length} />
      </div>

      <ListSwitch
        value={list}
        onChange={setList}
        counts={{
          bodega: (tab === "pendientes" ? pending : bought).filter((i) => listOf(i) === "bodega").length,
          menaje: (tab === "pendientes" ? pending : bought).filter((i) => listOf(i) === "menaje").length,
        }}
      />

      {tab === "pendientes" ? (
        <>
          <h2 className="text-center text-xl font-bold tracking-wide">
            {list === "bodega" ? "PEDIDO AL BODEGUERO" : "MENAJE Y OTROS"}
          </h2>
          <AddForm list={list} />
          {pendingInList.length === 0 ? (
            <EmptyState
              title="No falta nada"
              hint={
                list === "bodega"
                  ? "Busca el artículo en el catálogo del proveedor."
                  : "Añade vasos, servilletas o cualquier cosa de fuera del proveedor."
              }
            />
          ) : (
            <div className="space-y-2">
              {pendingInList.map((i) => (
                <PendingRow key={i.id} item={i} onBought={() => setTab("comprados")} />
              ))}
            </div>
          )}
        </>
      ) : boughtInList.length === 0 ? (
        <EmptyState title="Todavía no se ha comprado nada" hint="Aquí verás lo ya comprado y quién lo compró." />
      ) : (
        <div className="space-y-2">
          {boughtInList.map((i) => (
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

function ListSwitch({
  value,
  onChange,
  counts,
}: {
  value: ShoppingListKind;
  onChange: (v: ShoppingListKind) => void;
  counts: Record<ShoppingListKind, number>;
}) {
  const opts: { key: ShoppingListKind; icon: typeof Wine }[] = [
    { key: "bodega", icon: Wine },
    { key: "menaje", icon: Utensils },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {opts.map(({ key, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
            value === key
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card/40 text-muted-foreground"
          }`}
        >
          <Icon className="w-4 h-4" strokeWidth={1.5} />
          {LIST_LABEL[key]}
          {counts[key] ? <span className="text-xs opacity-70">({counts[key]})</span> : null}
        </button>
      ))}
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

function AddForm({ list }: { list: ShoppingListKind }) {
  const [name, setName] = useState("");
  const suggestions = useMemo(() => searchProvider(list, name, 8), [list, name]);

  const add = (n: string, code?: string, price?: number) => {
    const v = n.trim();
    if (!v) return;
    addShoppingItem({
      name: v,
      category: "Otros",
      addedBy: "",
      list,
      providerCode: code,
      providerPrice: price,
    });
    setName("");
  };

  return (
    <Card className="p-3 space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={list === "bodega" ? "Buscar en el catálogo…" : "¿Qué falta?"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add(name)}
          className="flex-1"
        />
        <button
          type="button"
          className="btn-primary flex items-center gap-1 disabled:opacity-50"
          disabled={!name.trim()}
          onClick={() => add(name)}
        >
          <Plus className="w-4 h-4" /> Añadir
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.code}
              className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 flex items-center gap-2"
              onClick={() => add(s.name, s.code, s.price)}
            >
              <span className="flex-1 min-w-0 truncate">{s.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{s.price.toFixed(2)} €</span>
            </button>
          ))}
        </div>
      )}
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
        <div className="flex-1 min-w-0">
          <p className="font-semibold min-w-0">{item.name}</p>
          {item.providerPrice != null && (
            <p className="text-xs text-muted-foreground">
              Proveedor · {item.providerPrice.toFixed(2)} €
            </p>
          )}
        </div>
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
