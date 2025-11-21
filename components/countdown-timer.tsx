"use client"

import { useEffect, useState, useMemo, useCallback, memo } from "react"
import { useTranslation } from "@/lib/translations"

interface CountdownTimerProps {
  targetDate: Date
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const CountdownTimer = memo(function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const t = useTranslation()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Memoize target timestamp to avoid recalculation
  const targetTimestamp = useMemo(() => targetDate.getTime(), [targetDate])

  // Optimize calculation with useCallback
  const calculateTimeLeft = useCallback(() => {
    const difference = targetTimestamp - Date.now()

    if (difference > 0) {
      const newTimeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
      
      // Only update if values actually changed to prevent unnecessary re-renders
      setTimeLeft(prev => {
        if (prev.days !== newTimeLeft.days || 
            prev.hours !== newTimeLeft.hours || 
            prev.minutes !== newTimeLeft.minutes || 
            prev.seconds !== newTimeLeft.seconds) {
          return newTimeLeft
        }
        return prev
      })
    }
  }, [targetTimestamp])

  useEffect(() => {
    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [calculateTimeLeft])

  // Memoize time units array to prevent recreation on every render
  const timeUnits = useMemo(() => [
    { key: 'days', value: timeLeft.days },
    { key: 'hours', value: timeLeft.hours },
    { key: 'minutes', value: timeLeft.minutes },
    { key: 'seconds', value: timeLeft.seconds },
  ], [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {timeUnits.map((unit, index) => (
        <div
          key={unit.key}
          className="group relative"
          style={{
            animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
          }}
        >
          <div className="relative flex flex-col items-center justify-center p-6 md:p-8 bg-card/80 backdrop-blur-sm border-2 border-accent/20 rounded-2xl shadow-lg hover:shadow-2xl hover:border-accent/40 transition-all duration-300 hover:-translate-y-1" style={{ willChange: 'transform' }}>
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-accent/30 rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-accent/30 rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-accent/30 rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-accent/30 rounded-br-lg" />

            <div className="text-5xl md:text-6xl lg:text-7xl font-serif text-accent font-light tracking-tight" style={{ willChange: 'contents' }}>
              {unit.value.toString().padStart(2, "0")}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground mt-3 uppercase tracking-widest font-light">
              {t(unit.key as any)}
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
})

export default CountdownTimer