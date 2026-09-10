// src/components/RouteMap.tsx
// MapView with dark styling, neon-green polyline, and START / FINISH markers.

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import type { Coord } from '../context/RunContext';

// Dark map style — mutes all colors so the neon route pops
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1e24' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

interface RouteMapProps {
  coords: Coord[];
  /** Style override — primarily used to set height/flex */
  style?: object;
  /** Polyline color — defaults to neon green */
  polylineColor?: string;
  /** Show the RE-CENTER button at bottom-right of map */
  showReCenter?: boolean;
  /** Show START and FINISH label markers (summary screen) */
  showMarkerLabels?: boolean;
  onReCenter?: () => void;
  /** Optional ghost run route — rendered as a semi-transparent amber polyline */
  ghostCoords?: Coord[];
}

export function RouteMap({
  coords,
  style,
  polylineColor = '#4ADE80',
  showReCenter = false,
  showMarkerLabels = false,
  onReCenter,
  ghostCoords,
}: RouteMapProps) {
  const mapRef = useRef<MapView>(null);

  // Fit map to route when coords change
  useEffect(() => {
    if (coords.length >= 2 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        coords.map((c) => ({ latitude: c.lat, longitude: c.lng })),
        {
          edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
          animated: true,
        }
      );
    }
  }, [coords.length]);

  if (coords.length === 0) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderIcon}>📍</Text>
        <Text style={styles.placeholderLabel}>Waiting for GPS…</Text>
      </View>
    );
  }

  const startCoord = coords[0];
  const endCoord = coords[coords.length - 1];
  const initialRegion = {
    latitude: startCoord.lat,
    longitude: startCoord.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const polylineCoords = coords.map((c) => ({
    latitude: c.lat,
    longitude: c.lng,
  }));

  return (
    <View style={[styles.mapWrapper, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={DARK_MAP_STYLE}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
      >
        {/* Ghost run polyline (amber, under the main route) */}
        {ghostCoords && ghostCoords.length >= 2 && (
          <Polyline
            coordinates={ghostCoords.map(c => ({ latitude: c.lat, longitude: c.lng }))}
            strokeColor="rgba(245, 166, 35, 0.55)"
            strokeWidth={3}
            lineJoin="round"
          />
        )}

        {/* Route polyline */}
        <Polyline
          coordinates={polylineCoords}
          strokeColor={polylineColor}
          strokeWidth={4}
          lineJoin="round"
        />

        {/* Start marker */}
        <Marker
          coordinate={{ latitude: startCoord.lat, longitude: startCoord.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          {showMarkerLabels ? (
            <View style={styles.startLabel}>
              <Text style={styles.startLabelText}>START</Text>
            </View>
          ) : (
            <View style={styles.startDot} />
          )}
        </Marker>

        {/* End / Finish marker */}
        {coords.length > 1 && (
          <Marker
            coordinate={{ latitude: endCoord.lat, longitude: endCoord.lng }}
            anchor={{ x: 0.5, y: 1 }}
          >
            {showMarkerLabels ? (
              <View style={styles.finishLabel}>
                <Text style={styles.finishLabelText}>🏁 FINISH</Text>
              </View>
            ) : (
              <View style={styles.endDot} />
            )}
          </Marker>
        )}
      </MapView>

      {/* RE-CENTER button */}
      {showReCenter && (
        <TouchableOpacity
          style={styles.reCenterBtn}
          onPress={onReCenter}
          activeOpacity={0.8}
        >
          <Text style={styles.reCenterText}>▲ RE-CENTER</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrapper: {
    overflow: 'hidden',
    borderRadius: 0,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#1A1E24',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderIcon: {
    fontSize: 36,
  },
  placeholderLabel: {
    color: '#8A8A9A',
    fontSize: 14,
    fontWeight: '500',
  },
  startDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ADE80',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  endDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#4ADE80',
  },
  startLabel: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  startLabelText: {
    color: '#111418',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  finishLabel: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  finishLabelText: {
    color: '#111418',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reCenterBtn: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(17, 20, 24, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A3D45',
  },
  reCenterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
