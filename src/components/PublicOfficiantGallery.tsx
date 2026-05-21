"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"

interface PublicOfficiantGalleryProps {
  photos: string[]
  name: string
}

export function PublicOfficiantGallery({ photos, name }: PublicOfficiantGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  if (photos.length === 0) {
    return null
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {photos.slice(0, 9).map((photo, index) => (
          <button
            key={`${photo}-${index}`}
            type="button"
            className="group overflow-hidden rounded-lg border bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo}
              alt={`${name} wedding ceremony photo ${index + 1}`}
              className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
          <button
            type="button"
            className="absolute right-3 top-3 z-10 rounded-full bg-black/70 p-2 text-white hover:bg-black"
            onClick={() => setSelectedPhoto(null)}
            aria-label="Close photo"
          >
            <X className="h-5 w-5" />
          </button>
          {selectedPhoto ? (
            <img
              src={selectedPhoto}
              alt={`${name} enlarged wedding ceremony photo`}
              className="max-h-[86vh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
