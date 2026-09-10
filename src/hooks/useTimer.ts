// src/hooks/useTimer.ts
// Ticks the run clock every second while status is 'active'.

import { useEffect, useRef } from 'react';
import { useRun } from '../context/RunContext';

const TICK_INTERVAL_MS = 1000;

export function useTimer(): void {
  const { state, dispatch } = useRun();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.status === 'active') {
      // Start ticking
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK', payload: TICK_INTERVAL_MS });
      }, TICK_INTERVAL_MS);
    } else {
      // Clear tick when paused / finished / idle
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.status, dispatch]);
}
