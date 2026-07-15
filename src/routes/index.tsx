import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, setActiveEvent } from "@/lib/store";
import { EventList } from "@/components/EventList";
import { EventView } from "@/components/EventView";
import { History } from "@/components/History";
import { Tariff } from "@/components/Tariff";
import { ArrowLeft, CalendarDays, History as HistoryIcon, ListOrdered } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barro CB · Gestión de consumiciones" },
      {
        name: "description",
        content:
          "App para llevar la cuenta de asistentes y consumiciones en los eventos de Barro CB.",
      },
      { property: "og:title", content: "Barro CB · Gestión de consumiciones" },
      {
        property: "og:description",
        content: "Cuenta individual por asistente e histórico mensual por ítem.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

type Tab = "eventos" | "historico" | "tarifa";

function Index() {
  const [tab, setTab] = useState<Tab>("eventos");
  const [openId, setOpenId] = useState<string | null>(null);
  const event = useStore((s) =>
    openId ? s.events.find((e) => e.id === openId) ?? null : null,
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/75 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {event ? (
            <button
              className="btn-ghost !p-2"
              onClick={() => {
                setOpenId(null);
                setActiveEvent(null);
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-bold">
              B
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">
              {event ? event.name : "Barro CB"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {event ? "Cuenta del evento" : "Gestión de consumiciones"}
            </p>
          </div>
        </div>
        {!event && (
          <nav className="max-w-3xl mx-auto px-2 flex gap-1">
            <TabBtn active={tab === "eventos"} onClick={() => setTab("eventos")} icon={<CalendarDays className="w-4 h-4" />}>
              Eventos
            </TabBtn>
            <TabBtn active={tab === "historico"} onClick={() => setTab("historico")} icon={<HistoryIcon className="w-4 h-4" />}>
              Histórico
            </TabBtn>
            <TabBtn active={tab === "tarifa"} onClick={() => setTab("tarifa")} icon={<ListOrdered className="w-4 h-4" />}>
              Tarifa
            </TabBtn>
          </nav>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-16">
        {event ? (
          <EventView event={event} />
        ) : tab === "eventos" ? (
          <EventList onOpen={(id) => setOpenId(id)} />
        ) : tab === "historico" ? (
          <History />
        ) : (
          <Tariff />
        )}
      </main>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
