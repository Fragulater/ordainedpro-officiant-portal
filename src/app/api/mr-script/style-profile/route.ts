import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import mammoth from "mammoth"
import { createClient } from "@/supabase/utils/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type StyleProfile = {
  summary: string
  ceremonyTypes: string[]
  tone: string[]
  openingStyle: string
  vowStyle: string
  ringExchangeStyle: string
  storytellingStyle: string
  transitionStyle: string
  blessingClosingStyle: string
  humorLevel: string
  religiousSpiritualStyle: string
  readingPreference: string
  sectionStructure: string
  personalizationLevel: string
  legalLanguagePreference: string
  familyCommunityInvolvement: string
  signaturePhrases: string[]
  phrasesToAvoid: string[]
  lengthRhythm: string
}

const EMPTY_PROFILE: StyleProfile = {
  summary: "",
  ceremonyTypes: [],
  tone: [],
  openingStyle: "",
  vowStyle: "",
  ringExchangeStyle: "",
  storytellingStyle: "",
  transitionStyle: "",
  blessingClosingStyle: "",
  humorLevel: "",
  religiousSpiritualStyle: "",
  readingPreference: "",
  sectionStructure: "",
  personalizationLevel: "",
  legalLanguagePreference: "",
  familyCommunityInvolvement: "",
  signaturePhrases: [],
  phrasesToAvoid: [],
  lengthRhythm: "",
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase service credentials are not configured.")
  }

  return createSupabaseAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \u00a0]{2,}/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
}

async function extractFileText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()

  if (name.endsWith(".docx") || type.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer })
    return normalizeText(result.value || "")
  }

  if (name.endsWith(".txt") || type.startsWith("text/") || !type) {
    return normalizeText(buffer.toString("utf8"))
  }

  throw new Error(`${file.name} is not supported yet. Upload .docx or .txt style samples.`)
}

function safeArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 12)
}

function asProfile(value: any): StyleProfile {
  return {
    summary: String(value?.summary || ""),
    ceremonyTypes: safeArray(value?.ceremonyTypes),
    tone: safeArray(value?.tone),
    openingStyle: String(value?.openingStyle || ""),
    vowStyle: String(value?.vowStyle || ""),
    ringExchangeStyle: String(value?.ringExchangeStyle || ""),
    storytellingStyle: String(value?.storytellingStyle || ""),
    transitionStyle: String(value?.transitionStyle || ""),
    blessingClosingStyle: String(value?.blessingClosingStyle || ""),
    humorLevel: String(value?.humorLevel || ""),
    religiousSpiritualStyle: String(value?.religiousSpiritualStyle || ""),
    readingPreference: String(value?.readingPreference || ""),
    sectionStructure: String(value?.sectionStructure || ""),
    personalizationLevel: String(value?.personalizationLevel || ""),
    legalLanguagePreference: String(value?.legalLanguagePreference || ""),
    familyCommunityInvolvement: String(value?.familyCommunityInvolvement || ""),
    signaturePhrases: safeArray(value?.signaturePhrases),
    phrasesToAvoid: safeArray(value?.phrasesToAvoid),
    lengthRhythm: String(value?.lengthRhythm || ""),
  }
}

function mergeList(...lists: string[][]) {
  const seen = new Set<string>()
  const merged: string[] = []

  lists.flat().forEach((item) => {
    const clean = item.trim()
    const key = clean.toLowerCase()
    if (!clean || seen.has(key)) return
    seen.add(key)
    merged.push(clean)
  })

  return merged.slice(0, 12)
}

function mergeProfiles(existing: StyleProfile, incoming: StyleProfile, sampleCount: number): StyleProfile {
  const choose = (current: string, next: string) => {
    if (!current) return next
    if (!next) return current
    if (current.toLowerCase().includes(next.toLowerCase())) return current
    if (next.toLowerCase().includes(current.toLowerCase())) return next
    return `${current} ${next}`.slice(0, 700)
  }

  return {
    summary: incoming.summary
      ? `Based on ${sampleCount} uploaded style sample${sampleCount === 1 ? "" : "s"}: ${incoming.summary}`.slice(0, 900)
      : existing.summary,
    ceremonyTypes: mergeList(existing.ceremonyTypes, incoming.ceremonyTypes),
    tone: mergeList(existing.tone, incoming.tone),
    openingStyle: choose(existing.openingStyle, incoming.openingStyle),
    vowStyle: choose(existing.vowStyle, incoming.vowStyle),
    ringExchangeStyle: choose(existing.ringExchangeStyle, incoming.ringExchangeStyle),
    storytellingStyle: choose(existing.storytellingStyle, incoming.storytellingStyle),
    transitionStyle: choose(existing.transitionStyle, incoming.transitionStyle),
    blessingClosingStyle: choose(existing.blessingClosingStyle, incoming.blessingClosingStyle),
    humorLevel: choose(existing.humorLevel, incoming.humorLevel),
    religiousSpiritualStyle: choose(existing.religiousSpiritualStyle, incoming.religiousSpiritualStyle),
    readingPreference: choose(existing.readingPreference, incoming.readingPreference),
    sectionStructure: choose(existing.sectionStructure, incoming.sectionStructure),
    personalizationLevel: choose(existing.personalizationLevel, incoming.personalizationLevel),
    legalLanguagePreference: choose(existing.legalLanguagePreference, incoming.legalLanguagePreference),
    familyCommunityInvolvement: choose(existing.familyCommunityInvolvement, incoming.familyCommunityInvolvement),
    signaturePhrases: mergeList(existing.signaturePhrases, incoming.signaturePhrases),
    phrasesToAvoid: mergeList(existing.phrasesToAvoid, incoming.phrasesToAvoid),
    lengthRhythm: choose(existing.lengthRhythm, incoming.lengthRhythm),
  }
}

function heuristicAnalyze(text: string, ceremonyType: string): StyleProfile {
  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)
  const lower = text.toLowerCase()
  const hasPrayer = /\b(pray|lord|god|bless|scripture|amen|faith)\b/.test(lower)
  const hasHumor = /\b(laugh|funny|joke|smile|inside joke|playful)\b/.test(lower)
  const hasVows = /\b(i promise|vows|repeat after me|do you take|i do)\b/.test(lower)

  return {
    ...EMPTY_PROFILE,
    summary: "Warm ceremony language with clear section structure, spoken paragraphs, and officiant-ready transitions.",
    ceremonyTypes: ceremonyType ? [ceremonyType] : [],
    tone: [hasPrayer ? "spiritual or religious" : "warm and personal", hasHumor ? "light humor" : "polished"],
    openingStyle: paragraphs[0]?.slice(0, 240) || "Begins with a welcome and sets the emotional purpose of the ceremony.",
    vowStyle: hasVows ? "Includes clear vow prompts and repeatable promise language." : "Uses vows only when appropriate to the ceremony type.",
    ringExchangeStyle: lower.includes("ring") ? "Uses ring symbolism and simple promise wording." : "",
    storytellingStyle: "Uses readable spoken paragraphs and personal reflection.",
    transitionStyle: "Moves between sections with direct, natural officiant transitions.",
    blessingClosingStyle: hasPrayer ? "Comfortable with blessing and faith language." : "Uses warm closing encouragement.",
    humorLevel: hasHumor ? "gentle and situational" : "minimal",
    religiousSpiritualStyle: hasPrayer ? "religious or spiritual language appears naturally" : "does not assume religion",
    readingPreference: lower.includes("reading") ? "May include short readings or reflections." : "",
    sectionStructure: "Uses section headings and paragraph breaks.",
    personalizationLevel: "light to moderate personalization",
    legalLanguagePreference: lower.includes("authority vested") ? "includes traditional legal pronouncement language for weddings" : "keeps legal wording minimal unless needed",
    familyCommunityInvolvement: lower.includes("family") || lower.includes("friends") ? "Acknowledges gathered family and friends." : "",
    signaturePhrases: [],
    phrasesToAvoid: [],
    lengthRhythm: "Prefers complete spoken paragraphs with clear line breaks.",
  }
}

async function analyzeWithOpenAI(text: string, ceremonyType: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return heuristicAnalyze(text, ceremonyType)

  const clippedText = text.slice(0, 24000)
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content: "Analyze ceremony scripts into a private officiant writing style profile. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Ceremony type hint: ${ceremonyType || "unknown"}\n\nReturn JSON with these keys: summary, ceremonyTypes, tone, openingStyle, vowStyle, ringExchangeStyle, storytellingStyle, transitionStyle, blessingClosingStyle, humorLevel, religiousSpiritualStyle, readingPreference, sectionStructure, personalizationLevel, legalLanguagePreference, familyCommunityInvolvement, signaturePhrases, phrasesToAvoid, lengthRhythm.\n\nDo not copy long passages. Capture style patterns only.\n\nSCRIPT SAMPLE:\n${clippedText}`,
        },
      ],
      max_completion_tokens: 1200,
    }),
  })

  if (!response.ok) return heuristicAnalyze(text, ceremonyType)

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ""
  try {
    const jsonText = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim()
    return asProfile(JSON.parse(jsonText))
  } catch {
    return heuristicAnalyze(text, ceremonyType)
  }
}

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Please log in before viewing your style profile." }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const [{ data: profile }, { data: samples }] = await Promise.all([
      supabaseAdmin
        .from("officiant_script_style_profiles")
        .select("profile, sample_count, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .from("officiant_script_style_samples")
        .select("id, file_name, ceremony_type, word_count, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12),
    ])

    return NextResponse.json({
      ok: true,
      profile: profile?.profile || null,
      sampleCount: profile?.sample_count || 0,
      updatedAt: profile?.updated_at || null,
      samples: samples || [],
    })
  } catch (error) {
    console.error("Style profile load error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load writing style profile." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Please log in before uploading style samples." }, { status: 401 })
    }

    const formData = await request.formData()
    const ceremonyType = String(formData.get("ceremonyType") || "")
    const files = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0)

    if (!files.length) {
      return NextResponse.json({ error: "Upload at least one .docx or .txt script sample." }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: existing } = await supabaseAdmin
      .from("officiant_script_style_profiles")
      .select("profile, sample_count")
      .eq("user_id", user.id)
      .maybeSingle()

    let mergedProfile = asProfile(existing?.profile || EMPTY_PROFILE)
    let sampleCount = Number(existing?.sample_count || 0)
    const analyzedSamples: any[] = []

    for (const file of files.slice(0, 10)) {
      const text = await extractFileText(file)
      const words = text.split(/\s+/).filter(Boolean)

      if (words.length < 75) {
        throw new Error(`${file.name} does not have enough readable text to learn from.`)
      }

      const analysis = await analyzeWithOpenAI(text, ceremonyType)
      sampleCount += 1
      mergedProfile = mergeProfiles(mergedProfile, analysis, sampleCount)

      const { data: sample, error: sampleError } = await supabaseAdmin
        .from("officiant_script_style_samples")
        .insert({
          user_id: user.id,
          file_name: file.name,
          ceremony_type: ceremonyType || analysis.ceremonyTypes[0] || null,
          word_count: words.length,
          analysis,
        })
        .select("id, file_name, ceremony_type, word_count, created_at")
        .single()

      if (sampleError) {
        throw new Error(`Style sample save failed: ${sampleError.message}`)
      }

      analyzedSamples.push(sample)
    }

    const { data: savedProfile, error: profileError } = await supabaseAdmin
      .from("officiant_script_style_profiles")
      .upsert(
        {
          user_id: user.id,
          profile: mergedProfile,
          sample_count: sampleCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("profile, sample_count, updated_at")
      .single()

    if (profileError) {
      throw new Error(`Style profile save failed: ${profileError.message}`)
    }

    return NextResponse.json({
      ok: true,
      profile: savedProfile.profile,
      sampleCount: savedProfile.sample_count,
      updatedAt: savedProfile.updated_at,
      samples: analyzedSamples,
    })
  } catch (error) {
    console.error("Style profile upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to analyze these style samples." },
      { status: 500 }
    )
  }
}
