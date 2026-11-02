import { useEffect, useMemo, useState } from "react";
import { CATEGORIAS, FOTOS, eur, type Producto } from "@/lib/tarifa";

type Linea = { producto: Producto; unidades: number };
type Tarifa = "no-socio" | "socio";
type TicketCerrado = {
  id: string;
  hora: string;
  total: number;
  unidades: number;
  tarifa: Tarifa;
  resumen: string;
};

const hoyClave = () => new Date().toISOString().slice(0, 10);
const STORAGE_KEY = "barro-tpv-caja";
const CUENTA_KEY = "barro-tpv-cuenta-en-curso";

function cargarCuenta(): { lineas: Linea[]; tarifa: Tarifa } | null {
  try {
    const raw = localStorage.getItem(CUENTA_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { lineas?: unknown; tarifa?: unknown };
    const lineas = Array.isArray(data.lineas)
      ? (data.lineas as Linea[]).filter(
          (l) => l && l.producto && typeof l.producto.id === "string" && typeof l.unidades === "number" && l.unidades > 0,
        )
      : [];
    const tarifa: Tarifa = data.tarifa === "socio" ? "socio" : "no-socio";
    return { lineas, tarifa };
  } catch {
    return null;
  }
}

function cargarCaja(): TicketCerrado[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { fecha: string; tickets: TicketCerrado[] };
    if (data.fecha !== hoyClave()) return [];
    return Array.isArray(data.tickets) ? data.tickets : [];
  } catch {
    return [];
  }
}

export function Tpv({ onClose }: { onClose?: () => void }) {
  const [tarifa, setTarifa] = useState<Tarifa>("no-socio");
  const [categoriaId, setCategoriaId] = useState(CATEGORIAS[1]!.id);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [cobrando, setCobrando] = useState(false);
  const [historico, setHistorico] = useState<TicketCerrado[]>([]);
  const [verHistorico, setVerHistorico] = useState(false);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setHistorico(cargarCaja());
    const cuenta = cargarCuenta();
    if (cuenta) {
      if (cuenta.lineas.length > 0) setLineas(cuenta.lineas);
      setTarifa(cuenta.tarifa);
    }
    setCargado(true);
  }, []);

  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(CUENTA_KEY, JSON.stringify({ lineas, tarifa }));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [lineas, tarifa, cargado]);

  useEffect(() => {
    if (!cargado) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fecha: hoyClave(), tickets: historico }));
  }, [historico, cargado]);

  const ventas = useMemo(
    () => ({
      tickets: historico.length,
      total: historico.reduce((acc, t) => acc + t.total, 0),
      unidades: historico.reduce((acc, t) => acc + t.unidades, 0),
    }),
    [historico],
  );

  const categoria = CATEGORIAS.find((c) => c.id === categoriaId) ?? CATEGORIAS[0]!;
  const precioDe = (p: Producto) => (tarifa === "socio" ? p.precioSocio : p.precio);

  const total = useMemo(
    () => lineas.reduce((acc, l) => acc + precioDe(l.producto) * l.unidades, 0),
    [lineas, tarifa],
  );
  const unidades = lineas.reduce((acc, l) => acc + l.unidades, 0);

  const anadir = (producto: Producto) =>
    setLineas((prev) => {
      const existe = prev.find((l) => l.producto.id === producto.id);
      if (existe) {
        return prev.map((l) => (l.producto.id === producto.id ? { ...l, unidades: l.unidades + 1 } : l));
      }
      return [...prev, { producto, unidades: 1 }];
    });

  const cambiar = (id: string, delta: number) =>
    setLineas((prev) =>
      prev
        .map((l) => (l.producto.id === id ? { ...l, unidades: l.unidades + delta } : l))
        .filter((l) => l.unidades > 0),
    );

  const finalizar = () => {
    const ticket: TicketCerrado = {
      id: `${Date.now()}`,
      hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      total,
      unidades,
      tarifa,
      resumen,
    };
    setHistorico((prev) => [ticket, ...prev]);
    setLineas([]);
    setCobrando(false);
  };

  const cantidadDe = (id: string) => lineas.find((l) => l.producto.id === id)?.unidades ?? 0;
  const resumen = lineas.map((l) => `${l.unidades} × ${l.producto.icono} ${l.producto.nombre}`).join(" + ");

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-clay-100 text-clay-800 select-none">
      <header className="flex shrink-0 items-center justify-between border-b border-clay-200 bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Volver al menú"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-100 text-lg font-bold active:scale-95"
            >
              ←
            </button>
          )}
          <div>
          <h1 className="text-xl font-bold tracking-tight text-terra-600">
            BARRO <span className="font-light text-clay-800">CB</span>
          </h1>
          <p className="text-[10px] tracking-widest uppercase opacity-60">Sociedad Gastronómica</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVerHistorico(true)}
            className="rounded-xl border border-clay-200 bg-clay-100 px-3 py-1.5 text-right active:scale-95"
          >
            <span className="block text-[10px] tracking-widest uppercase opacity-50">Caja de hoy</span>
            <span className="tabular block text-sm font-semibold">
              {eur(ventas.total)} <span className="font-normal opacity-50">· {ventas.tickets}</span>
            </span>
          </button>

          <div className="flex rounded-full border border-clay-200 bg-clay-100 p-1">
            {(["no-socio", "socio"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTarifa(t)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  tarifa === t ? "bg-card text-terra-600 shadow-sm" : "text-clay-800/50"
                }`}
              >
                {t === "socio" ? "SOCIO" : "NO SOCIO"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col">
          <nav className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoriaId(c.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-transform active:scale-95 ${
                  c.id === categoriaId ? `${c.color.activo} shadow-md` : c.color.inactivo
                }`}
              >
                <span aria-hidden className="text-base leading-none">
                  {c.icono}
                </span>
                {c.nombre}
              </button>
            ))}
          </nav>

          <main className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {categoria.productos.map((p) => {
                const cantidad = cantidadDe(p.id);
                return (
                  <div key={p.id} className="relative">
                    <button
                      onClick={() => anadir(p)}
                      className={`flex h-40 w-full flex-col items-center justify-between rounded-2xl bg-card p-3 text-center transition-transform active:scale-[0.98] ${
                        cantidad > 0 ? "border-2 border-terra-600/20 shadow-lg" : "border border-clay-200"
                      }`}
                    >
                      <img
                        src={FOTOS[p.id]}
                        alt={p.nombre}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-xl object-contain"
                      />
                      <div className="w-full">
                        <span className={`block text-xs font-bold uppercase ${categoria.color.acento}`}>
                          {p.nombre}
                        </span>
                        <span className="line-clamp-1 text-[11px] leading-tight font-medium opacity-60">{p.marcas}</span>
                      </div>
                      <div className="flex w-full items-end justify-between">
                        <span className="tabular text-lg font-bold">{eur(precioDe(p))}</span>
                        {cantidad > 0 && (
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${categoria.color.badge}`}
                          >
                            {cantidad}
                          </span>
                        )}
                      </div>
                    </button>
                    {cantidad > 0 && (
                      <button
                        onClick={() => cambiar(p.id, -1)}
                        aria-label={`Quitar una unidad de ${p.nombre}`}
                        className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-clay-100 bg-clay-800 text-xl font-bold text-clay-100 shadow-md active:scale-90"
                      >
                        −
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </main>
        </div>

        <aside className="flex max-h-[45dvh] w-full shrink-0 flex-col border-t border-clay-200 bg-card lg:max-h-none lg:w-[380px] lg:border-t-0 lg:border-l xl:w-[420px]">
          <div className="flex shrink-0 items-center justify-between border-b border-clay-200 px-5 py-3">
            <div>
              <p className="text-[10px] tracking-widest uppercase opacity-60">Ronda en curso</p>
              <p className="text-sm font-semibold">
                {lineas.length === 0 ? "Ticket vacío" : `${unidades} consumiciones`}
              </p>
            </div>
            <span className="tabular text-2xl font-bold text-terra-600">{eur(total)}</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-clay-200 px-5">
            {lineas.length === 0 && (
              <p className="py-8 text-center text-sm opacity-50">
                Toca una consumición para empezar la cuenta.
              </p>
            )}
            {lineas.map((l) => (
              <div key={l.producto.id} className="flex items-center gap-3 py-3">
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => cambiar(l.producto.id, -1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-100 text-lg font-bold text-clay-800 active:scale-95"
                    aria-label={`Quitar ${l.producto.nombre}`}
                  >
                    −
                  </button>
                  <span className="tabular w-5 text-center font-semibold">{l.unidades}</span>
                  <button
                    onClick={() => cambiar(l.producto.id, 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-100 text-lg font-bold text-clay-800 active:scale-95"
                    aria-label={`Añadir ${l.producto.nombre}`}
                  >
                    +
                  </button>
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.producto.nombre}</span>
                <span className="tabular shrink-0 text-sm">{eur(precioDe(l.producto) * l.unidades)}</span>
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t border-clay-200 p-4">
            <button
              onClick={() => setCobrando(true)}
              disabled={lineas.length === 0}
              className="w-full rounded-2xl bg-terra-600 py-4 text-lg font-bold text-primary-foreground transition-colors hover:bg-terra-700 active:scale-[0.97] disabled:opacity-40"
            >
              Cerrar cuenta · {eur(total)}
            </button>
          </div>
        </aside>
      </div>

      {cobrando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-clay-800/60 p-0 sm:items-center sm:p-6">
          <div className="w-full max-w-md rounded-t-[2rem] bg-card p-6 sm:rounded-[2rem]">
            <p className="text-xs tracking-widest uppercase opacity-60">Total a cobrar con tarjeta</p>
            <p className="tabular mb-2 text-5xl font-bold text-terra-600">{eur(total)}</p>
            <p className="mb-6 text-sm font-medium opacity-60">
              {unidades} consumiciones · cobra el importe en el datáfono y cierra la cuenta.
            </p>

            <button
              onClick={finalizar}
              className="w-full rounded-2xl bg-terra-600 py-5 text-lg font-bold text-primary-foreground active:scale-[0.97]"
            >
              Cuenta cobrada
            </button>
            <button
              onClick={() => setCobrando(false)}
              className="mt-3 w-full py-3 text-sm font-medium opacity-60"
            >
              Volver al ticket
            </button>
          </div>
        </div>
      )}

      {verHistorico && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-clay-800/60 sm:items-center sm:p-6">
          <div className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-[2rem] bg-card p-6 sm:rounded-[2rem]">
            <p className="text-xs tracking-widest uppercase opacity-60">Totales del día</p>
            <p className="tabular text-5xl font-bold text-terra-600">{eur(ventas.total)}</p>
            <p className="mb-4 text-sm font-medium opacity-60">
              {ventas.tickets} cuentas · {ventas.unidades} consumiciones
            </p>

            <div className="-mx-2 flex-1 overflow-y-auto divide-y divide-clay-200 px-2">
              {historico.length === 0 && (
                <p className="py-6 text-sm opacity-60">Todavía no se ha cerrado ninguna cuenta hoy.</p>
              )}
              {historico.map((t) => (
                <div key={t.id} className="flex items-start gap-3 py-3">
                  <span className="tabular w-12 shrink-0 text-xs font-semibold opacity-60">{t.hora}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.resumen}</p>
                    <p className="text-[10px] tracking-widest uppercase opacity-50">
                      {t.unidades} consumiciones · {t.tarifa === "socio" ? "socio" : "no socio"}
                    </p>
                  </div>
                  <span className="tabular text-sm font-bold">{eur(t.total)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setVerHistorico(false)}
              className="mt-4 w-full rounded-2xl bg-terra-600 py-4 text-lg font-bold text-primary-foreground active:scale-[0.97]"
            >
              Cerrar
            </button>
            {historico.length > 0 && (
              <button
                onClick={() => {
                  setHistorico([]);
                  setVerHistorico(false);
                }}
                className="mt-2 w-full py-3 text-xs tracking-widest uppercase opacity-60 underline"
              >
                Cerrar caja y reiniciar totales
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
