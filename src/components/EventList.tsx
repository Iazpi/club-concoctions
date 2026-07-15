import { useState } from "react";
import { useStore, createEvent, setActiveEvent, renameEvent } from "@/lib/store";
import { Card, Input } from "@/components/ui";
import { fmt } from "@/lib/catalog";
import { Plus, ChevronRight, Pencil } from "lucide-react";

export function EventList({ onOpen }: { onOpen: (id: string) => void }) {
  const events = useStore((s) => s.events);
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");

  const create = () => {
    const n = name.trim();
    if (!n) return;
    const id = createEvent(n, date);
    setName("");
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
        <div className="grid gap-2">
          {events.map((e) => {
            const total = e.consumptions.reduce((s, c) => s + c.unitPrice * c.qty, 0);
            const isEdit = editing === e.id;
            return (
              <Card key={e.id} className="p-4">
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
                        renameEvent(e.id, editName.trim() || e.name, editDate || e.date);
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
                        setActiveEvent(e.id);
                        onOpen(e.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{e.name}</span>
                        {e.closed && (
                          <span className="chip bg-muted text-muted-foreground">Cerrado</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(e.date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        · {e.attendees.length} asistentes · {fmt(total)}
                      </div>
                    </button>
                    <button
                      className="btn-ghost !p-2"
                      onClick={() => {
                        setEditing(e.id);
                        setEditName(e.name);
                        setEditDate(e.date);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className="btn-ghost !p-2"
                      onClick={() => {
                        setActiveEvent(e.id);
                        onOpen(e.id);
                      }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
