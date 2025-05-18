// "use client";

// import { useEffect, useRef, useState } from "react";
// import { motion } from "framer-motion";

// interface WigglyTextProps {
//     text: string;
// }

// export default function WigglyText({ text = "hello" }: WigglyTextProps) {
//     const [mouseX, setMouseX] = useState(0);
//     const [mouseY, setMouseY] = useState(0);
//     const containerRef = useRef<HTMLDivElement>(null);

//     useEffect(() => {
//         if (typeof window === "undefined") return;

//         const handleMouseMove = (e: MouseEvent) => {
//             setMouseX(e.clientX);
//             setMouseY(e.clientY);
//         };

//         window.addEventListener("mousemove", handleMouseMove);
//         return () => window.removeEventListener("mousemove", handleMouseMove);
//     }, []);

//     const textArray = Array.from(text);

//     // Setup refs and offsets for each letter
//     const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
//     const [offsets, setOffsets] = useState(() =>
//         textArray.map(() => ({ x: 0, y: 0 }))
//     );

//     useEffect(() => {
//         if (typeof window === "undefined") return;

//         const updateOffsets = () => {
//             const newOffsets = textArray.map((_, i) => {
//                 const el = spanRefs.current[i];
//                 if (!el) return { x: 0, y: 0 };

//                 const rect = el.getBoundingClientRect();
//                 const dx = rect.x + rect.width / 2 - mouseX;
//                 const dy = rect.y + rect.height / 2 - mouseY;
//                 const distance = Math.sqrt(dx * dx + dy * dy);

//                 const repelRadius = 150;
//                 const force = distance < repelRadius ? (repelRadius - distance) / repelRadius : 0;

//                 return {
//                     x: force * dx,
//                     y: force * dy,
//                 };
//             });
//             setOffsets(newOffsets);
//         };

//         updateOffsets();
//     }, [mouseX, mouseY, textArray]);

//     return (
//         <div ref={containerRef} style={{ display: "flex", gap: "0.1em" }}>
//             {textArray.map((letter, i) => (
//                 <motion.span
//                     key={i}
//                     ref={(el) => {
//                         spanRefs.current[i] = el;
//                     }}
//                     style={{ display: "inline-block" }}
//                     animate={{
//                         x: offsets[i]?.x || 0,
//                         y: offsets[i]?.y || 0,
//                     }}
//                     transition={{
//                         type: "spring",
//                         stiffness: 300,
//                         damping: 20,
//                     }}
//                 >
//                     {letter}
//                 </motion.span>
//             ))}
//         </div>
//     );
// }