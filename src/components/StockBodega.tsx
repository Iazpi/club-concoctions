import { useMemo, useState } from "react";
import {
  useStockItems,
  useStockMoves,
  addStockItem,
  moveStock,
  deleteStockItem,
  renameStockItem,
  clearStockMoves,
  setStockFamily,
  STOCK_FAMILIES,
  type StockFamily,
  type StockItem,
  type StockMove,
} from "@/lib/store";
import { SOCIOS } from "@/lib/catalog";
import { Card, Input, EmptyState } from "@/components/ui";
import { Plus, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, Trash2, Search } from "lucide-react";

type Tab = "stock" | "historial";
const WHO_KEY = "barro-stock-who";

const fmtDate = (ts: number) => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

type Qty = { packs: string; per: string; total: string };
const emptyQty: Qty = { packs: "", per: "", total: "" };
const toInt = (v: string) => Math.max(0, parseInt(v || "0", 10) || 0);
const famOf = (i: StockItem): StockFamily => i.family ?? "Otros";

// packs x uds/pack = total; el total también se puede escribir a mano (uds sueltas)
function QtyFields({ value, onChange }: { value: Qty; onChange: (q: Qty) => void }) {
  const recalc = (packs: string, per: string, total: string): Qty => {
    const t = toInt(packs) * toInt(per);
    return { packs, per, total: t > 0 ? String(t) : total };
  };
  const lbl = "block text-[11px] text-muted-foreground mb-0.5 text-center";
  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-end gap-1.5">
      <label>
        <span className={lbl}>Nº packs</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={value.packs}
          onChange={(e) => onChange(recalc(e.target.value, value.per, value.total))}
          className="w-full text-center"
        />
      </label>
      <span className="pb-2 text-muted-foreground">×</span>
      <label>
        <span className={lbl}>Uds/pack</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="12"
          value={value.per}
          onChange={(e) => onChange(recalc(value.packs, e.target.value, value.total))}
          className="w-full text-center"
        />
      </label>
      <span className="pb-2 text-muted-foreground">=</span>
      <label>
        <span className={lbl}>Total uds</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={value.total}
          onChange={(e) => onChange({ ...value, packs: "", total: e.target.value })}
          className="w-full text-center font-bold"
        />
      </label>
    </div>
  );
}

function FamilyChips({
  value,
  onChange,
  withAll,
  counts,
}: {
  value: StockFamily | "Todos";
  onChange: (v: any) => void;
  withAll?: boolean;
  counts?: Record<string, number>;
}) {
  const opts: (StockFamily | "Todos")[] = withAll ? ["Todos", ...STOCK_FAMILIES] : STOCK_FAMILIES;
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            value === o ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/40 text-muted-foreground"
          }`}
        >
          {o}
          {counts?.[o] ? <span className="ml-1 opacity-70">({counts[o]})</span> : null}
        </button>
      ))}
    </div>
  );
}

function useWho() {
  const [who, setWhoState] = useState<string>(() => {
    if (typeof window === "undefined") return SOCIOS[0] ?? "";
    return localStorage.getItem(WHO_KEY) || SOCIOS[0] || "";
  });
  const setWho = (v: string) => {
    setWhoState(v);
    try {
      localStorage.setItem(WHO_KEY, v);
    } catch {
      /* ignore */
    }
  };
  return [who, setWho] as const;
}

export function StockBodega() {
  const [tab, setTab] = useState<Tab>("stock");
  const [who, setWho] = useWho();
  const items = useStockItems();
  const moves = useStockMoves();

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border">
        <TabBtn active={tab === "stock"} onClick={() => setTab("stock")} label="Stock" count={items.length} />
        <TabBtn active={tab === "historial"} onClick={() => setTab("historial")} label="Historial" />
      </div>

      <Card className="p-3 flex items-center gap-2">
        <span className="text-sm font-semibold shrink-0">¿Quién eres?</span>
        <select className="input-base flex-1" value={who} onChange={(e) => setWho(e.target.value)}>
          {SOCIOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Card>

      {tab === "stock" ? <StockTab items={items} who={who} /> : <HistoryTab moves={moves} />}
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

function StockTab({ items, who }: { items: StockItem[]; who: string }) {
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState<Qty>(emptyQty);
  const [newFamily, setNewFamily] = useState<StockFamily>("Alcohol");
  const [famFilter, setFamFilter] = useState<StockFamily | "Todos">("Todos");
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return [...items]
      .filter((i) => famFilter === "Todos" || famOf(i) === famFilter)
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [items, filter, famFilter]);

  const add = () => {
    const n = newName.trim();
    if (!n) return;
    addStockItem(n, toInt(newQty.total), who, newFamily);
    setNewName("");
    setNewQty({ ...emptyQty, per: newQty.per });
  };

  const shown = items.filter((i) => famFilter === "Todos" || famOf(i) === famFilter);
  const total = shown.reduce((a, i) => a + i.qty, 0);
  const counts: Record<string, number> = { Todos: items.length };
  for (const i of items) counts[famOf(i)] = (counts[famOf(i)] ?? 0) + 1;

  return (
    <div className="space-y-3">
      <Card className="p-3 space-y-2">
        <p className="text-sm font-semibold">Nuevo producto en bodega</p>
        <Input
          placeholder="Ej. Cerveza Mahou"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="w-full"
        />
        <FamilyChips value={newFamily} onChange={setNewFamily} />
        <QtyFields value={newQty} onChange={setNewQty} />
        <button className="btn-primary w-full flex items-center justify-center gap-1 disabled:opacity-50" disabled={!newName.trim()} onClick={add}>
          <Plus className="w-4 h-4" /> Añadir{toInt(newQty.total) > 0 ? ` (${toInt(newQty.total)} uds)` : ""}
        </button>
      </Card>

      {items.length > 0 && <FamilyChips value={famFilter} onChange={setFamFilter} withAll counts={counts} />}

      {items.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full !pl-9" />
          </div>
          <span className="text-xs font-semibold text-foreground shrink-0">{total} uds</span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="La bodega está vacía"
          hint="Añade los productos que guardáis abajo y, desde aquí, registra lo que entra y lo que subís a la barra."
        />
      ) : sorted.length === 0 ? (
        <EmptyState title="Sin resultados" />
      ) : (
        <div className="space-y-2">
          {sorted.map((i) => (
            <StockRow
              key={i.id}
              item={i}
              who={who}
              open={openId === i.id}
              onToggle={() => setOpenId(openId === i.id ? null : i.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StockRow({
  item,
  who,
  open,
  onToggle,
}: {
  item: StockItem;
  who: string;
  open: boolean;
  onToggle: () => void;
}) {
  const [qty, setQty] = useState<Qty>(emptyQty);
  const [count, setCount] = useState("");
  const n = toInt(qty.total);
  const move = (type: "entrada" | "subida") => {
    moveStock(item.id, type, n, who);
    setQty({ ...emptyQty, per: qty.per });
  };
  const empty = item.qty === 0;

  return (
    <Card className="p-3">
      <button className="w-full flex items-center gap-3 text-left" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold truncate ${empty ? "text-muted-foreground" : ""}`}>{item.name}</p>
          <p className="text-[11px] text-muted-foreground">{famOf(item)}</p>
        </div>
        <span
          className={`min-w-12 text-center rounded-lg px-3 py-1 text-lg font-bold tabular-nums ${
            empty ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
          }`}
        >
          {item.qty}
        </span>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          <QtyFields value={qty} onChange={setQty} />
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-primary flex items-center justify-center gap-1 disabled:opacity-50"
              disabled={n <= 0}
              onClick={() => move("entrada")}
            >
              <ArrowDownToLine className="w-4 h-4" /> Entra a bodega
            </button>
            <button
              className="btn-secondary flex items-center justify-center gap-1 disabled:opacity-50"
              disabled={n <= 0 || item.qty === 0}
              onClick={() => move("subida")}
            >
              <ArrowUpFromLine className="w-4 h-4" /> Sube a barra
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Stock real"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="flex-1"
            />
            <button
              className="btn-ghost border border-border flex items-center gap-1 disabled:opacity-50"
              disabled={count === ""}
              onClick={() => {
                moveStock(item.id, "ajuste", parseInt(count, 10) || 0, who);
                setCount("");
              }}
            >
              <ClipboardCheck className="w-4 h-4" /> Contar
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground shrink-0">Familia</span>
            <select
              className="input-base flex-1"
              value={famOf(item)}
              onChange={(e) => setStockFamily(item.id, e.target.value as StockFamily)}
            >
              {STOCK_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <button
              className="text-muted-foreground underline"
              onClick={() => {
                const nn = prompt("Nuevo nombre", item.name);
                if (nn) renameStockItem(item.id, nn);
              }}
            >
              Renombrar
            </button>
            <button
              className="flex items-center gap-1 text-destructive"
              onClick={() => {
                if (confirm(`¿Eliminar "${item.name}" de la bodega?`)) deleteStockItem(item.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar producto
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

const MOVE_LABEL: Record<StockMove["type"], string> = {
  entrada: "Entrada",
  subida: "Subida a barra",
  ajuste: "Recuento",
};

function HistoryTab({ moves }: { moves: StockMove[] }) {
  if (moves.length === 0) {
    return <EmptyState title="Aún no hay movimientos" hint="Aquí verás quién metió o subió cada cosa y cuándo." />;
  }
  return (
    <div className="space-y-2">
      {moves.map((m) => (
        <Card key={m.id} className="p-3 flex items-center gap-3">
          <span
            className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
              m.type === "entrada"
                ? "bg-socio text-socio-foreground"
                : m.type === "subida"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {m.type === "entrada" ? (
              <ArrowDownToLine className="w-4 h-4" />
            ) : m.type === "subida" ? (
              <ArrowUpFromLine className="w-4 h-4" />
            ) : (
              <ClipboardCheck className="w-4 h-4" />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{m.itemName}</p>
            <p className="text-xs text-muted-foreground">
              {MOVE_LABEL[m.type]}
              {m.type === "ajuste" ? ` · ${m.before} → ${m.after}` : ` · ${m.qty} ud${m.qty === 1 ? "" : "s"} (quedan ${m.after})`}
              {" · "}
              {m.who || "-"} · {fmtDate(m.ts)}
            </p>
          </div>
        </Card>
      ))}
      <button
        className="btn-ghost w-full text-sm text-muted-foreground"
        onClick={() => {
          if (confirm("¿Vaciar el historial de movimientos? El stock actual no cambia.")) clearStockMoves();
        }}
      >
        Vaciar historial
      </button>
    </div>
  );
}
