import { useMemo, useState } from "react";
import {
  useStockItems,
  useStockMoves,
  addStockItem,
  moveStock,
  deleteStockItem,
  renameStockItem,
  clearStockMoves,
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
  const [newQty, setNewQty] = useState("");
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return [...items]
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [items, filter]);

  const add = () => {
    const n = newName.trim();
    if (!n) return;
    addStockItem(n, Math.max(0, parseInt(newQty || "0", 10) || 0), who);
    setNewName("");
    setNewQty("");
  };

  const total = items.reduce((a, i) => a + i.qty, 0);

  return (
    <div className="space-y-3">
      <Card className="p-3 space-y-2">
        <p className="text-sm font-semibold">Nuevo producto en bodega</p>
        <div className="flex gap-2">
          <Input
            placeholder="Ej. Cerveza Mahou caja"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="flex-1 min-w-0"
          />
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Uds"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="w-20"
          />
          <button className="btn-primary flex items-center gap-1 disabled:opacity-50" disabled={!newName.trim()} onClick={add}>
            <Plus className="w-4 h-4" /> Añadir
          </button>
        </div>
      </Card>

      {items.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full !pl-9" />
          </div>
          <span className="text-xs font-semibold text-foreground shrink-0">{total} uds en total</span>
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
  const [amount, setAmount] = useState("1");
  const [count, setCount] = useState("");
  const n = Math.max(0, parseInt(amount || "0", 10) || 0);
  const empty = item.qty === 0;

  return (
    <Card className="p-3">
      <button className="w-full flex items-center gap-3 text-left" onClick={onToggle}>
        <p className={`flex-1 min-w-0 font-semibold truncate ${empty ? "text-muted-foreground" : ""}`}>{item.name}</p>
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
          <div className="flex items-center gap-2">
            <button className="btn-ghost !p-2 border border-border" onClick={() => setAmount(String(Math.max(1, n - 1)))} aria-label="Menos">
              −
            </button>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-20 text-center"
            />
            <button className="btn-ghost !p-2 border border-border" onClick={() => setAmount(String(n + 1))} aria-label="Más">
              +
            </button>
            <span className="text-xs text-muted-foreground">unidades</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-primary flex items-center justify-center gap-1 disabled:opacity-50"
              disabled={n <= 0}
              onClick={() => moveStock(item.id, "entrada", n, who)}
            >
              <ArrowDownToLine className="w-4 h-4" /> Entra a bodega
            </button>
            <button
              className="btn-secondary flex items-center justify-center gap-1 disabled:opacity-50"
              disabled={n <= 0 || item.qty === 0}
              onClick={() => moveStock(item.id, "subida", n, who)}
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
