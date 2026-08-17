import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS, setActiveProducts, type Category, type Product } from "@/lib/catalog";


export interface Attendee {
  id: string;
  name: string;
  socio: boolean;
  paid?: boolean;
}

export interface Consumption {
  id: string;
  attendeeId: string;
  productId: string;
  unitPrice: number; // price at moment of adding
  qty: number;
  ts: number;
  shared?: boolean; // true when the cost is split among several attendees
  groupId?: string; // links all parts of the same shared item
}


export interface Event {
  id: string;
  name: string;
  date: string; // yyyy-mm-dd
  attendees: Attendee[];
  consumptions: Consumption[];
  splitCleaning: boolean;
  closed: boolean;
  applyServiceFee?: boolean;
}

export interface State {
  events: Event[];
  activeEventId: string | null;
  products?: Product[];
}

const ROW_ID = "main";
const LOCAL_KEY = "barro-app-v1";

const defaultState: State = { events: [], activeEventId: null };

let state: State = loadLocal();
setActiveProducts(state.products ?? PRODUCTS);
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
  setActiveProducts(state.products ?? PRODUCTS);
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
export function createEvent(name: string, date: string, applyServiceFee = false) {
  const ev: Event = {
    id: uid(),
    name,
    date,
    attendees: [],
    consumptions: [],
    splitCleaning: false,
    closed: false,
    applyServiceFee,
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
  shared = false,
  groupId?: string,
) {
  updateEvent(eventId, (e) => ({
    ...e,
    consumptions: [
      ...e.consumptions,
      { id: uid(), attendeeId, productId, unitPrice, qty, ts: Date.now(), shared, groupId },
    ],
  }));
}

// Adds a shared item splitting the total price among the given attendees
export function addSharedConsumption(
  eventId: string,
  attendeeIds: string[],
  productId: string,
  totalPrice: number,
) {
  const gid = uid();
  const isSplit = attendeeIds.length > 1;
  const per = totalPrice / attendeeIds.length;
  updateEvent(eventId, (e) => ({
    ...e,
    consumptions: [
      ...e.consumptions,
      ...attendeeIds.map((attendeeId) => ({
        id: uid(),
        attendeeId,
        productId,
        unitPrice: per,
        qty: 1,
        ts: Date.now(),
        shared: isSplit,
        groupId: isSplit ? gid : undefined,
      })),
    ],
  }));
}

// Removes every part of a shared item (all attendees involved)
export function removeSharedGroup(eventId: string, consId: string) {
  updateEvent(eventId, (e) => {
    const target = e.consumptions.find((c) => c.id === consId);
    if (!target) return e;
    if (target.groupId) {
      return { ...e, consumptions: e.consumptions.filter((c) => c.groupId !== target.groupId) };
    }
    // Legacy data without groupId: match same product, price and near timestamp
    return {
      ...e,
      consumptions: e.consumptions.filter(
        (c) =>
          !(
            c.productId === target.productId &&
            Math.abs(c.unitPrice - target.unitPrice) < 0.005 &&
            Math.abs(c.ts - target.ts) < 5000
          ),
      ),
    };
  });
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

// ---- Productos (tarifa editable, compartida en la nube) ----
export function useProducts(): Product[] {
  return useStore((s) => s.products ?? PRODUCTS);
}

function setProducts(list: Product[]) {
  state = { ...state, products: list };
  emit();
}

export function updateProduct(id: string, patch: Partial<Product>) {
  const list = (state.products ?? PRODUCTS).map((p) =>
    p.id === id ? { ...p, ...patch } : p,
  );
  setProducts(list);
}

export function addProduct(category: Category) {
  const list = state.products ?? PRODUCTS;
  const nuevo: Product = {
    id: `custom-${uid()}`,
    name: "Nuevo ítem",
    category,
    socio: 0,
    noSocio: 0,
  };
  // Insert right after the last item of the same category
  const idx = list.map((p) => p.category).lastIndexOf(category);
  const next = [...list];
  next.splice(idx >= 0 ? idx + 1 : next.length, 0, nuevo);
  setProducts(next);
  return nuevo.id;
}

export function deleteProduct(id: string) {
  setProducts((state.products ?? PRODUCTS).filter((p) => p.id !== id));
}

export function resetProducts() {
  setProducts(PRODUCTS);
}
