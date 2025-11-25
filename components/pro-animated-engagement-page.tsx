"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import CountdownTimer from "@/components/countdown-timer"
import VenueMap from "@/components/venue-map"
import Image from "next/image"
import HandwrittenMessage from "@/components/handwritten-message"
import { Variants } from "framer-motion"
import { useTranslation } from "@/lib/translations"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import PhotoUploadSection from "@/components/photo-upload-section"

// Format date in Arabic or English
const formatDate = (date: Date, locale: string) => {
  return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format time in Arabic or English
const formatTime = (date: Date, locale: string) => {
  return date.toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Professional animation variants
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
}

const slideUp: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
}

const scaleIn: Variants = {
  hidden: { scale: 0.98, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
}

// Professional flying entrance variants
const slideFromLeft: Variants = {
  hidden: { x: -120, opacity: 0, scale: 0.9 },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 1.2, 
      ease: [0.16, 1, 0.3, 1] as const,
      type: "spring",
      stiffness: 80,
      damping: 20
    }
  }
}

const slideFromRight: Variants = {
  hidden: { x: 120, opacity: 0, scale: 0.9 },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 1.2, 
      ease: [0.16, 1, 0.3, 1] as const,
      type: "spring",
      stiffness: 80,
      damping: 20
    }
  }
}

// Dramatic fly-in from far left
const flyFromLeft: Variants = {
  hidden: { x: -200, opacity: 0, scale: 0.8, rotate: -5 },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { 
      duration: 1.4, 
      ease: [0.16, 1, 0.3, 1] as const,
      type: "spring",
      stiffness: 60,
      damping: 18
    }
  }
}

// Dramatic fly-in from far right
const flyFromRight: Variants = {
  hidden: { x: 200, opacity: 0, scale: 0.8, rotate: 5 },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { 
      duration: 1.4, 
      ease: [0.16, 1, 0.3, 1] as const,
      type: "spring",
      stiffness: 60,
      damping: 18
    }
  }
}

// Floating entrance from left with bounce
const floatFromLeft: Variants = {
  hidden: { x: -150, y: -30, opacity: 0, scale: 0.7 },
  visible: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 1.5, 
      ease: [0.16, 1, 0.3, 1] as const,
      type: "spring",
      stiffness: 70,
      damping: 15
    }
  }
}

// Floating entrance from right with bounce
const floatFromRight: Variants = {
  hidden: { x: 150, y: -30, opacity: 0, scale: 0.7 },
  visible: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 1.5, 
      ease: [0.16, 1, 0.3, 1] as const,
      type: "spring",
      stiffness: 70,
      damping: 15
    }
  }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
}

const fastStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.05 }
  }
}

interface ProAnimatedEngagementPageProps {
  onImageLoad?: () => void;
  playGifTrigger?: boolean;
}

export default function ProAnimatedEngagementPage({ onImageLoad, playGifTrigger }: ProAnimatedEngagementPageProps) {
  const t = useTranslation()
  const { language } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [gifHasPlayed, setGifHasPlayed] = useState(false)
  const [gifPreloaded, setGifPreloaded] = useState(false)
  const gifRef = useRef<HTMLImageElement>(null)
  const gifTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { scrollYProgress } = useScroll()
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.05])
  
  // Keep countdown always visible by setting opacity to 1 regardless of scroll
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 1])
  const y = useTransform(scrollYProgress, [0, 0.1], [0, -20])
  
  // Animation values for the path
  const pathLength = useTransform(scrollYProgress, [0, 0.5], [0, 1])
  const pathY1 = useTransform(scrollYProgress, [0, 0.5], [0, 20])
  const pathY2 = useTransform(scrollYProgress, [0, 0.5], [0, 40])
  
    // Set the event date and time range
  const eventDate = new Date("2026-01-04T16:00:00");
  const endTime = new Date("2026-01-04T22:00:00");
  const formattedDate = formatDate(eventDate, language);
  const formattedTime = `${formatTime(eventDate, language)} to ${formatTime(endTime, language)}`;

  // On mount: preload both static image AND GIF for instant display
  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      // Preload static PNG
      const staticImg = new window.Image();
      staticImg.src = "/invitation-design.png";

      // Aggressively preload GIF to avoid lag
      const gifImg = new window.Image();
      gifImg.src = "/invitation-design.gif";
      gifImg.onload = () => {
        console.log('✅ GIF preloaded and cached');
        setGifPreloaded(true);
      };
      gifImg.onerror = () => {
        console.log('⚠️ GIF preload failed, will use static image');
        setGifHasPlayed(true); // Skip GIF if it fails to preload
      };
    }

    // Cleanup timer on unmount
    return () => {
      if (gifTimerRef.current) {
        clearTimeout(gifTimerRef.current);
      }
    };
  }, []);

  // When intro finishes (skipped or completed), show the GIF once and set timer
  useEffect(() => {
    if (playGifTrigger) {
      console.log('🎬 Playing GIF - playGifTrigger:', playGifTrigger, 'gifHasPlayed:', gifHasPlayed);
      
      // Reset GIF state to restart from beginning
      setGifHasPlayed(false);
      
      // Clear any existing timer
      if (gifTimerRef.current) {
        clearTimeout(gifTimerRef.current);
      }
      
      // Force GIF to restart by resetting the src
      if (gifRef.current) {
        const currentSrc = gifRef.current.src;
        gifRef.current.src = '';
        gifRef.current.src = currentSrc;
      }
      
      // Set timer to end GIF after duration
      const duration = 1000; // 1 second
      console.log('⏱️ GIF will play for', duration, 'ms');
      gifTimerRef.current = setTimeout(() => {
        console.log('⏹️ GIF finished, switching to static image');
        setGifHasPlayed(true);
        gifTimerRef.current = null;
      }, duration);
    }
  }, [playGifTrigger]);

  const handleImageLoad = () => {
    setImageLoaded(true)
    onImageLoad?.()
  }

  const handleGifError = () => {
    console.log('❌ GIF error, switching to static image');
    setGifHasPlayed(true);
    if (gifTimerRef.current) {
      clearTimeout(gifTimerRef.current);
      gifTimerRef.current = null;
    }
  }

  // Handle scroll to top when skipping intro
  useEffect(() => {
    if (playGifTrigger) {
      // Scroll to top when skipping intro
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [playGifTrigger]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 overflow-x-hidden">
      {/* Hero Section */}
      <motion.section 
        className="relative"
        initial="hidden"
        animate="visible"
        variants={fastStaggerContainer}
      >
        <motion.div 
          className="w-full relative z-10"
          variants={scaleIn}
        >
          {/* Optimized Image with immediate loading */}
          <div className="relative w-full h-auto">
            {(() => {
              const shouldShowGif = playGifTrigger && !gifHasPlayed;
              console.log('🖼️ Rendering:', shouldShowGif ? 'GIF' : 'STATIC IMAGE');
              return shouldShowGif ? (
                <img
                  key="animated-gif"
                  ref={gifRef}
                  src="/invitation-design.gif"
                  alt="Zeyad & Rawan Engagement Invitation"
                  className="w-full h-auto rounded-lg shadow-2xl"
                  onLoad={() => {
                    console.log('✅ GIF loaded successfully');
                    handleImageLoad();
                  }}
                  onError={handleGifError}
                  style={{ display: 'block' }}
                  fetchPriority="high"
                  decoding="async"
                />
              ) : (
                <Image
                  key="static-image"
                  src="/invitation-design.png"
                  alt="Zeyad & Rawan Engagement Invitation"
                  width={768}
                  height={1365}
                  className="w-full h-auto rounded-lg shadow-2xl"
                  priority
                  loading="eager"
                  quality={80}
                  onLoad={handleImageLoad}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1200px) 80vw, 70vw"
                />
              );
            })()}
            
            {/* Minimal loading state */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-muted-foreground">{t('loading')}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Scroll Down Indicator - Flying from left */}
        <motion.button
          onClick={() => {
            const countdownSection = document.querySelector('section[class*="py-20"]');
            countdownSection?.scrollIntoView({ behavior: 'auto', block: 'start' });
          }}
          className="absolute bottom-12 left-8 flex flex-col items-center gap-3 z-20 cursor-pointer group"
          initial="hidden"
          animate="visible"
          variants={flyFromLeft}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="bg-background/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-accent/30 group-hover:border-accent/50 transition-colors">
            <span className="text-base md:text-lg text-foreground font-medium tracking-wide">
              {language === 'ar' ? 'مرر للأسفل' : 'Scroll Down'}
            </span>
          </div>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="bg-accent/90 p-2 rounded-full shadow-lg group-hover:bg-accent transition-colors"
          >
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </motion.button>
        
        {/* Animated floating background elements */}
        <motion.div 
          className="absolute -left-20 top-1/4 w-64 h-64 bg-accent/5 rounded-full mix-blend-multiply filter blur-3xl"
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
          style={{ y: pathY1 }}
        />
        <motion.div 
          className="absolute -right-20 bottom-1/4 w-72 h-72 bg-accent/5 rounded-full mix-blend-multiply filter blur-3xl"
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.7 }}
          style={{ y: pathY2 }}
        />
      </motion.section>

      {/* Countdown Section - Always Visible */}
      <section className="relative py-20 px-4 md:py-32">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex flex-col items-center mb-16">
            <motion.div 
              className="flex items-center gap-4 mb-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.8, ease: "easeOut" }
                }
              }}
            >
              <motion.div 
                className="w-24 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              />
              <motion.svg 
                className="w-6 h-6 text-accent" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </motion.svg>
              <motion.div 
                className="w-24 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </motion.div>
            <motion.h2 
              className="font-luxury text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-6 tracking-wide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('ourSpecialDay')}
            </motion.h2>
            <motion.p 
              className="font-luxury text-xl md:text-2xl text-muted-foreground font-light max-w-3xl italic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {t('countingMoments')}
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <CountdownTimer targetDate={new Date("2026-01-04T16:00:00")} />
          </motion.div>
        </div>
      </section>

      {/* Venue Section */}
      <motion.section
        className="relative py-20 px-4 md:py-32 bg-gradient-to-b from-transparent via-accent/5 to-transparent"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fastStaggerContainer}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-20"
            variants={fastStaggerContainer}
          >
            <motion.div className="flex items-center justify-center gap-4 mb-8" variants={floatFromLeft}>
              <motion.div
                className="w-32 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
                initial={{ scaleX: 0, originX: 1 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2 }}
              />
              <motion.div
                className="w-3 h-3 rotate-45 bg-accent"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 45 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
              />
              <motion.div
                className="w-32 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2 }}
              />
            </motion.div>
            <motion.h2 className="font-luxury text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-4 tracking-wide" variants={floatFromRight}>
              {t('joinUsAt')}
            </motion.h2>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto space-y-8"
            variants={scaleIn}
          >
            <motion.div
              className="relative bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-md border-2 border-accent/20 rounded-3xl p-10 md:p-14 shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              whileInView={{ scale: 1, opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Animated Decorative corner elements */}
              <motion.div
                className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-accent/30 rounded-tl-3xl"
                initial={{ x: -50, y: -50, opacity: 0 }}
                whileInView={{ x: 0, y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
              />
              <motion.div
                className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-accent/30 rounded-br-3xl"
                initial={{ x: 50, y: 50, opacity: 0 }}
                whileInView={{ x: 0, y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
              />

              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <svg className="w-12 h-12 text-accent" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <h3 className="font-elegant text-4xl md:text-5xl text-foreground mb-3 text-center tracking-wide">
                  The Farm
                </h3>
                <p className="font-luxury text-xl md:text-2xl text-muted-foreground mb-10 text-center italic">
                  Al Barari, Dubai
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-10 pb-10 border-t-2 border-b-2 border-accent/20">
                  <motion.div
                    className="flex items-center gap-4 bg-accent/10 px-6 py-3 rounded-full"
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={flyFromLeft}
                  >
                    <motion.svg
                      className="w-6 h-6 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      initial={{ rotate: -180, scale: 0 }}
                      whileInView={{ rotate: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </motion.svg>
                    <span className="font-luxury text-lg text-foreground font-medium">{formattedDate}</span>
                  </motion.div>
                  <motion.div
                    className="hidden md:block w-px h-10 bg-accent/30"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  />
                  <motion.div
                    className="flex items-center gap-4 bg-accent/10 px-6 py-3 rounded-full"
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={flyFromRight}
                  >
                    <motion.svg
                      className="w-6 h-6 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      initial={{ rotate: 180, scale: 0 }}
                      whileInView={{ rotate: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </motion.svg>
                    <span className="font-luxury text-lg text-foreground font-medium">{formattedTime}</span>
                  </motion.div>
                </div>

                {/* Map integrated inside the card */}
                <motion.div
                  className="mt-10"
                  initial={{ scale: 0.9, opacity: 0, y: 30 }}
                  whileInView={{ scale: 1, opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <VenueMap />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fastStaggerContainer}
      >
        <motion.div variants={slideUp}>
          <HandwrittenMessage />
        </motion.div>
      </motion.section>

      <PhotoUploadSection />

      {/* Footer */}
      <motion.footer
        className="relative py-24 text-center bg-gradient-to-t from-accent/10 to-transparent"
        variants={fadeIn}
      >
        <div className="max-w-3xl mx-auto px-4">
          <motion.p 
            className="font-luxury text-3xl md:text-4xl text-foreground mb-8 italic leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('footerMessage')}
          </motion.p>
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-accent to-accent" />
            <motion.span 
              className="text-3xl text-accent drop-shadow-lg"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              ♥
            </motion.span>
            <div className="w-24 h-px bg-gradient-to-l from-transparent via-accent to-accent" />
          </div>
          <div className="flex items-center justify-center gap-3 opacity-60">
            <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}