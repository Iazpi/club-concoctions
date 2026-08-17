import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, setActiveEvent } from "@/lib/store";
import { EventList } from "@/components/EventList";
import { EventView } from "@/components/EventView";
import { History } from "@/components/History";
import { Tariff } from "@/components/Tariff";
import { MvpMonth } from "@/components/MvpMonth";
import { Reservations } from "@/components/Reservations";
import { ArrowLeft, History as HistoryIcon, ListOrdered, Trophy, RefreshCw, CalendarCheck } from "lucide-react";

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

type Tab = "eventos" | "historico" | "mvp" | "tarifa" | "reservas";

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
    >
      {/* Left glass */}
      <path d="M4 21 L8 21" />
      <path d="M6 21 L7 15" />
      <path d="M7 15 C11 13, 12 9, 10 5" />
      <path d="M10 5 L7 4" />
      <path d="M7 4 C5 8, 5 12, 7 15" />

      {/* Right glass */}
      <path d="M16 21 L20 21" />
      <path d="M18 21 L17 15" />
      <path d="M17 15 C13 13, 12 9, 14 5" />
      <path d="M14 5 L17 4" />
      <path d="M17 4 C19 8, 19 12, 17 15" />

      {/* Splash */}
      <path d="M12 3 L10 1" />
      <path d="M12 3 L14 1" />
      <path d="M12 3 L12 1" />
      <circle cx="10" cy="2" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

const APPS: { id: Tab; label: string; icon: React.ReactNode; subtitle: string; tone: string }[] = [
  {
    id: "eventos",
    label: "EVENTOS",
    subtitle: "Comidas y actos",
    icon: <ToastingGlasses className="w-14 h-14" />,
    tone: "bg-primary text-primary-foreground",
  },
  {
    id: "historico",
    label: "HISTÓRICO",
    subtitle: "Consumo mensual",
    icon: <HistoryIcon className="w-14 h-14" />,
    tone: "bg-socio text-socio-foreground",
  },
  {
    id: "mvp",
    label: "MVP DEL MES",
    subtitle: "Clasificación",
    icon: <Trophy className="w-14 h-14" />,
    tone: "bg-accent text-accent-foreground",
  },
  {
    id: "reservas",
    label: "RESERVAS",
    subtitle: "Local para eventos privados",
    icon: <CalendarCheck className="w-14 h-14" />,
    tone: "bg-destructive text-destructive-foreground",
  },
  {
    id: "tarifa",
    label: "TARIFA",
    subtitle: "Lista de precios",
    icon: <ListOrdered className="w-14 h-14" />,
    tone: "bg-info text-info-foreground",
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
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">
              {event ? event.name : current ? current.label : "Barro CB"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {event ? "Cuenta del evento" : current ? current.subtitle : "Gestión de consumiciones"}
            </p>
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
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl font-bold">Barro CB</h2>
        <p className="text-sm text-muted-foreground mt-1">Elige una sección</p>
      </div>
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

