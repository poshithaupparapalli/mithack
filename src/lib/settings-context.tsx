"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { ELDER_ID, INITIATOR_ID } from "@/lib/mock-data";
import type { ID } from "@/lib/types";

const STORAGE_KEY = "keepsake.settings.v1";

export interface SettingsState {
  /** The Long Lake switch. True = voice-first, no navigation, huge type. */
  isElderlyMode: boolean;
  /** Who we are acting as. Real auth replaces this; the shape stays. */
  currentUserId: ID;
  /** False until someone creates or joins a family. Gates the landing page. */
  hasJoined: boolean;
  /** Set once we've read localStorage, so we never render a wrong first paint. */
  hydrated: boolean;
}

const initialState: SettingsState = {
  isElderlyMode: false,
  currentUserId: INITIATOR_ID,
  hasJoined: false,
  hydrated: false,
};

type Action =
  | { type: "hydrate"; payload: Partial<SettingsState> }
  | { type: "setElderlyMode"; value: boolean }
  | { type: "setCurrentUser"; id: ID }
  | { type: "join"; elderly: boolean; userId: ID }
  | { type: "reset" };

function reducer(state: SettingsState, action: Action): SettingsState {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };
    case "setElderlyMode":
      return { ...state, isElderlyMode: action.value };
    case "setCurrentUser":
      return { ...state, currentUserId: action.id };
    case "join":
      return {
        ...state,
        hasJoined: true,
        isElderlyMode: action.elderly,
        currentUserId: action.userId,
      };
    case "reset":
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}

interface SettingsContextValue extends SettingsState {
  setElderlyMode: (value: boolean) => void;
  setCurrentUser: (id: ID) => void;
  join: (opts: { elderly: boolean; userId?: ID }) => void;
  reset: () => void;
  /** Flip between the two demo personas in one tap. */
  togglePersona: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      dispatch({ type: "hydrate", payload: raw ? JSON.parse(raw) : {} });
    } catch {
      dispatch({ type: "hydrate", payload: {} });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isElderlyMode: state.isElderlyMode,
          currentUserId: state.currentUserId,
          hasJoined: state.hasJoined,
        }),
      );
    } catch {
      /* private browsing — preferences just won't stick */
    }
  }, [state]);

  const setElderlyMode = useCallback((value: boolean) => {
    dispatch({ type: "setElderlyMode", value });
  }, []);

  const setCurrentUser = useCallback((id: ID) => {
    dispatch({ type: "setCurrentUser", id });
  }, []);

  const join = useCallback(({ elderly, userId }: { elderly: boolean; userId?: ID }) => {
    dispatch({
      type: "join",
      elderly,
      userId: userId ?? (elderly ? ELDER_ID : INITIATOR_ID),
    });
  }, []);

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  const togglePersona = useCallback(() => {
    const next = !state.isElderlyMode;
    dispatch({ type: "join", elderly: next, userId: next ? ELDER_ID : INITIATOR_ID });
  }, [state.isElderlyMode]);

  const value = useMemo<SettingsContextValue>(
    () => ({ ...state, setElderlyMode, setCurrentUser, join, reset, togglePersona }),
    [state, setElderlyMode, setCurrentUser, join, reset, togglePersona],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
