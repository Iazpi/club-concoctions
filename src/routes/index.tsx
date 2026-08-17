import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, setActiveEvent } from "@/lib/store";
import { EventList } from "@/components/EventList";
import { EventView } from "@/components/EventView";
import { History } from "@/components/History";
import { Tariff } from "@/components/Tariff";
import { MvpMonth } from "@/components/MvpMonth";
import { Reservations } from "@/components/Reservations";
import { Shopping } from "@/components/Shopping";
import { ArrowLeft, History as HistoryIcon, ListOrdered, Trophy, RefreshCw, CalendarCheck, ShoppingCart } from "lucide-react";

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
        content: "App para llevar la cuenta de asistentes y consumiciones en los eventos de Barro CB.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

type Tab = "eventos" | "historico" | "mvp" | "tarifa" | "reservas" | "compra";

function ToastingGlasses({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g transform="rotate(10 8.2 11.5)">
        <path d="M4.4 3.8h7.2l-.6 4.1a3.1 3.1 0 0 1-3.1 2.7 3.1 3.1 0 0 1-3-2.7Z" />
        <path d="M5 7.2c1.7-.1 3.8.8 5.8.1" />
        <path d="M7.9 10.6v7.3" />
        <path d="M5.3 17.9h5.2" />
      </g>
      <g transform="rotate(-10 15.8 11.5)">
        <path d="M12.4 3.8h7.2l-.5 4.1a3.1 3.1 0 0 1-3.1 2.7 3.1 3.1 0 0 1-3.1-2.7Z" />
        <path d="M13.2 7.3c2 .7 4.1-.2 5.8-.1" />
        <path d="M16.1 10.6v7.3" />
        <path d="M13.5 17.9h5.2" />
      </g>
    </svg>
  );
}

const APPS: { id: Tab; label: string; icon: React.ReactNode; subtitle: string }[] = [
  {
    id: "eventos",
    label: "EVENTOS",
    subtitle: "Comidas y actos",
    icon: <ToastingGlasses className="w-12 h-12" />,
  },
  {
    id: "historico",
    label: "HISTÓRICO",
    subtitle: "Consumo mensual",
    icon: <HistoryIcon className="w-12 h-12" strokeWidth={1.5} />,
  },
  {
    id: "mvp",
    label: "MVP DEL MES",
    subtitle: "Clasificación",
    icon: <Trophy className="w-12 h-12" strokeWidth={1.5} />,
  },
  {
    id: "reservas",
    label: "RESERVAS",
    subtitle: "Local para eventos privados",
    icon: <CalendarCheck className="w-12 h-12" strokeWidth={1.5} />,
  },
  {
    id: "compra",
    label: "LISTA DE LA COMPRA",
    subtitle: "Qué falta en el local",
    icon: <ShoppingCart className="w-12 h-12" strokeWidth={1.5} />,
  },
  {
    id: "tarifa",
    label: "TARIFA",
    subtitle: "Lista de precios",
    icon: <ListOrdered className="w-12 h-12" strokeWidth={1.5} />,
  },
];

function Index() {
  const [tab, setTab] = useState<Tab | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const event = useStore((s) =>
    openId ? s.events.find((e) => e.id === openId) ?? null : null,
  );

  const current = APPS.find((a) => a.id === tab);

  const goBack = () => {
    if (event) {
      setOpenId(null);
      setActiveEvent(null);
    } else {
      setTab(null);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {event || tab ? (
            <button className="btn-ghost !p-2" onClick={goBack} aria-label="Volver">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-bold">
              B
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h1 className={`font-bold truncate ${event || current ? "text-lg" : "text-2xl"}`}>
              {event ? event.name : current ? current.label : "Barro CB"}
            </h1>
            {(event || current) && (
              <p className="text-xs text-muted-foreground">
                {event ? "Cuenta del evento" : current!.subtitle}
              </p>
            )}
          </div>

          <button
            className="btn-ghost !p-2 text-info hover:bg-white/40"
            onClick={() => window.location.reload()}
            title="Recargar aplicación"
            aria-label="Recargar aplicación"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-16">
        {event ? (
          <EventView event={event} />
        ) : tab === "eventos" ? (
          <EventList onOpen={(id) => setOpenId(id)} />
        ) : tab === "historico" ? (
          <History />
        ) : tab === "mvp" ? (
          <MvpMonth />
        ) : tab === "tarifa" ? (
          <Tariff />
        ) : tab === "reservas" ? (
          <Reservations />
        ) : tab === "compra" ? (
          <Shopping />
        ) : (
          <Launcher onOpen={setTab} />
        )}
      </main>
    </div>
  );
}

function Launcher({ onOpen }: { onOpen: (t: Tab) => void }) {
  return (
    <div className="py-6">
      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">

        {APPS.map((a) => (
          <button
            key={a.id}
            onClick={() => onOpen(a.id)}
            className="group flex flex-col items-center gap-3 focus:outline-none"
          >
            <span
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl grid place-items-center shadow-md transition-transform group-hover:scale-105 group-active:scale-95 ${a.tone}`}
            >
              {a.icon}
            </span>
            <span className="text-sm sm:text-base font-bold tracking-wide text-center drop-shadow-sm">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

