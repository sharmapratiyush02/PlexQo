// src/context/RunContext.tsx
// Central state machine for all run state. Uses useReducer + Context.

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RunStatus = 'idle' | 'active' | 'paused' | 'finished';

export interface Coord {
  lat: number;
  lng: number;
}

export interface RunState {
  status: RunStatus;
  startTime: number | null;    // epoch ms when run started
  elapsedMs: number;           // accumulated active time in ms (pauses excluded)
  distanceMeters: number;      // total metres covered
  coords: Coord[];             // GPS breadcrumb trail
  pausedAt: number | null;     // epoch ms when last paused
  gpsAvailable: boolean;       // false when location permission denied or signal lost
  pauseCount: number;          // how many times the run was paused
}

type RunAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK'; payload: number }          // ms to add
  | { type: 'ADD_COORDS'; payload: { coord: Coord; deltaMeters: number } }
  | { type: 'FINISH' }
  | { type: 'RESET' }
  | { type: 'SET_GPS'; payload: boolean };

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState: RunState = {
  status: 'idle',
  startTime: null,
  elapsedMs: 0,
  distanceMeters: 0,
  coords: [],
  pausedAt: null,
  gpsAvailable: true,
  pauseCount: 0,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function runReducer(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        status: 'active',
        startTime: Date.now(),
        gpsAvailable: state.gpsAvailable,
      };

    case 'PAUSE':
      if (state.status !== 'active') return state;
      return {
        ...state,
        status: 'paused',
        pausedAt: Date.now(),
        pauseCount: state.pauseCount + 1,
      };

    case 'RESUME':
      if (state.status !== 'paused') return state;
      return {
        ...state,
        status: 'active',
        pausedAt: null,
      };

    case 'TICK':
      if (state.status !== 'active') return state;
      return {
        ...state,
        elapsedMs: state.elapsedMs + action.payload,
      };

    case 'ADD_COORDS':
      if (state.status !== 'active') return state;
      return {
        ...state,
        coords: [...state.coords, action.payload.coord],
        distanceMeters: state.distanceMeters + action.payload.deltaMeters,
      };

    case 'FINISH':
      if (state.status === 'idle' || state.status === 'finished') return state;
      return {
        ...state,
        status: 'finished',
        pausedAt: null,
      };

    case 'RESET':
      return { ...initialState };

    case 'SET_GPS':
      return { ...state, gpsAvailable: action.payload };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface RunContextValue {
  state: RunState;
  dispatch: React.Dispatch<RunAction>;
  // Convenience action creators
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  finishRun: () => void;
  resetRun: () => void;
}

const RunContext = createContext<RunContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RunProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(runReducer, initialState);

  const startRun = useCallback(() => dispatch({ type: 'START' }), []);
  const pauseRun = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const resumeRun = useCallback(() => dispatch({ type: 'RESUME' }), []);
  const finishRun = useCallback(() => dispatch({ type: 'FINISH' }), []);
  const resetRun = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <RunContext.Provider
      value={{ state, dispatch, startRun, pauseRun, resumeRun, finishRun, resetRun }}
    >
      {children}
    </RunContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRun(): RunContextValue {
  const ctx = useContext(RunContext);
  if (!ctx) {
    throw new Error('useRun must be used within a RunProvider');
  }
  return ctx;
}
