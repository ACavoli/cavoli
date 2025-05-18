"use client"

import { useEffect, useRef, useState } from 'react'
// import WigglyText from './WigglyText'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX + window.scrollX,
        y: e.clientY + window.scrollY
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Particle system
    const particles: Particle[] = []
    const particleCount = 500

    class Particle {
      x: number = 0
      y: number = 0
      size: number = 0
      speedX: number = 0
      speedY: number = 0
      color: string = ''
      baseSpeed: number = 0

      constructor() {
        if (!canvas) return
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 5 + 1
        this.baseSpeed = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * this.baseSpeed
        this.speedY = (Math.random() - 0.5) * this.baseSpeed
        this.color = `rgb(255, 255, 255)`
      }

      update() {
        if (!canvas) return

        // Calculate distance from mouse
        const dx = mouseRef.current.x - this.x
        const dy = mouseRef.current.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = 150 // Maximum distance for interaction

        if (distance < maxDistance) {
          // Calculate force based on distance
          const force = (maxDistance - distance) / maxDistance
          const angle = Math.atan2(dy, dx)
          
          // Apply repulsion force
          this.speedX -= Math.cos(angle) * force * 0.15
          this.speedY -= Math.sin(angle) * force * 0.15
        }

        // Apply speed limits
        const maxSpeed = this.baseSpeed * 1.5
        const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY)
        if (currentSpeed > maxSpeed) {
          this.speedX = (this.speedX / currentSpeed) * maxSpeed
          this.speedY = (this.speedY / currentSpeed) * maxSpeed
        }

        // Update position
        this.x += this.speedX
        this.y += this.speedY

        // Wrap around screen edges
        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height

        // Gradually return to base speed
        // this.speedX *= 0.99
        // this.speedY *= 0.995
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.strokeStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        // ctx.fill()
        ctx.stroke()
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return
      ctx.fillStyle = 'rgba(0, 0, 0, 1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Scroll listener for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll)
    // Set initial value in case not zero
    setScrollY(window.scrollY)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <h1
          className="text-9xl font-bold text-white tracking-wider animate-fade-in"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
            willChange: 'transform',
          }}
        >
            SAMPLE TEXT
        </h1>
      </div>
      <div className="absolute top-0 w-full h-1/6 mask-to-t backdrop-blur-md"></div>
      <div className="absolute bottom-0 w-full h-1/6 mask-to-b backdrop-blur-md"></div>
    </div>
  )
}
