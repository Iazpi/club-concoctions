import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Attendee {
  id: string;
  name: string;
  socio: boolean;
}

export interface Consumption {
  id: string;
  attendeeId: string;
  productId: string;
  unitPrice: number; // price at moment of adding
  qty: number;
  ts: number;
}

export interface Event {
  id: string;
  name: string;
  date: string; // yyyy-mm-dd
  attendees: Attendee[];
  consumptions: Consumption[];
  splitCleaning: boolean;
  closed: boolean;
}

export interface State {
  events: Event[];
  activeEventId: string | null;
}

const ROW_ID = "main";
const LOCAL_KEY = "barro-app-v1";

const defaultState: State = { events: [], activeEventId: null };

let state: State = loadLocal();
const listeners = new Set<() => void>();

// Serialize remote writes to avoid clobbering
let writeChain: Promise<void> = Promise.resolve();
// Track our own last-written version so we can ignore our own realtime echoes
let lastPushedAt = 0;

function loadLocal(): State {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return defaultState;
    return JSON.parse(raw) as State;
  } catch {
    return defaultState;
  }
}

function saveLocal() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit(pushRemote = true) {
  saveLocal();
  listeners.forEach((l) => l());
  if (pushRemote) schedulePush();
}

function schedulePush() {
  const snapshot = state;
  const startedAt = Date.now();
  lastPushedAt = startedAt;
  writeChain = writeChain
    .then(async () => {
      // Only push the most recent snapshot; skip if a newer push has been queued
      if (startedAt !== lastPushedAt) return;
      const { error } = await supabase
        .from("shared_state")
        .upsert({ id: ROW_ID, state: snapshot as any, updated_at: new Date().toISOString() });
      if (error) console.error("[store] push error", error);
    })
    .catch((e) => console.error("[store] push chain error", e));
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getState() {
  return state;
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => sel(state),
    () => sel(defaultState),
  );
}

// ---- Cloud sync bootstrap ----
if (typeof window !== "undefined") {
  // Initial fetch
  void (async () => {
    const { data, error } = await supabase
      .from("shared_state")
      .select("state")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (error) {
      console.error("[store] initial fetch error", error);
      return;
    }
    if (data?.state) {
      state = data.state as unknown as State;
      emit(false);
    } else {
      // Row doesn't exist yet: push current local state
      schedulePush();
    }
  })();

  // Realtime subscription
  supabase
    .channel("shared_state_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "shared_state", filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const next = (payload.new as { state?: State } | null)?.state;
        if (!next) return;
        // Merge only if different from current state
        const nextStr = JSON.stringify(next);
        if (nextStr === JSON.stringify(state)) return;
        state = next;
        emit(false);
      },
    )
    .subscribe();
}

const uid = () => Math.random().toString(36).slice(2, 10);

// ---- Actions ----
export function createEvent(name: string, date: string) {
  const ev: Event = {
    id: uid(),
    name,
    date,
    attendees: [],
    consumptions: [],
    splitCleaning: false,
    closed: false,
  };
  state = { ...state, events: [ev, ...state.events], activeEventId: ev.id };
  emit();
  return ev.id;
}

export function setActiveEvent(id: string | null) {
  state = { ...state, activeEventId: id };
  emit();
}

export function deleteEvent(id: string) {
  state = {
    ...state,
    events: state.events.filter((e) => e.id !== id),
    activeEventId: state.activeEventId === id ? null : state.activeEventId,
  };
  emit();
}

function updateEvent(id: string, fn: (e: Event) => Event) {
  state = { ...state, events: state.events.map((e) => (e.id === id ? fn(e) : e)) };
  emit();
}

export function addAttendee(eventId: string, name: string, socio: boolean) {
  updateEvent(eventId, (e) => ({
    ...e,
    attendees: [...e.attendees, { id: uid(), name, socio }],
  }));
}

export function updateAttendee(eventId: string, attId: string, patch: Partial<Attendee>) {
  updateEvent(eventId, (e) => ({
    ...e,
    attendees: e.attendees.map((a) => (a.id === attId ? { ...a, ...patch } : a)),
  }));
}

export function removeAttendee(eventId: string, attId: string) {
  updateEvent(eventId, (e) => ({
    ...e,
    attendees: e.attendees.filter((a) => a.id !== attId),
    consumptions: e.consumptions.filter((c) => c.attendeeId !== attId),
  }));
}

export function addConsumption(
  eventId: string,
  attendeeId: string,
  productId: string,
  unitPrice: number,
  qty = 1,
) {
  updateEvent(eventId, (e) => ({
    ...e,
    consumptions: [
      ...e.consumptions,
      { id: uid(), attendeeId, productId, unitPrice, qty, ts: Date.now() },
    ],
  }));
}

export function updateConsumptionQty(eventId: string, consId: string, qty: number) {
  updateEvent(eventId, (e) => ({
    ...e,
    consumptions:
      qty <= 0
        ? e.consumptions.filter((c) => c.id !== consId)
        : e.consumptions.map((c) => (c.id === consId ? { ...c, qty } : c)),
  }));
}

export function removeConsumption(eventId: string, consId: string) {
  updateEvent(eventId, (e) => ({
    ...e,
    consumptions: e.consumptions.filter((c) => c.id !== consId),
  }));
}

export function setSplitCleaning(eventId: string, v: boolean) {
  updateEvent(eventId, (e) => ({ ...e, splitCleaning: v }));
}

export function setEventClosed(eventId: string, v: boolean) {
  updateEvent(eventId, (e) => ({ ...e, closed: v }));
}

export function renameEvent(eventId: string, name: string, date: string) {
  updateEvent(eventId, (e) => ({ ...e, name, date }));
}
