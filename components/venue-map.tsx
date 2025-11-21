"use client"

import { useState } from "react"
import Image from "next/image"
import { useTranslation } from "@/lib/translations"
import { useLanguage } from "@/contexts/LanguageContext"

export default function VenueMap() {
  const [imageLoaded, setImageLoaded] = useState(false)
  const { isRTL } = useLanguage()
  const t = useTranslation()

  // Static map image - using a reliable placeholder service
  const staticMapUrl = "data:image/png;base64,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"
  
  // Google Maps URL for Diva Garden
  const googleMapsUrl = "https://www.google.com/maps/place/?q=place_id:ChIJ5eRM1GNvXz4RbTaTNuyR1pA"

  const handleMapClick = () => {
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="w-full px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative group">
          <div className={`absolute -inset-1 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition duration-500 ${isRTL ? 'rtl' : ''}`} />
          
          <div className="relative w-full aspect-video min-h-[250px] rounded-2xl overflow-hidden border-2 border-accent/20 shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer bg-slate-50">
            <div 
              className="relative w-full h-full min-h-[250px]"
              onClick={handleMapClick}
              role="button"
              tabIndex={0}
              aria-label={t('venueMapTitle')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleMapClick()
                }
              }}
            >
              <Image
                src={staticMapUrl}
                alt={t('venueMapTitle')}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
                quality={85}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 70vw"
                onLoad={() => setImageLoaded(true)}
              />
              
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                    <span className="font-medium">{t('venueMapLoading')}</span>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-3 shadow-lg border border-slate-200 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-3 sm:px-6">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-slate-800 text-sm sm:text-base">
                    {isRTL ? 'عرض على خرائط جوجل' : 'View on Google Maps'}
                  </span>
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs sm:text-sm px-3 py-2 rounded-full backdrop-blur-sm border border-white/20 transition-opacity duration-300">
                {isRTL ? '👆 اضغط لفتح الخريطة' : '👆 Tap to open map'}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center px-4">
            <h3 className="text-xl sm:text-2xl font-serif font-medium text-foreground mb-2">
              {isRTL ? 'ذا فارم، البراري' : 'The Farm, Al Barari'}
            </h3>
            <p className="text-muted-foreground text-base sm:text-lg mb-3">
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{isRTL ? 'البراري، دبي' : 'Al Barari, Dubai'}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{isRTL ? 'اضغط على الخريطة للاتجاهات' : 'Click map for directions'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}