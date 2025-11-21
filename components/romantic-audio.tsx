'use client';

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/translations';

export function RomanticAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wasPlayingRef = useRef(false); // Track if music was playing before tab switch
  const t = useTranslation();

  // Handle first user interaction to start audio
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFirstInteraction = async () => {
      if (audioRef.current && !isPlaying) {
        try {
          // Restore src if it was cleared on background
          const hasSrc = !!audioRef.current.getAttribute('src');
          if (!hasSrc) {
            audioRef.current.setAttribute('src', '/song.mp3');
            audioRef.current.load();
          }
          audioRef.current.muted = false;
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.log('Autoplay prevented, waiting for user interaction');
        }
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    // Add event listeners for first user interaction
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isPlaying]);

  // Initialize audio settings
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    // Set initial volume and mute state
    audio.volume = 0.25;
    audio.muted = isMuted;

    // Wait for audio to be ready before attempting to play
    const handleCanPlay = () => {
      // Try to play automatically (works on some browsers)
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            wasPlayingRef.current = true;
          })
          .catch(() => console.log('Autoplay prevented'));
      }
    };

    // Ensure src is present
    if (!audio.getAttribute('src')) {
      audio.setAttribute('src', '/song.mp3');
    }

    // Add event listener for when audio is ready
    audio.addEventListener('canplay', handleCanPlay, { once: true });

    // If audio is already ready, trigger immediately
    if (audio.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      if (audio && !audio.paused) {
        audio.pause();
      }
    };
  }, []);

  // Handle mute state changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  // Pause music when user leaves the browser/tab
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const pauseIfPlaying = () => {
      if (!audioRef.current) return;
      const a = audioRef.current;
      try {
        // Force stop and silence in background across browsers
        a.muted = true;
        a.pause();
        try { a.currentTime = 0; } catch {}
        try { a.removeAttribute('src'); } catch {}
        try { a.load(); } catch {}
        wasPlayingRef.current = false;
        setIsPlaying(false);
        // Best effort: clear media session playback indicator when supported
        try { (navigator as any)?.mediaSession && ((navigator as any).mediaSession.playbackState = 'none'); } catch {}
      } catch (error) {
        console.error('Error while pausing audio:', error);
      }
    };

    const isDocumentHidden = () => {
      const d = document as any;
      return d.hidden === true || d.visibilityState === 'hidden' || d.webkitHidden === true;
    };

    const handleVisibilityChange = () => {
      if (isDocumentHidden()) {
        pauseIfPlaying();
      }
    };

    const handlePageHide = () => {
      // iOS Safari reliably fires pagehide on app switch/back/close
      pauseIfPlaying();
    };

    const handleBeforeUnload = () => {
      pauseIfPlaying();
    };

    const handleBlur = () => {
      // Some browsers only fire blur when switching tabs
      pauseIfPlaying();
    };

    const handleFreeze = () => {
      // Chrome Page Lifecycle: tab is frozen
      pauseIfPlaying();
    };

    try {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      // Safari older versions
      (document as any).addEventListener?.('webkitvisibilitychange', handleVisibilityChange as EventListener);
      document.addEventListener('freeze', handleFreeze as EventListener);
      // pagehide on both window and document for broader coverage
      document.addEventListener('pagehide', handlePageHide as EventListener);
      window.addEventListener('pagehide', handlePageHide);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('blur', handleBlur);
    } catch (error) {
      console.error('Error adding pause listeners:', error);
    }

    return () => {
      try {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        (document as any).removeEventListener?.('webkitvisibilitychange', handleVisibilityChange as EventListener);
        document.removeEventListener('freeze', handleFreeze as EventListener);
        document.removeEventListener('pagehide', handlePageHide as EventListener);
        window.removeEventListener('pagehide', handlePageHide);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('blur', handleBlur);
      } catch (error) {
        console.error('Error removing pause listeners:', error);
      }
    };
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMute}
        className="
          rounded-full w-12 h-12 
          bg-primary/80 hover:bg-primary 
          active:bg-primary/90
          transition-all duration-200 
          flex items-center justify-center
          shadow-md
          text-primary-foreground
        "
        aria-label={isMuted ? t('unmuteMusic') : t('muteMusic')}
        title={isMuted ? t('unmuteMusic') : t('muteMusic')}
      >
        {isMuted ? (
          <VolumeX className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Volume2 className="h-6 w-6" aria-hidden="true" />
        )}
      </Button>
      
      <audio
        ref={audioRef}
        loop
        playsInline
        preload="auto"
        className="hidden"
      />
    </div>
  );
}