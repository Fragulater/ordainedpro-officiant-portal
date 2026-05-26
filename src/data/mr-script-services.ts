export type MrScriptSensitivity = "celebratory" | "grief" | "neutral"

export type MrScriptService = {
  id: string
  category: string
  displayName: string
  shortName: string
  description: string
  sensitivity: MrScriptSensitivity
  keywords: string[]
  toneOptions: string[]
  requiredQuestions: string[]
  optionalQuestions: string[]
  storyPrompts: string[]
  outputTypes: string[]
  scriptSections: string[]
}

export const MR_SCRIPT_SERVICE_OPTIONS = [
  "Wedding",
  "Coming-of-Age",
  "Celebration of Life",
  "Baby Blessing",
  "Vow Renewal",
  "Eulogy, Vows, or Speech",
  "Custom Life Ceremony",
  "Something Else",
]

export const MR_SCRIPT_LENGTH_OPTIONS = [
  "5-10 minutes",
  "10-15 minutes",
  "15-20 minutes",
  "20-30 minutes",
  "30-45 minutes",
  "45 minutes",
]

export const MR_SCRIPT_SERVICES: MrScriptService[] = [
  {
    id: "wedding",
    category: "Marriage & Relationship Ceremonies",
    displayName: "Wedding Ceremony",
    shortName: "Wedding",
    description:
      "A legal or symbolic wedding ceremony script built around the couple, their promises, vows, rings, tone, traditions, and guests.",
    sensitivity: "celebratory",
    keywords: ["wedding", "marry", "marriage", "ceremony", "elopement", "license", "rings", "vows"],
    toneOptions: ["Formal and Traditional", "Warm and Personal", "Light and Joyful", "Intimate and Romantic", "Fun and Casual"],
    requiredQuestions: [
      "What are the couple's names?",
      "Is this legal, symbolic, religious, spiritual, cultural, or non-religious?",
      "Will the couple exchange vows?",
      "Will there be a ring exchange?",
    ],
    optionalQuestions: [
      "Should loved ones be honored or remembered?",
      "Should a unity ceremony be included?",
      "Are there any readings, prayers, or cultural traditions?",
    ],
    storyPrompts: [
      "Individual backgrounds before they met",
      "How they first met and first impressions",
      "Early dates, favorite memories, or funny moments",
      "Milestones, proposal, family, challenges, and future hopes",
    ],
    outputTypes: ["ceremony_script", "ceremony_outline", "vow_wording", "reading_suggestions"],
    scriptSections: ["Processional", "Welcome", "Reflection", "Declaration of Intent", "Vows", "Rings", "Pronouncement", "Recessional"],
  },
  {
    id: "coming_of_age",
    category: "Coming-of-Age Ceremonies",
    displayName: "Coming-of-Age Ceremony",
    shortName: "Coming-of-Age",
    description:
      "A family-centered milestone ceremony such as a quinceanera, sweet sixteen, graduation blessing, youth blessing, or rite of passage.",
    sensitivity: "celebratory",
    keywords: ["quinceanera", "quince", "sweet sixteen", "coming of age", "15th birthday", "rite of passage", "graduation blessing"],
    toneOptions: ["Joyful and Family-Centered", "Traditional", "Spiritual", "Cultural", "Bilingual", "Light and Warm"],
    requiredQuestions: [
      "What is the honoree's name?",
      "What milestone is being celebrated?",
      "Should the ceremony feel religious, spiritual, cultural, non-religious, or bilingual?",
      "Which family members or mentors should be mentioned?",
    ],
    optionalQuestions: [
      "Should traditions like candle, crown, shoe, Bible, rosary, parent blessing, or court of honor be included?",
      "Should grandparents, godparents, or siblings have speaking moments?",
    ],
    storyPrompts: [
      "The honoree's personality, values, talents, and interests",
      "Accomplishments, school, faith, culture, sports, arts, or service",
      "Family members, mentors, or friends who helped shape them",
      "Future hopes such as college, career, travel, goals, or adulthood",
    ],
    outputTypes: ["ceremony_script", "family_blessing", "parent_speech", "ceremony_outline"],
    scriptSections: ["Welcome", "Meaning of the Milestone", "Family Recognition", "Traditions", "Blessing", "Closing"],
  },
  {
    id: "celebration_of_life",
    category: "Memorial, Funeral & Grief Ceremonies",
    displayName: "Celebration of Life or Memorial",
    shortName: "Celebration of Life",
    description:
      "A gentle remembrance script for a funeral, wake, memorial, graveside service, pet memorial, or celebration of life.",
    sensitivity: "grief",
    keywords: ["funeral", "memorial", "celebration of life", "wake", "graveside", "passed away", "loss", "eulogy", "remembrance"],
    toneOptions: ["Gentle and Comforting", "Solemn", "Hopeful", "Celebration of Life", "Spiritual", "Non-Religious"],
    requiredQuestions: [
      "What was your loved one's name?",
      "What relationship should the service honor?",
      "Should the service feel religious, spiritual, non-religious, or celebration-of-life?",
      "Are there stories, readings, songs, prayers, or speakers to include?",
    ],
    optionalQuestions: [
      "Is there anything the family wants avoided?",
      "Should the tone include humor, gratitude, hope, or quiet reflection?",
      "Will this include burial, cremation, ashes, or a graveside moment?",
    ],
    storyPrompts: [
      "The kind of person they were and how people experienced them",
      "What they loved: family, work, hobbies, faith, service, or simple joys",
      "Close family, friends, mentors, and meaningful relationships",
      "Accomplishments, lessons, favorite stories, legacy, and what they leave behind",
    ],
    outputTypes: ["memorial_script", "wake_opening_words", "eulogy", "closing_blessing"],
    scriptSections: ["Words of Condolence", "Welcome", "Life Tribute", "Readings or Music", "Reflection", "Closing Words"],
  },
  {
    id: "baby_blessing",
    category: "Family & Child Ceremonies",
    displayName: "Baby Blessing or Naming",
    shortName: "Baby Blessing",
    description:
      "A welcoming ceremony for a child, baby blessing, baby naming, adoption ceremony, godparent moment, or family dedication.",
    sensitivity: "celebratory",
    keywords: ["baby blessing", "baby naming", "child dedication", "adoption", "godparent", "family blessing"],
    toneOptions: ["Tender and Warm", "Spiritual", "Family-Centered", "Joyful", "Non-Religious"],
    requiredQuestions: [
      "What is the child's name?",
      "Who are the parents or guardians?",
      "Should the ceremony feel religious, spiritual, cultural, or non-religious?",
      "Will godparents, grandparents, guardians, or siblings be included?",
    ],
    optionalQuestions: [
      "Should family promises or community promises be included?",
      "Are there readings, prayers, songs, or cultural elements?",
    ],
    storyPrompts: [
      "The child's name, meaning, personality, and family story",
      "Parents, guardians, siblings, grandparents, godparents, or mentors",
      "Family hopes, blessings, promises, values, and traditions",
      "Readings, songs, prayers, cultural elements, or symbolic moments",
    ],
    outputTypes: ["baby_blessing_script", "family_promises", "guardian_blessing", "ceremony_outline"],
    scriptSections: ["Welcome", "Meaning of the Child's Name", "Parent Promises", "Family Blessing", "Community Support", "Closing"],
  },
  {
    id: "vow_renewal",
    category: "Marriage & Relationship Ceremonies",
    displayName: "Vow Renewal",
    shortName: "Vow Renewal",
    description:
      "A recommitment ceremony honoring a couple's shared history, continued promises, anniversary, or renewed vows.",
    sensitivity: "celebratory",
    keywords: ["vow renewal", "renew vows", "anniversary ceremony", "recommitment", "relationship ceremony"],
    toneOptions: ["Romantic", "Warm and Personal", "Family-Centered", "Light and Joyful", "Formal"],
    requiredQuestions: [
      "What are the couple's names?",
      "How many years are they celebrating?",
      "Should the ceremony include renewed vows?",
      "Should children, family, or guests be included?",
    ],
    optionalQuestions: [
      "Should the original wedding day be mentioned?",
      "Are there favorite memories, challenges overcome, or future hopes to include?",
    ],
    storyPrompts: [
      "Their original wedding day and what they remember most",
      "Years together, milestones, family, travel, home, work, or adventures",
      "Challenges overcome and how their love has changed or deepened",
      "Promises for the next season of marriage",
    ],
    outputTypes: ["vow_renewal_script", "renewed_vows", "anniversary_blessing", "ceremony_outline"],
    scriptSections: ["Welcome", "Reflection on Their Journey", "Renewed Promises", "Optional Rings", "Blessing", "Closing"],
  },
  {
    id: "writing_service",
    category: "Script & Writing Services",
    displayName: "Eulogy, Vows, or Speech",
    shortName: "Eulogy, Vows, or Speech",
    description:
      "A writing-only service for vows, eulogies, toasts, readings, ceremony outlines, tribute speeches, or ceremony wording.",
    sensitivity: "neutral",
    keywords: ["vows", "eulogy", "speech", "toast", "reading", "write", "wording", "script editing"],
    toneOptions: ["Heartfelt", "Polished", "Simple and Natural", "Formal", "Light and Warm", "Gentle"],
    requiredQuestions: [
      "What kind of piece should be written?",
      "Who is it for?",
      "What tone should it have?",
      "Are there key stories, promises, memories, or details to include?",
    ],
    optionalQuestions: [
      "Should it sound like the speaker's natural voice?",
      "Is there a word count or speaking time target?",
    ],
    storyPrompts: [
      "Who is speaking and who the piece is for",
      "The most important memory, message, promise, or tribute",
      "Words, stories, humor, faith, gratitude, or emotion to include",
      "The desired ending: blessing, toast, goodbye, commitment, or call to action",
    ],
    outputTypes: ["vows", "eulogy", "toast", "speech", "reading", "ceremony_outline"],
    scriptSections: ["Opening", "Personal Details", "Main Message", "Closing"],
  },
  {
    id: "custom_life_ceremony",
    category: "Custom Life Ceremonies",
    displayName: "Custom Life Ceremony",
    shortName: "Custom Life Ceremony",
    description:
      "A personalized ceremony for a meaningful transition, remembrance, blessing, healing moment, new beginning, or community milestone.",
    sensitivity: "neutral",
    keywords: ["custom", "life ceremony", "blessing", "transition", "new beginning", "healing", "honor", "remember", "ritual"],
    toneOptions: ["Symbolic", "Spiritual", "Non-Religious", "Healing", "Celebratory", "Reflective"],
    requiredQuestions: [
      "What life moment should this ceremony mark?",
      "Is it meant to celebrate, honor, remember, bless, heal, or mark a transition?",
      "Should it feel spiritual, religious, cultural, symbolic, or non-religious?",
      "Who should be included or named?",
    ],
    optionalQuestions: [
      "Should there be a reading, symbolic action, candle, object, blessing, or community response?",
      "Is there anything that should be avoided?",
    ],
    storyPrompts: [
      "The life moment, transition, or milestone being marked",
      "Who is being honored, included, remembered, blessed, or supported",
      "Stories, values, symbols, traditions, or objects that matter",
      "The feeling people should leave with when the ceremony ends",
    ],
    outputTypes: ["custom_ceremony_script", "ceremony_outline", "symbolic_action_wording", "blessing"],
    scriptSections: ["Welcome", "Meaning of the Moment", "Story or Reflection", "Symbolic Action", "Blessing", "Closing"],
  },
]

export function getMrScriptServiceByResponse(response?: string): MrScriptService {
  if (!response) return MR_SCRIPT_SERVICES[0]

  const normalized = response.toLowerCase()
  return (
    MR_SCRIPT_SERVICES.find((service) =>
      [service.id, service.displayName, service.shortName, service.category, ...service.keywords]
        .some((value) => normalized.includes(value.toLowerCase()))
    ) || MR_SCRIPT_SERVICES[MR_SCRIPT_SERVICES.length - 1]
  )
}

export function getMrScriptStoryPrompts(response?: string): string[] {
  return getMrScriptServiceByResponse(response).storyPrompts
}
