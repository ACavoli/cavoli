"use client";
import { geoOrthographic, geoPath, geoGraticule } from 'd3';
import { geojson } from './geojsonOutline';
import { useEffect, useRef, useState } from "react";

const projection = geoOrthographic();
const path = geoPath(projection);
const graticule = geoGraticule();

const WorldMap = () => {
  const [rotation, setRotation] = useState<[number, number]>([0, -30]);
  const requestRef = useRef<number>(0);
  const containerRef = useRef<SVGSVGElement | null>(null);
  const [viewBox, setViewBox] = useState("0 0 800 600");
  const [hovering, setHovering] = useState(false);
  const targetRotationRef = useRef<[number, number]>(rotation);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setViewBox(`0 0 ${width} ${height}`);
        projection
          .translate([width / 2, height / 2])
          .scale(Math.min(width, height) / 2.2);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  /*
  useEffect(() => {
    const animate = () => {
      setRotation(([lambda, phi]) => [lambda + (hovering ? 0.3 : 0.6), phi]);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [hovering]);
  */

  useEffect(() => {
    if (hovering) {
      targetRotationRef.current = [-135, 25];
    }

    const animate = () => {
      setRotation(([lambda, phi]) => {
        const [targetLambda, targetPhi] = hovering ? targetRotationRef.current : [lambda + 0.6, phi - (30 + phi)/50];
        const newLambda = lambda + (targetLambda - lambda) * 0.1;
        const newPhi = phi + (targetPhi - phi) * 0.1;
        return [newLambda, newPhi];
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [hovering]);

  projection.rotate(rotation);

  return (
    <svg
      className="group-hover:invert-100 transition-all duration-300"
      ref={containerRef}
      viewBox={viewBox}
      style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {(() => {
        const d = path({ type: 'Sphere' });
        return d ? <path className="sphere" d={d} fill="#000" stroke="#fff" strokeWidth={1} /> : null;
      })()}
      {(() => {
        const d = path(graticule());
        return d ? <path className="graticule" d={d} stroke="none" fill="none" /> : null;
      })()}
      {geojson.features.map((feature, idx) => {
        const d = path(feature as GeoJSON.Feature);
        return d ? <path key={idx} className="feature" d={d} fill="#000" stroke="#fff" strokeWidth={0.8} /> : null;
      })}
    </svg>
  );
};

export default WorldMap;