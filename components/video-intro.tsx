"use client"

import { useEffect, useRef, useState } from "react"

interface VideoIntroProps {
  onComplete: () => void
  onSkip: () => void
}

export default function VideoIntro({ onComplete, onSkip }: VideoIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent;
    const isIOSDevice = typeof navigator !== 'undefined' && (
      /iPad|iPhone|iPod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
    setIsIOS(isIOSDevice);
  }, []);

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = true; // Ensure video is muted for autoplay
      await video.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing video:", error);
    }
  };

  // Handle autoplay on mount for all devices including iOS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        video.muted = true;
        await video.play();
        setIsPlaying(true);
      } catch (error) {
        console.log("Autoplay prevented:", error);
      }
    };

    // Use a small delay to ensure the video element is fully ready
    const timeout = setTimeout(playVideo, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeout);
      if (video && !video.paused) {
        video.pause();
      }
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      onClick={() => {
        if (!isPlaying) {
          handlePlay();
        } else {
          onComplete();
        }
      }}
    >
      <video 
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline={true}
        muted={true}
        autoPlay={true}
        // @ts-ignore - These are valid HTML attributes that TypeScript doesn't know about
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        x5-video-player-fullscreen="false"
        x5-video-orientation="portrait"
        // @ts-ignore
        disablePictureInPicture
        preload="auto"
        onEnded={onComplete}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: 'black'
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src="/engagement-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
