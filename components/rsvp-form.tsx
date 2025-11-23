"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function RsvpForm() {
  const t = useTranslation()
  const [name, setName] = useState("")
  const [guests, setGuests] = useState("")
  const [guestNames, setGuestNames] = useState("")
  const [favoriteSong, setFavoriteSong] = useState("")
  const [isAttending, setIsAttending] = useState<boolean | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, guests, guestNames, favoriteSong, isAttending }),
    })

    if (res.ok) {
      setSubmitStatus("success")
    } else {
      setSubmitStatus("error")
    }

    setIsSubmitting(false)
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
          <Button onClick={() => setIsAttending(true)} variant={isAttending === true ? 'default' : 'outline'}>{t('attending')}</Button>
          <Button onClick={() => setIsAttending(false)} variant={isAttending === false ? 'default' : 'outline'}>{t('notAttending')}</Button>
        </div>
        {isAttending !== null && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {isAttending ? (
              <>
                <div>
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="guests">{t('numberOfGuests')}</Label>
                  <Input id="guests" type="number" value={guests} onChange={(e) => setGuests(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="guestNames">{t('guestNames')}</Label>
                  <Textarea id="guestNames" value={guestNames} onChange={(e) => setGuestNames(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="favoriteSong">{t('promiseToDance')}</Label>
                  <Input 
                    id="favoriteSong" 
                    value={favoriteSong} 
                    onChange={(e) => setFavoriteSong(e.target.value)} 
                    placeholder={t('favoriteSongPlaceholder')}
                  />
                </div>
                              </>
            ) : (
              <div>
                <div className="mb-4">
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className="mt-1"
                  />
                </div>
                <p className="text-center text-muted-foreground mb-4">{t('sorryToMissYou')}</p>
              </div>
            )}
            <Button type="submit" className="w-full mt-4" disabled={isSubmitting || (isAttending === false && !name.trim())}>
              {isSubmitting ? t('submitting') : t('submitRsvp')}
            </Button>
            {submitStatus === 'success' && <p className="text-center text-success">{t('rsvpSuccess')}</p>}
            {submitStatus === 'error' && <p className="text-center text-destructive">{t('rsvpError')}</p>}
          </form>
        )}
      </div>
    </section>
  )
}
