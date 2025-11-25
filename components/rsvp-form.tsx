"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RsvpForm() {
  const t = useTranslation()
  const [name, setName] = useState("")
  const [isAttending, setIsAttending] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setSubmitStatus("error")
      return
    }
    
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name,
          isAttending,
          favoriteSong: '',
          createdAt: new Date().toISOString()
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSubmitStatus("success")
        setName("")
        setIsAttending(null)
      } else {
        setSubmitStatus("error")
        console.error("API Error:", data.message || "Unknown error")
      }
    } catch (error) {
      console.error("Error submitting RSVP:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-20 px-4 md:py-32 bg-background">
      <div className="max-w-3xl mx-auto bg-card p-8 md:p-12 rounded-lg shadow-lg">
        <h2 className="font-luxury text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-4 tracking-wide text-center">
          {t('rsvpTitle')}
        </h2>
        <p className="font-luxury text-xl md:text-2xl text-muted-foreground mb-10 text-center italic">
          {t('rsvpSubtitle')}
        </p>
        
        <div className="flex justify-center mb-8 space-x-4">
          <Button 
            onClick={() => setIsAttending(true)} 
            variant={isAttending === true ? 'default' : 'outline'}
            className="px-6 py-3 text-lg"
          >
            {t('attending')}
          </Button>
          <Button 
            onClick={() => setIsAttending(false)} 
            variant={isAttending === false ? 'default' : 'outline'}
            className="px-6 py-3 text-lg"
          >
            {t('notAttending')}
          </Button>
        </div>

        {isAttending !== null && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t('name')} *</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="mt-1"
                />
              </div>


              {!isAttending && (
                <p className="text-center text-muted-foreground py-2">
                  {t('sorryToMissYou')}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 text-lg" 
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? t('submitting') : t('submitRsvp')}
            </Button>
            
            {submitStatus === 'success' && (
              <p className="text-center text-green-600 mt-4">
                {t('rsvpSuccess')}
              </p>
            )}
            {submitStatus === 'error' && (
              <p className="text-center text-red-500 mt-4">
                {t('rsvpError')}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
