"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface WigglyTextProps {
    text: string;
}

export default function WigglyText({ text = "hello" }: WigglyTextProps) {
    const [mouseX, setMouseX] = useState(0);
    const [mouseY, setMouseY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleMouseMove = (e: MouseEvent) => {
            setMouseX(e.clientX);
            setMouseY(e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const textArray = Array.from(text);

    return (
        <div ref={containerRef} style={{ display: "flex", gap: "0.1em" }}>
            {textArray.map((letter, i) => {
                const spanRef = useRef<HTMLSpanElement>(null);
                const [offset, setOffset] = useState({ x: 0, y: 0 });

                useEffect(() => {
                    if (!spanRef.current || typeof window === "undefined") return;

                    const rect = spanRef.current.getBoundingClientRect();
                    const dx = rect.x + rect.width / 2 - mouseX;
                    const dy = rect.y + rect.height / 2 - mouseY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    const repelRadius = 150;
                    const force = distance < repelRadius ? (repelRadius - distance) / repelRadius : 0;

                    setOffset({
                        x: force * dx,
                        y: force * dy,
                    });
                }, [mouseX, mouseY]);

                return (
                    <motion.span
                        key={i}
                        ref={spanRef}
                        style={{ display: "inline-block" }}
                        animate={{
                            x: offset.x,
                            y: offset.y,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                        }}
                    >
                        {letter}
                    </motion.span>
                );
            })}
        </div>
    );
}