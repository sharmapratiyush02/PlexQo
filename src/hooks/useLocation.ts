// src/hooks/useLocation.ts
// Manages GPS permission and location subscription.
// Dispatches ADD_COORDS with Haversine delta to RunContext.

import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useRun } from '../context/RunContext';
import { haversineDistance } from '../utils/distance';
import type { Coord } from '../context/RunContext';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface UseLocationReturn {
  permissionStatus: PermissionStatus;
  gpsWeak: boolean;
  requestPermission: () => Promise<void>;
}

// Minimum accuracy threshold (metres). Points worse than this are discarded.
const MAX_ACCEPTABLE_ACCURACY_M = 50;
// Minimum distance to filter out GPS jitter (metres)
const MIN_DISTANCE_DELTA_M = 2;

export function useLocation(): UseLocationReturn {
  const { state, dispatch } = useRun();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [gpsWeak, setGpsWeak] = useState(false);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastCoordRef = useRef<Coord | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // ─── Request Permission ─────────────────────────────────────────────────────
  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setPermissionStatus(granted ? 'granted' : 'denied');
    dispatch({ type: 'SET_GPS', payload: granted });
  };

  // ─── Check permission on mount ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
        dispatch({ type: 'SET_GPS', payload: true });
      } else if (status === 'denied') {
        setPermissionStatus('denied');
        dispatch({ type: 'SET_GPS', payload: false });
      }
      // else: undetermined — wait for user to tap start
    })();
  }, []);

  // ─── Start / Stop GPS subscription based on run status ─────────────────────
  useEffect(() => {
    const shouldTrack = state.status === 'active' && permissionStatus === 'granted';

    if (shouldTrack && !subscriptionRef.current) {
      startTracking();
    } else if (!shouldTrack && subscriptionRef.current) {
      stopTracking();
    }

    return () => {
      // Cleanup on unmount
      stopTracking();
    };
  }, [state.status, permissionStatus]);

  const startTracking = async () => {
    try {
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,      // metres — reduces noisy updates
          timeInterval: 2000,        // ms — at most one update every 2s
        },
        (location) => {
          const { latitude, longitude, accuracy } = location.coords;
          const now = Date.now();

          // Discard inaccurate points
          if (accuracy !== null && accuracy > MAX_ACCEPTABLE_ACCURACY_M) {
            setGpsWeak(true);
            return;
          }

          setGpsWeak(false);
          lastUpdateRef.current = now;

          const newCoord: Coord = { lat: latitude, lng: longitude };

          // Calculate delta from last point
          let deltaMeters = 0;
          if (lastCoordRef.current) {
            deltaMeters = haversineDistance(
              lastCoordRef.current.lat,
              lastCoordRef.current.lng,
              newCoord.lat,
              newCoord.lng
            );
          }

          // Ignore jitter below threshold
          if (deltaMeters < MIN_DISTANCE_DELTA_M && lastCoordRef.current !== null) {
            return;
          }

          lastCoordRef.current = newCoord;
          dispatch({
            type: 'ADD_COORDS',
            payload: { coord: newCoord, deltaMeters },
          });
        }
      );
    } catch (err) {
      console.warn('useLocation: failed to start tracking', err);
      setGpsWeak(true);
    }
  };

  const stopTracking = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    lastCoordRef.current = null;
  };

  // Detect GPS signal loss: if active but no update in 8s, flag as weak
  useEffect(() => {
    if (state.status !== 'active') {
      setGpsWeak(false);
      return;
    }
    const lossTimer = setInterval(() => {
      if (Date.now() - lastUpdateRef.current > 8000 && lastUpdateRef.current > 0) {
        setGpsWeak(true);
      }
    }, 4000);
    return () => clearInterval(lossTimer);
  }, [state.status]);

  return { permissionStatus, gpsWeak, requestPermission };
}
