"use client"

import { useEffect, useRef, useState } from "react"
import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"

interface RectangleEffectProps {
  disabled?: boolean;
  box1: React.ReactElement;
  box2: React.ReactElement;
  box3: React.ReactElement;
  box4: React.ReactElement;
}

export default function RectangleEffect({
  disabled = false,
  box1,
  box2,
  box3,
  box4
}: RectangleEffectProps) {
  const targetX = useRef(0.5)
  const targetY = useRef(0.5)
  const animatedX = useRef(0.5)
  const animatedY = useRef(0.5)
  const boxRef = useRef(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetX.current = (e.clientX) / window.innerWidth
      if (e.clientY + window.scrollY > window.innerHeight) {
        targetY.current = (e.clientY) / window.innerHeight
      }
    }

    const animate = () => {
      animatedX.current += (targetX.current - animatedX.current) * 0.1
      animatedY.current += (targetY.current - animatedY.current) * 0.1
      setTick(t => t + 1)
      requestAnimationFrame(animate)
    }

    window.addEventListener("mousemove", handleMouseMove)
    animate()

    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const leftWidth = 0.5 + (0.3 * (0.5 - animatedX.current) * 2)
  const rightWidth = 1 - leftWidth
  const topHeight = 0.5 + (0.3 * (0.5 - animatedY.current) * 2)
  const bottomHeight = 1 - topHeight

  const classes = "relative hover:bg-white hover:text-black transition-colors"

  return (
    <div className="flex flex-wrap w-screen h-screen" ref={boxRef}>
      {/* <div className="r top-0 w-full h-1/6 mask-to-t backdrop-blur-md z-10"></div> */}
      <div
        className={classes + "border-white border-r border-b transition-colors"}
        style={{ top: 0, left: 0, width: `${leftWidth * 100}%`, height: `${topHeight * 100}%` }}
      >
      {box1}
      </div>
      <div
        className={classes + "border-white border-l border-b transition-colors"}
        style={{ top: 0, right: 0, width: `${rightWidth * 100}%`, height: `${topHeight * 100}%` }}
      />
      <div
        className={classes + "border-white border-r border-t transition-colors"}
        style={{ bottom: 0, left: 0, width: `${leftWidth * 100}%`, height: `${bottomHeight * 100}%` }}
      />
      <div
        className={classes + "border-white border-l border-t transition-colors"}
        style={{ bottom: 0, right: 0, width: `${rightWidth * 100}%`, height: `${bottomHeight * 100}%` }}
      />
    </div>
  )
}