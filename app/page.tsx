"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"


// Dynamically import the VideoIntro component with no SSR to prevent hydration issues
const VideoIntro = dynamic(() => import("@/components/video-intro"), {
  ssr: false,
  loading: () => null,
})

// Dynamically import the main content to ensure it's loaded only when needed
const ProAnimatedEngagementPage = dynamic(
  () => import("@/components/pro-animated-engagement-page"),
  { ssr: false }
)

export default function Home() {
  const [showMain, setShowMain] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isVideoSkipped, setIsVideoSkipped] = useState(false)
  const [introFinished, setIntroFinished] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => {
      // Cleanup function to handle component unmount
      setShowMain(false)
      setIsImageLoaded(false)
    }
  }, [])

  const handleVideoComplete = useCallback(() => {
    setIntroFinished(true)
    // Only proceed if the image is already loaded or we're skipping the video
    if (isImageLoaded || isVideoSkipped) {
      setShowMain(true)
    }
  }, [isImageLoaded, isVideoSkipped])

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true)
    // If video was already skipped, show main content now that image is loaded
    if (isVideoSkipped || introFinished) {
      setShowMain(true)
    }
  }, [isVideoSkipped, introFinished])

  const handleSkipVideo = useCallback(() => {
    setIsVideoSkipped(true)
    setIntroFinished(true)
    // If image is already loaded, show main content immediately
    if (isImageLoaded) {
      setShowMain(true)
    }
  }, [isImageLoaded])

  // Preload the main image
  useEffect(() => {
    if (mounted && !isImageLoaded) {
      const img = new Image()
      img.src = "/invitation-design.png"
      img.onload = () => handleImageLoad()
      return () => {
        img.onload = null
      }
    }
  }, [mounted, isImageLoaded, handleImageLoad])

  if (!mounted) {
    return <main className="min-h-screen bg-black" />
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Video Intro */}
      {!showMain && (
        <div className="fixed inset-0 z-10">
          <VideoIntro 
            onComplete={handleVideoComplete} 
            onSkip={handleSkipVideo}
          />
        </div>
      )}
      
      {/* Main Content */}
      <div 
        className={`w-full transition-opacity duration-1000 ease-out ${
          showMain ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ProAnimatedEngagementPage onImageLoad={handleImageLoad} playGifTrigger={introFinished} />
      </div>
    </main>
  )
}