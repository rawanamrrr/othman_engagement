"use client"

import { useEffect, useRef, useState } from "react"

interface VideoIntroProps {
  onComplete: () => void
  onSkip: () => void
}

export default function VideoIntro({ onComplete, onSkip }: VideoIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasStarted, setHasStarted] = useState(false)

  // Initialize video immediately
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set video attributes for optimal loading and playback
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.defaultMuted = true
    video.setAttribute('muted', 'muted')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('x5-playsinline', 'true')
    video.setAttribute('x5-video-player-type', 'h5')
    video.setAttribute('x5-video-player-fullscreen', 'false')
    video.setAttribute('x5-video-orientation', 'portrait')
    video.setAttribute('preload', 'auto')
    
    // Try to start playback immediately
    const playVideo = async () => {
      try {
        video.currentTime = 0
        await video.play()
        setHasStarted(true)
      } catch (error) {
        console.log('Initial play attempt failed, retrying...', error)
        // If first attempt fails, try with a small delay
        setTimeout(() => {
          video.play().catch(e => {
            console.error('Secondary play attempt failed:', e)
            // If still failing, skip to next section
            onComplete()
          })
        }, 300)
      }
    }

    // Start playback when metadata is loaded
    const onLoaded = () => {
      playVideo().catch(console.error)
    }

    // Add event listeners
    video.addEventListener('loadedmetadata', onLoaded, { once: true })
    video.addEventListener('ended', onComplete, { once: true })
    
    // Start loading
    video.load()
    
    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('ended', onComplete)
      if (!video.paused) video.pause()
    }
  }, [onComplete])

  // Handle click to skip
  const handleClick = () => {
    onSkip()
  }

  return (
    <div 
      className="fixed inset-0 bg-black z-50"
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted
        autoPlay
        preload="auto"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: 'black',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        <source 
          src="/engagement-video.mp4" 
          type="video/mp4"
        />
      </video>
    </div>
  )
}
