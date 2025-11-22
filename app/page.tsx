"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"

// Dynamically import the VideoIntro component with no SSR
const VideoIntro = dynamic(() => import("@/components/video-intro"), {
  ssr: false,
  loading: () => null,
})

// Dynamically import the main content with no SSR
const ProAnimatedEngagementPage = dynamic(
  () => import("@/components/pro-animated-engagement-page"),
  { ssr: false }
)

export default function Home() {
  const [showMain, setShowMain] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isVideoSkipped, setIsVideoSkipped] = useState(false)
  const [introFinished, setIntroFinished] = useState(false)

  // Preload the main image in the background
  useEffect(() => {
    const img = new Image()
    img.src = '/invitation-design.png'
    img.onload = () => setIsImageLoaded(true)
    return () => { img.onload = null }
  }, [])

  const handleVideoComplete = useCallback(() => {
    setIntroFinished(true)
    setShowMain(true)
  }, [])

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true)
  }, [])

  const handleSkipVideo = useCallback(() => {
    setIsVideoSkipped(true)
    setShowMain(true)
  }, [])

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Video Intro - Always render but hide when main content is shown */}
      <div className={`fixed inset-0 z-10 ${showMain ? 'hidden' : 'block'}`}>
        <VideoIntro 
          onComplete={handleVideoComplete} 
          onSkip={handleSkipVideo}
        />
      </div>
      
      {/* Main Content */}
      <div className={showMain ? 'block' : 'hidden'}>
        <ProAnimatedEngagementPage 
          onImageLoad={handleImageLoad} 
          playGifTrigger={introFinished} 
        />
      </div>
    </main>
  )
}