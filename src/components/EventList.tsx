import { useState } from "react";
import { useStore, createEvent, setActiveEvent, renameEvent, type Event } from "@/lib/store";
import { Card, Input } from "@/components/ui";
import { fmt } from "@/lib/catalog";
import { Plus, ChevronRight, Pencil } from "lucide-react";

type SubTab = "open" | "closed";

export function EventList({ onOpen }: { onOpen: (id: string) => void }) {
  const events = useStore((s) => s.events);
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [subTab, setSubTab] = useState<SubTab>("open");

  const openEvents = events.filter((e) => !e.closed);
  const closedEvents = events.filter((e) => e.closed);
  const shownEvents = subTab === "open" ? openEvents : closedEvents;

  const create = () => {
    const n = name.trim();
    if (!n) return;
    const id = createEvent(n, date);
    setName("");
    setSubTab("open");
    onOpen(id);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Nuevo evento</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Ej. Comida del domingo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="sm:w-48"
          />
          <button className="btn-primary" onClick={create}>
            <Plus className="w-4 h-4" /> Crear
          </button>
        </div>
      </Card>

      {events.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No hay eventos aún. Crea el primero para empezar.
        </Card>
      ) : (
        <div className="space-y-4">
      <div className="flex gap-1 border-b border-border">
            <SubTabBtn
              active={subTab === "open"}
              onClick={() => setSubTab("open")}
              label="En curso"
              count={openEvents.length}
            />
            <SubTabBtn
              active={subTab === "closed"}
              onClick={() => setSubTab("closed")}
              label="Cerrados"
              count={closedEvents.length}
            />
          </div>

          {shownEvents.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              {subTab === "open"
                ? "No hay eventos en curso."
                : "No hay eventos cerrados."}
            </Card>
          ) : (
            <div className="grid gap-2">
              {shownEvents.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  editing={editing}
                  editName={editName}
                  editDate={editDate}
                  setEditName={setEditName}
                  setEditDate={setEditDate}
                  setEditing={setEditing}
                  onOpen={onOpen}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubTabBtn({
  active,
  onClick,
  label,
  count,
  activeClass,
  inactiveClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  activeClass: string;
  inactiveClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 rounded-t-lg bg-white/30 transition-colors ${
        active ? activeClass : `border-transparent text-muted-foreground hover:text-foreground hover:bg-white/45 ${inactiveClass}`
      }`}
    >
      {label}
      <span
        className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full px-1.5 text-xs ${
          active ? "bg-current text-background" : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EventCard({
  event,
  editing,
  editName,
  editDate,
  setEditName,
  setEditDate,
  setEditing,
  onOpen,
}: {
  event: Event;
  editing: string | null;
  editName: string;
  editDate: string;
  setEditName: (v: string) => void;
  setEditDate: (v: string) => void;
  setEditing: (v: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const total = event.consumptions.reduce((s, c) => s + c.unitPrice * c.qty, 0);
  const isEdit = editing === event.id;

  return (
    <Card key={event.id} className="p-4">
      {isEdit ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input value={editName} onChange={(ev) => setEditName(ev.target.value)} />
          <Input
            type="date"
            value={editDate}
            onChange={(ev) => setEditDate(ev.target.value)}
            className="sm:w-48"
          />
          <button
            className="btn-primary"
            onClick={() => {
              renameEvent(event.id, editName.trim() || event.name, editDate || event.date);
              setEditing(null);
            }}
          >
            Guardar
          </button>
          <button className="btn-ghost" onClick={() => setEditing(null)}>
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <button
            className="flex-1 text-left min-w-0"
            onClick={() => {
              setActiveEvent(event.id);
              onOpen(event.id);
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{event.name}</span>
              {event.closed ? (
                <span className="chip bg-destructive text-destructive-foreground">Cerrado</span>
              ) : (
                <span className="chip bg-socio text-socio-foreground">En curso</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {new Date(event.date).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · {event.attendees.length} asistentes · {fmt(total)}
            </div>
          </button>
          <button
            className="btn-ghost !p-2"
            onClick={() => {
              setEditing(event.id);
              setEditName(event.name);
              setEditDate(event.date);
            }}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="btn-ghost !p-2"
            onClick={() => {
              setActiveEvent(event.id);
              onOpen(event.id);
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </Card>
  );
}
