"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { unstable_ViewTransition as ViewTransition } from "react";
import Globe from "@/components/Globe"

// Replace with your own Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [hideGlobe, setHideGlobe] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setHideGlobe(true), 1000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [135, -25], // Australia
      zoom: 2,
      antialias: true,
    });

    return () => map.remove();
  }, []);

  return (    
    <div className="relative w-screen h-screen">
    <div className={`${hideGlobe ? "opacity-0" : "opacity-100"} transition-opacity duration-500 absolute w-screen h-screen pointer-events-none`}>
    <ViewTransition name="globe-view">
        <Globe rotates={false}/>
    </ViewTransition>
    </div>
    <div
      ref={mapContainer}
      className="w-full h-full"
    />
  </div>
  );
}