import { useMemo, useState } from "react";
import {
  useReservations,
  addReservation,
  setReservationStatus,
  deleteReservation,
  slotsOverlap,
  SLOT_LABEL,
  type Slot,
  type Reservation,
} from "@/lib/store";
import { SOCIOS } from "@/lib/catalog";
import { Card, Input } from "@/components/ui";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  Lock,
  Trash2,
  CalendarCheck,
} from "lucide-react";

// PIN de administrador (cámbialo cuando quieras en este archivo)
const ADMIN_PIN = "1898";

const SLOTS: Slot[] = ["manana", "tarde", "noche", "completo"];
const DOW = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const prettyDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return `${d} de ${MONTHS[(m ?? 1) - 1]} de ${y}`;
};

type Tab = "calendario" | "solicitar" | "admin";

export function Reservations() {
  const [tab, setTab] = useState<Tab>("calendario");
  const [selected, setSelected] = useState<string>(iso(new Date()));
  const reservations = useReservations();
  const pending = reservations.filter((r) => r.status === "pendiente").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border">
        <TabBtn active={tab === "calendario"} onClick={() => setTab("calendario")} label="Calendario" />
        <TabBtn active={tab === "solicitar"} onClick={() => setTab("solicitar")} label="Solicitar" />
        <TabBtn active={tab === "admin"} onClick={() => setTab("admin")} label="Admin" count={pending} />
      </div>

      {tab === "calendario" && (
        <CalendarView
          selected={selected}
          onSelect={(d) => setSelected(d)}
          onRequest={(d) => {
            setSelected(d);
            setTab("solicitar");
          }}
        />
      )}
      {tab === "solicitar" && <RequestForm date={selected} setDate={setSelected} onDone={() => setTab("calendario")} />}
      {tab === "admin" && <AdminPanel />}
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
      className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground"
      }`}
    >
      {label}
      {!!count && (
        <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-[11px] font-bold">
          {count}
        </span>
      )}
    </button>
  );
}

function useDayInfo() {
  const reservations = useReservations();
  return useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of reservations) {
      if (r.status === "rechazada") continue;
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return map;
  }, [reservations]);
}

function CalendarView({
  selected,
  onSelect,
  onRequest,
}: {
  selected: string;
  onSelect: (d: string) => void;
  onRequest: (d: string) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const dayInfo = useDayInfo();

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lunes primero
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => iso(new Date(year, month, i + 1))),
  ];

  const dayRes = dayInfo.get(selected) ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button className="btn-ghost !p-2" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mes anterior">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-display text-lg font-bold">
            {MONTHS[month]} {year}
          </h3>
          <button className="btn-ghost !p-2" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mes siguiente">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-1">
          {DOW.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const list = dayInfo.get(d) ?? [];
            const approved = list.some((r) => r.status === "aprobada");
            const pending = list.some((r) => r.status === "pendiente");
            const isSel = d === selected;
            const isToday = d === iso(today);
            return (
              <button
                key={i}
                onClick={() => onSelect(d)}
                className={`aspect-square rounded-xl text-sm font-semibold grid place-items-center relative transition-colors ${
                  isSel
                    ? "bg-primary text-primary-foreground"
                    : approved
                      ? "bg-destructive/50 text-destructive-foreground"
                      : pending
                        ? "bg-info/40 text-foreground"
                        : "bg-white/40 text-foreground hover:bg-white/60"
                } ${isToday && !isSel ? "ring-2 ring-primary/60" : ""}`}
              >
                {Number(d.slice(-2))}
                {(approved || pending) && (
                  <span
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      approved ? "bg-destructive-foreground" : "bg-info-foreground"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
          <Legend className="bg-destructive/50" label="Reservado" />
          <Legend className="bg-info/40" label="Pendiente" />
          <Legend className="bg-white/40" label="Libre" />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">{prettyDate(selected)}</h3>
        {dayRes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Día libre, sin reservas.</p>
        ) : (
          <ul className="space-y-2">
            {dayRes.map((r) => (
              <li key={r.id} className="flex items-start gap-2 text-sm">
                {r.status === "aprobada" ? (
                  <CalendarCheck className="w-4 h-4 mt-0.5 text-destructive-foreground" />
                ) : (
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {SLOT_LABEL[r.slot]} ·{" "}
                    <span className={r.status === "aprobada" ? "text-destructive-foreground" : "text-muted-foreground"}>
                      {r.status === "aprobada" ? "Aprobada" : "Pendiente de aprobación"}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    {r.name} {r.surname} — {r.reason}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button className="btn-primary mt-4 w-full justify-center" onClick={() => onRequest(selected)}>
          Solicitar este día
        </button>
      </Card>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${className}`} /> {label}
    </span>
  );
}

function RequestForm({
  date,
  setDate,
  onDone,
}: {
  date: string;
  setDate: (d: string) => void;
  onDone: () => void;
}) {
  const reservations = useReservations();
  const [slot, setSlot] = useState<Slot>("noche");
  const [socio, setSocio] = useState<string>("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);

  const dayRes = reservations.filter((r) => r.date === date && r.status !== "rechazada");
  const blockedBy = dayRes.find((r) => r.status === "aprobada" && slotsOverlap(r.slot, slot));
  const pendingClash = dayRes.find((r) => r.status === "pendiente" && slotsOverlap(r.slot, slot));

  const finalName = socio ? socio : name.trim();
  const canSend = !!finalName && !!reason.trim() && !blockedBy;

  const submit = () => {
    if (!canSend) return;
    addReservation({
      date,
      slot,
      name: finalName,
      surname: socio ? "" : surname.trim(),
      reason: reason.trim(),
    });
    setSent(true);
  };

  if (sent) {
    return (
      <Card className="p-6 text-center space-y-3">
        <Clock className="w-10 h-10 mx-auto text-info-foreground" />
        <h3 className="font-display text-xl font-bold">Solicitud enviada</h3>
        <p className="text-sm text-muted-foreground">
          Tu reserva del {prettyDate(date)} ({SLOT_LABEL[slot]}) queda <strong>pendiente de aprobación</strong> por el
          administrador. Podrás ver la resolución en el calendario.
        </p>
        <button className="btn-primary w-full justify-center" onClick={onDone}>
          Volver al calendario
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div>
        <label className="text-sm font-semibold">Fecha</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
      </div>

      <div>
        <label className="text-sm font-semibold">Franja horaria</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {SLOTS.map((s) => {
            const blocked = dayRes.some((r) => r.status === "aprobada" && slotsOverlap(r.slot, s));
            return (
              <button
                key={s}
                disabled={blocked}
                onClick={() => setSlot(s)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold text-left transition-colors ${
                  blocked
                    ? "bg-muted text-muted-foreground line-through cursor-not-allowed"
                    : slot === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/40 hover:bg-white/60"
                }`}
              >
                {SLOT_LABEL[s]}
                {blocked && " · ocupada"}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold">Socio</label>
        <select
          value={socio}
          onChange={(e) => setSocio(e.target.value)}
          className="input-base mt-1"
        >
          <option value="">— No soy socio / otro —</option>
          {SOCIOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {!socio && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input placeholder="Nombre" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Apellido" value={surname} maxLength={40} onChange={(e) => setSurname(e.target.value)} />
        </div>
      )}

      <div>
        <label className="text-sm font-semibold">Motivo del evento</label>
        <Input
          placeholder="Ej. Cumpleaños, cena de Nochevieja..."
          value={reason}
          maxLength={120}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1"
        />
      </div>

      {blockedBy && (
        <p className="text-sm text-destructive font-medium">
          Esa franja ya está reservada ({blockedBy.name} — {blockedBy.reason}). Elige otra franja u otro día.
        </p>
      )}
      {!blockedBy && pendingClash && (
        <p className="text-sm text-muted-foreground">
          Aviso: ya hay una solicitud pendiente para esa franja ({pendingClash.name}). El administrador decidirá.
        </p>
      )}

      <button className="btn-primary w-full justify-center" disabled={!canSend} onClick={submit}>
        Enviar solicitud
      </button>
    </Card>
  );
}

function AdminPanel() {
  const reservations = useReservations();
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(false);

  if (!ok) {
    return (
      <Card className="p-6 space-y-3 text-center">
        <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
        <h3 className="font-semibold">Zona de administrador</h3>
        <p className="text-sm text-muted-foreground">Introduce el PIN para gestionar las solicitudes.</p>
        <Input
          type="password"
          inputMode="numeric"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setOk(pin === ADMIN_PIN)}
          className="text-center"
        />
        <button className="btn-primary w-full justify-center" onClick={() => setOk(pin === ADMIN_PIN)}>
          Entrar
        </button>
        {pin && pin !== ADMIN_PIN && <p className="text-sm text-destructive">PIN incorrecto</p>}
      </Card>
    );
  }

  const pending = reservations.filter((r) => r.status === "pendiente");
  const resolved = [...reservations]
    .filter((r) => r.status !== "pendiente")
    .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Solicitudes pendientes ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="rounded-xl bg-white/40 p-3">
                <p className="font-semibold">
                  {r.name} {r.surname}
                </p>
                <p className="text-sm text-muted-foreground">
                  {prettyDate(r.date)} · {SLOT_LABEL[r.slot]}
                </p>
                <p className="text-sm mt-1">{r.reason}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    className="btn-primary flex-1 justify-center"
                    onClick={() => setReservationStatus(r.id, "aprobada")}
                  >
                    <Check className="w-4 h-4" /> Aprobar
                  </button>
                  <button
                    className="btn-ghost flex-1 justify-center text-destructive"
                    onClick={() => setReservationStatus(r.id, "rechazada")}
                  >
                    <X className="w-4 h-4" /> Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Histórico de reservas</h3>
        {resolved.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay reservas resueltas.</p>
        ) : (
          <ul className="space-y-2">
            {resolved.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-sm rounded-xl bg-white/40 p-2">
                <span
                  className={`chip ${
                    r.status === "aprobada" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.status === "aprobada" ? "Aprobada" : "Rechazada"}
                </span>
                <span className="flex-1 min-w-0 truncate">
                  {prettyDate(r.date)} · {r.name} {r.surname} — {r.reason}
                </span>
                <button
                  className="btn-ghost !p-2 text-destructive"
                  onClick={() => deleteReservation(r.id)}
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
