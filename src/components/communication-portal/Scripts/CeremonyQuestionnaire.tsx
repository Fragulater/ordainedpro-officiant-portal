"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, ClipboardList, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateCouple as updateCoupleInDB } from "@/services/couple-data-service"
import { useCommunicationPortal } from "../CommunicationPortalContext"

const STORAGE_MARKER = "__ordainedProCeremonyQuestions"
const STORAGE_VERSION = 1

type QuestionAnswer = {
  enabled: boolean
  value: string
}

type CeremonyQuestionnaireAnswers = {
  coupleNames: string
  date: string
  time: string
  location: string
  ceremonyType: string
  ceremonyTypeOther: string
  outOfTown: QuestionAnswer
  unpluggedCeremony: QuestionAnswer
  givenAway: QuestionAnswer
  unityService: QuestionAnswer
  mentionOfPassing: QuestionAnswer
  vows: QuestionAnswer
  loveStory: QuestionAnswer
  rings: QuestionAnswer
  announce: QuestionAnswer
  witnesses: QuestionAnswer
  weddingParty: QuestionAnswer
  serviceFee: string
  deposit: string
  contract: QuestionAnswer
  generalNotes: string
}

const emptyQuestion = (value = ""): QuestionAnswer => ({
  enabled: false,
  value,
})

const buildDefaultAnswers = (editCoupleInfo: any, editWeddingDetails: any): CeremonyQuestionnaireAnswers => ({
  coupleNames: [editCoupleInfo?.brideName, editCoupleInfo?.groomName].filter(Boolean).join(" & "),
  date: editWeddingDetails?.weddingDate || "",
  time: editWeddingDetails?.startTime || "",
  location: [editWeddingDetails?.venueName, editWeddingDetails?.venueAddress].filter(Boolean).join(", "),
  ceremonyType: "",
  ceremonyTypeOther: "",
  outOfTown: emptyQuestion(),
  unpluggedCeremony: emptyQuestion(),
  givenAway: emptyQuestion(),
  unityService: emptyQuestion(),
  mentionOfPassing: emptyQuestion(),
  vows: emptyQuestion(),
  loveStory: emptyQuestion(),
  rings: emptyQuestion(),
  announce: emptyQuestion(),
  witnesses: emptyQuestion(),
  weddingParty: emptyQuestion(),
  serviceFee: "",
  deposit: "",
  contract: emptyQuestion(),
  generalNotes: "",
})

const questionFields: Array<{
  key: keyof Pick<
    CeremonyQuestionnaireAnswers,
    | "outOfTown"
    | "unpluggedCeremony"
    | "givenAway"
    | "unityService"
    | "mentionOfPassing"
    | "vows"
    | "loveStory"
    | "rings"
    | "announce"
    | "witnesses"
    | "weddingParty"
    | "contract"
  >
  label: string
  helper: string
  placeholder: string
}> = [
  {
    key: "outOfTown",
    label: "Out of town guests",
    helper: "Helps the officiant decide whether to thank guests who traveled.",
    placeholder: "Example: Yes, about half of the guests are from out of town.",
  },
  {
    key: "unpluggedCeremony",
    label: "Unplugged ceremony",
    helper: "Tracks whether guests should be asked to silence phones and avoid photos.",
    placeholder: "Example: Yes, ask guests to keep phones away during the ceremony.",
  },
  {
    key: "givenAway",
    label: "Given away",
    helper: "Records whether someone will present or escort either partner.",
    placeholder: "Example: Partner 1 will be escorted by her father.",
  },
  {
    key: "unityService",
    label: "Unity service",
    helper: "Examples: sand, gifts, handfasting, candle, blending wine, or other.",
    placeholder: "Example: Yes, a sand ceremony with both families participating.",
  },
  {
    key: "mentionOfPassing",
    label: "Mention of passing",
    helper: "Notes whether loved ones who passed should be honored.",
    placeholder: "Example: Mention both grandmothers briefly before the vows.",
  },
  {
    key: "vows",
    label: "Vows",
    helper: "Examples: personal, repeating, traditional, modern, or other.",
    placeholder: "Example: Personal vows first, then a short repeating vow.",
  },
  {
    key: "loveStory",
    label: "Love story",
    helper: "Captures details the officiant can use to personalize the ceremony.",
    placeholder: "Example: They met at work, bonded over hiking, and got engaged in Sedona.",
  },
  {
    key: "rings",
    label: "Ring exchange",
    helper: "Confirms whether rings are part of the ceremony.",
    placeholder: "Example: Yes, both partners will exchange rings.",
  },
  {
    key: "announce",
    label: "Announcement",
    helper: "Records how the couple should be announced after the ceremony.",
    placeholder: "Example: Please announce them as Daniel and Marilyn Salerno.",
  },
  {
    key: "witnesses",
    label: "Witnesses",
    helper: "Tracks witness names for the license or ceremony logistics.",
    placeholder: "Example: Maria Rodriguez and James Anderson.",
  },
  {
    key: "weddingParty",
    label: "Wedding party",
    helper: "Records wedding party size and important names.",
    placeholder: "Example: 5 bridesmaids and 5 groomsmen.",
  },
  {
    key: "contract",
    label: "Contract",
    helper: "Tracks whether the contract is needed, sent, or signed.",
    placeholder: "Example: Contract sent through BoldSign and waiting for Partner 2.",
  },
]

const ceremonyTypeOptions = [
  "Religious - Christian",
  "Religious - Other",
  "Non-religious",
  "Semi-religious",
  "Interfaith",
  "Other",
]

const tryParseStoredAnswers = (
  rawValue: string | undefined,
  fallback: CeremonyQuestionnaireAnswers
): CeremonyQuestionnaireAnswers => {
  if (!rawValue) return fallback

  try {
    const parsed = JSON.parse(rawValue)
    if (parsed?.[STORAGE_MARKER] && parsed.answers) {
      return {
        ...fallback,
        ...parsed.answers,
      }
    }
  } catch {
    return {
      ...fallback,
      generalNotes: rawValue,
    }
  }

  return fallback
}

export function CeremonyQuestionnaire() {
  const {
    editCoupleInfo,
    setEditCoupleInfo,
    editWeddingDetails,
    allCouples,
    setAllCouples,
  } = useCommunicationPortal()

  const defaults = useMemo(
    () => buildDefaultAnswers(editCoupleInfo, editWeddingDetails),
    [editCoupleInfo?.id, editCoupleInfo?.brideName, editCoupleInfo?.groomName, editWeddingDetails]
  )

  const [answers, setAnswers] = useState<CeremonyQuestionnaireAnswers>(defaults)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle")

  useEffect(() => {
    setAnswers(tryParseStoredAnswers(editCoupleInfo?.specialRequests, defaults))
    setSaveStatus("idle")
  }, [editCoupleInfo?.id, editCoupleInfo?.specialRequests, defaults])

  const completedCount = questionFields.filter((field) => answers[field.key].enabled).length

  const updateAnswer = <K extends keyof CeremonyQuestionnaireAnswers>(
    key: K,
    value: CeremonyQuestionnaireAnswers[K]
  ) => {
    setAnswers((current) => ({
      ...current,
      [key]: value,
    }))
    setSaveStatus("idle")
  }

  const updateQuestion = (key: keyof typeof answers, updates: Partial<QuestionAnswer>) => {
    const current = answers[key]
    if (typeof current !== "object" || current === null || !("enabled" in current)) return

    updateAnswer(key as any, {
      ...current,
      ...updates,
    })
  }

  const handleSave = async () => {
    if (!editCoupleInfo?.id) return

    setIsSaving(true)
    setSaveStatus("idle")

    const storedValue = JSON.stringify({
      [STORAGE_MARKER]: true,
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      answers,
    })

    const result = await updateCoupleInDB(editCoupleInfo.id, {
      special_requests: storedValue,
    } as any)

    if (result.ok) {
      const updatedCouple = {
        ...editCoupleInfo,
        specialRequests: storedValue,
      }
      setEditCoupleInfo(updatedCouple)
      setAllCouples(
        allCouples.map((couple: any) =>
          couple.id === editCoupleInfo.id
            ? {
                ...couple,
                specialRequests: storedValue,
              }
            : couple
        )
      )
      setSaveStatus("saved")
    } else {
      console.error("Failed to save ceremony questionnaire:", result.error)
      setSaveStatus("error")
    }

    setIsSaving(false)
  }

  return (
    <Card className="border-pink-200 bg-pink-50/60 shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center text-pink-900">
              <ClipboardList className="mr-2 h-5 w-5" />
              Officiant Ceremony Questions
            </CardTitle>
            <CardDescription className="text-pink-800">
              Record the couple's answers before building the ceremony script.
            </CardDescription>
          </div>
          <Badge className="w-fit bg-white text-pink-700 border border-pink-200 hover:bg-white">
            {completedCount} of {questionFields.length} checked
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="questionnaire-couple-names">Both full names</Label>
            <Input
              id="questionnaire-couple-names"
              value={answers.coupleNames}
              onChange={(event) => updateAnswer("coupleNames", event.target.value)}
              placeholder="Partner 1 & Partner 2"
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="questionnaire-date">Date</Label>
            <Input
              id="questionnaire-date"
              type="date"
              value={answers.date}
              onChange={(event) => updateAnswer("date", event.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="questionnaire-time">Time</Label>
            <Input
              id="questionnaire-time"
              type="time"
              value={answers.time}
              onChange={(event) => updateAnswer("time", event.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="questionnaire-location">Location</Label>
            <Input
              id="questionnaire-location"
              value={answers.location}
              onChange={(event) => updateAnswer("location", event.target.value)}
              placeholder="Venue name and address"
              className="bg-white"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="questionnaire-ceremony-type">Ceremony type</Label>
            <select
              id="questionnaire-ceremony-type"
              value={answers.ceremonyType}
              onChange={(event) => updateAnswer("ceremonyType", event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              <option value="">Select ceremony type...</option>
              {ceremonyTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="questionnaire-ceremony-type-other">Ceremony type notes</Label>
            <Input
              id="questionnaire-ceremony-type-other"
              value={answers.ceremonyTypeOther}
              onChange={(event) => updateAnswer("ceremonyTypeOther", event.target.value)}
              placeholder="Example: Christian with a short non-denominational tone"
              className="bg-white"
            />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {questionFields.map((field) => {
            const answer = answers[field.key]

            return (
              <div key={field.key} className="rounded-lg border border-pink-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`questionnaire-${field.key}`}
                    checked={answer.enabled}
                    onCheckedChange={(checked) => updateQuestion(field.key, { enabled: checked === true })}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor={`questionnaire-${field.key}`} className="font-semibold text-gray-900">
                      {field.label}
                    </Label>
                    <p className="text-xs leading-5 text-gray-600">{field.helper}</p>
                    <Textarea
                      value={answer.value}
                      onChange={(event) => updateQuestion(field.key, { value: event.target.value })}
                      placeholder={field.placeholder}
                      className="min-h-[86px] resize-y border-pink-100 bg-pink-50/30 focus-visible:ring-pink-300"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="questionnaire-service-fee">Service fee</Label>
            <Input
              id="questionnaire-service-fee"
              value={answers.serviceFee}
              onChange={(event) => updateAnswer("serviceFee", event.target.value)}
              placeholder="Example: $800"
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="questionnaire-deposit">Deposit</Label>
            <Input
              id="questionnaire-deposit"
              value={answers.deposit}
              onChange={(event) => updateAnswer("deposit", event.target.value)}
              placeholder="Example: $300 paid, balance due 7 days before"
              className="bg-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="questionnaire-general-notes">Additional ceremony notes</Label>
          <Textarea
            id="questionnaire-general-notes"
            value={answers.generalNotes}
            onChange={(event) => updateAnswer("generalNotes", event.target.value)}
            placeholder="Add anything else the officiant should remember when writing or performing the ceremony."
            className="min-h-[110px] bg-white"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-pink-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm">
            {saveStatus === "saved" && (
              <span className="flex items-center text-green-700">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Ceremony questions saved.
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-600">Unable to save ceremony questions. Please try again.</span>
            )}
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !editCoupleInfo?.id}
            className="bg-pink-600 text-white hover:bg-pink-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Ceremony Questions"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
