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
      video.muted = true;
      video.playsInline = true;
      
      // If video is already loaded enough to play
      if (video.readyState >= 3) { // HAVE_FUTURE_DATA
        await video.play();
        setIsPlaying(true);
      } else {
        // If not loaded enough, wait for canplay event
        const onCanPlay = () => {
          video.play().then(() => {
            setIsPlaying(true);
          }).catch(e => {
            console.error("Playback failed:", e);
          });
          video.removeEventListener('canplay', onCanPlay);
        };
        
        video.addEventListener('canplay', onCanPlay, { once: true });
        
        // Also try to play immediately in case canplay already happened
        try {
          await video.play();
          setIsPlaying(true);
        } catch (e) {
          console.log("Initial play failed, waiting for canplay event");
        }
      }
    } catch (error) {
      console.error("Error in handlePlay:", error);
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

  // Preload video with higher priority
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set video preload and other attributes for better loading
    video.preload = 'auto';
    video.playsInline = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    
    // Preload the video immediately
    const loadVideo = () => {
      if (video.readyState < 2) { // HAVE_CURRENT_DATA
        video.load();
      }
    };

    // Try to preload as soon as possible
    if (document.readyState === 'complete') {
      loadVideo();
    } else {
      window.addEventListener('load', loadVideo, { once: true });
    }

    // Cleanup
    return () => {
      window.removeEventListener('load', loadVideo);
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
        playsInline
        muted
        autoPlay
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
          backgroundColor: 'black',
          // Ensure video is hardware accelerated
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          WebkitTransform: 'translateZ(0)'
        }}
        onPlay={() => {
          setIsPlaying(true);
          // Force play in case autoplay was blocked
          const video = videoRef.current;
          if (video && video.paused) {
            video.play().catch(e => console.log("Playback failed:", e));
          }
        }}
        onPause={() => setIsPlaying(false)}
        onError={(e) => console.error("Video error:", e)}
        // Preload metadata to help with faster playback
        onLoadedMetadata={() => {
          console.log('Video metadata loaded');
          const video = videoRef.current;
          if (video) {
            // Try to start playback if not already playing
            if (video.paused) {
              video.play().catch(e => console.log('Auto-play failed:', e));
            }
          }
        }}
      >
        <source 
          src="/engagement-video.mp4" 
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
