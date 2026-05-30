export type ReadingCopyrightStatus =
  | "public_domain"
  | "original_ordainedpro"
  | "user_provided"
  | "licensed"
  | "placeholder_only"

export type ReadingCategory =
  | "bible"
  | "classic_poetry"
  | "original_blessing"
  | "spiritual"
  | "non_religious"
  | "memorial"
  | "family"
  | "cultural"
  | "unity"
  | "song_placeholder"

export type ReadingLength = "short" | "medium" | "long"

export interface CeremonyReading {
  id: string
  title: string
  author: string
  source: string
  category: ReadingCategory
  ceremonyTypes: string[]
  text: string
  length: ReadingLength
  tone: string[]
  tags: string[]
  copyrightStatus: ReadingCopyrightStatus
  allowedUseNotes: string
}

export const READING_CATEGORIES = [
  { value: "none", label: "No Reading" },
  { value: "bible", label: "Bible / Christian" },
  { value: "classic_poetry", label: "Classic Poetry" },
  { value: "original_blessing", label: "OrdainedPro Originals" },
  { value: "spiritual", label: "Spiritual" },
  { value: "non_religious", label: "Non-Religious" },
  { value: "memorial", label: "Memorial / Remembrance" },
  { value: "family", label: "Family-Centered" },
  { value: "cultural", label: "Cultural / Traditional" },
  { value: "unity", label: "Unity Ceremony" },
  { value: "song_placeholder", label: "Song / Lyrics Placeholder" },
] as const

export const CEREMONY_READINGS: CeremonyReading[] = [
  {
    id: "kjv-1-corinthians-13",
    title: "Love Is Patient",
    author: "King James Version",
    source: "1 Corinthians 13:4-8",
    category: "bible",
    ceremonyTypes: ["wedding", "vow_renewal"],
    text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil; rejoiceth not in iniquity, but rejoiceth in the truth; beareth all things, believeth all things, hopeth all things, endureth all things. Charity never faileth.",
    length: "short",
    tone: ["religious", "traditional", "romantic", "formal"],
    tags: ["love", "patience", "marriage", "christian"],
    copyrightStatus: "public_domain",
    allowedUseNotes: "KJV text is public domain in the United States. Confirm local rules for other countries.",
  },
  {
    id: "kjv-ecclesiastes-4",
    title: "A Threefold Cord",
    author: "King James Version",
    source: "Ecclesiastes 4:9-12",
    category: "bible",
    ceremonyTypes: ["wedding", "vow_renewal", "baby_blessing", "coming_of_age"],
    text: "Two are better than one; because they have a good reward for their labour. For if they fall, the one will lift up his fellow. Again, if two lie together, then they have heat: but how can one be warm alone? And if one prevail against him, two shall withstand him; and a threefold cord is not quickly broken.",
    length: "short",
    tone: ["religious", "traditional", "family", "supportive"],
    tags: ["unity", "support", "family", "christian"],
    copyrightStatus: "public_domain",
    allowedUseNotes: "KJV text is public domain in the United States. Confirm local rules for other countries.",
  },
  {
    id: "kjv-ruth-1",
    title: "Whither Thou Goest",
    author: "King James Version",
    source: "Ruth 1:16-17",
    category: "bible",
    ceremonyTypes: ["wedding", "vow_renewal"],
    text: "Whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people. Where thou diest, will I die, and there will I be buried.",
    length: "short",
    tone: ["religious", "devoted", "traditional"],
    tags: ["commitment", "devotion", "christian"],
    copyrightStatus: "public_domain",
    allowedUseNotes: "KJV text is public domain in the United States. Confirm local rules for other countries.",
  },
  {
    id: "kjv-psalm-23",
    title: "The Lord Is My Shepherd",
    author: "King James Version",
    source: "Psalm 23",
    category: "bible",
    ceremonyTypes: ["celebration_of_life", "memorial", "baby_blessing"],
    text: "The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul. Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me.",
    length: "medium",
    tone: ["religious", "comforting", "gentle", "traditional"],
    tags: ["comfort", "grief", "christian", "memorial"],
    copyrightStatus: "public_domain",
    allowedUseNotes: "KJV text is public domain in the United States. Confirm local rules for other countries.",
  },
  {
    id: "shakespeare-sonnet-116",
    title: "Let Me Not to the Marriage of True Minds",
    author: "William Shakespeare",
    source: "Sonnet 116",
    category: "classic_poetry",
    ceremonyTypes: ["wedding", "vow_renewal"],
    text: "Let me not to the marriage of true minds admit impediments. Love is not love which alters when it alteration finds, or bends with the remover to remove. O no, it is an ever-fixed mark that looks on tempests and is never shaken.",
    length: "medium",
    tone: ["romantic", "classic", "formal", "literary"],
    tags: ["love", "steadfast", "classic", "poetry"],
    copyrightStatus: "public_domain",
    allowedUseNotes: "Public-domain classic text.",
  },
  {
    id: "browning-how-do-i-love-thee",
    title: "How Do I Love Thee?",
    author: "Elizabeth Barrett Browning",
    source: "Sonnets from the Portuguese 43",
    category: "classic_poetry",
    ceremonyTypes: ["wedding", "vow_renewal"],
    text: "How do I love thee? Let me count the ways. I love thee to the depth and breadth and height my soul can reach, when feeling out of sight for the ends of being and ideal grace.",
    length: "medium",
    tone: ["romantic", "classic", "devotional", "literary"],
    tags: ["love", "devotion", "classic", "poetry"],
    copyrightStatus: "public_domain",
    allowedUseNotes: "Public-domain classic text.",
  },
  {
    id: "whitman-continuities",
    title: "Continuities",
    author: "Walt Whitman",
    source: "Leaves of Grass",
    category: "classic_poetry",
    ceremonyTypes: ["celebration_of_life", "memorial", "vow_renewal"],
    text: "Nothing is ever really lost, or can be lost, no birth, identity, form, no object of the world. Nor life, nor force, nor any visible thing.",
    length: "short",
    tone: ["spiritual", "hopeful", "reflective", "gentle"],
    tags: ["legacy", "continuity", "memorial", "poetry"],
    copyrightStatus: "public_domain",
    allowedUseNotes: "Public-domain classic text.",
  },
  {
    id: "dickinson-hope",
    title: "Hope Is the Thing with Feathers",
    author: "Emily Dickinson",
    source: "Poem 314",
    category: "classic_poetry",
    ceremonyTypes: ["celebration_of_life", "memorial", "coming_of_age", "baby_blessing"],
    text: "Hope is the thing with feathers that perches in the soul, and sings the tune without the words, and never stops at all.",
    length: "short",
    tone: ["hopeful", "gentle", "literary", "spiritual"],
    tags: ["hope", "comfort", "resilience", "poetry"],
    copyrightStatus: "public_domain",
    allowedUseNotes: "Public-domain classic text.",
  },
  {
    id: "op-wedding-heart-of-the-room",
    title: "The Heart of the Room",
    author: "OrdainedPro",
    source: "Original OrdainedPro reading",
    category: "original_blessing",
    ceremonyTypes: ["wedding", "vow_renewal"],
    text: "A ceremony is not only the moment two people make promises. It is the moment everyone present is invited to remember why love matters. It asks us to pause, to witness, and to bless the life being built in front of us.",
    length: "short",
    tone: ["warm", "personal", "non_religious", "romantic"],
    tags: ["love", "witness", "community", "opening"],
    copyrightStatus: "original_ordainedpro",
    allowedUseNotes: "Original OrdainedPro text for use inside OrdainedPro ceremonies.",
  },
  {
    id: "op-wedding-everyday-love",
    title: "Everyday Love",
    author: "OrdainedPro",
    source: "Original OrdainedPro reading",
    category: "non_religious",
    ceremonyTypes: ["wedding", "vow_renewal"],
    text: "Love is found in the promises spoken today, but it is also found in ordinary days: in patience, laughter, forgiveness, small kindnesses, shared work, and the choice to keep turning toward one another.",
    length: "short",
    tone: ["warm", "modern", "non_religious", "grounded"],
    tags: ["daily love", "marriage", "commitment"],
    copyrightStatus: "original_ordainedpro",
    allowedUseNotes: "Original OrdainedPro text for use inside OrdainedPro ceremonies.",
  },
  {
    id: "op-memorial-all-who-are-missed",
    title: "All Who Are Missed",
    author: "OrdainedPro",
    source: "Original OrdainedPro remembrance",
    category: "memorial",
    ceremonyTypes: ["wedding", "vow_renewal", "celebration_of_life", "memorial"],
    text: "Before we continue, we take a quiet moment to honor the loved ones who are not physically with us today. Their love, lessons, laughter, and memory remain part of this gathering, and part of the lives we carry forward.",
    length: "short",
    tone: ["gentle", "inclusive", "remembrance", "non_religious"],
    tags: ["remembrance", "general loved ones", "memorial", "inclusive"],
    copyrightStatus: "original_ordainedpro",
    allowedUseNotes: "Original OrdainedPro text. Designed to avoid excluding unnamed loved ones.",
  },
  {
    id: "op-celebration-of-life-legacy",
    title: "What Love Leaves Behind",
    author: "OrdainedPro",
    source: "Original OrdainedPro memorial reading",
    category: "memorial",
    ceremonyTypes: ["celebration_of_life", "memorial"],
    text: "A life is not measured only by dates or milestones. It is measured in the love given, the stories remembered, the habits passed on, the comfort offered, and the quiet ways one person continues to shape the people who loved them.",
    length: "short",
    tone: ["gentle", "grief-aware", "legacy", "non_religious"],
    tags: ["legacy", "comfort", "remembrance", "life tribute"],
    copyrightStatus: "original_ordainedpro",
    allowedUseNotes: "Original OrdainedPro text for use inside OrdainedPro ceremonies.",
  },
  {
    id: "op-baby-blessing-welcome-child",
    title: "Welcome to This Circle",
    author: "OrdainedPro",
    source: "Original OrdainedPro blessing",
    category: "family",
    ceremonyTypes: ["baby_blessing"],
    text: "Today we welcome this child into a circle of love. May they grow with kindness around them, courage within them, and people beside them who will teach, protect, guide, and celebrate who they are becoming.",
    length: "short",
    tone: ["tender", "family", "spiritual", "non_religious"],
    tags: ["child", "family", "welcome", "blessing"],
    copyrightStatus: "original_ordainedpro",
    allowedUseNotes: "Original OrdainedPro text for use inside OrdainedPro ceremonies.",
  },
  {
    id: "op-coming-of-age-threshold",
    title: "A Threshold Moment",
    author: "OrdainedPro",
    source: "Original OrdainedPro reading",
    category: "family",
    ceremonyTypes: ["coming_of_age"],
    text: "A milestone is not a finish line. It is a threshold. Today honors who you have been, who you are becoming, and the family, mentors, and community who walk beside you as your life opens into its next chapter.",
    length: "short",
    tone: ["joyful", "family", "mentor", "hopeful"],
    tags: ["coming of age", "family", "future", "mentor"],
    copyrightStatus: "original_ordainedpro",
    allowedUseNotes: "Original OrdainedPro text for use inside OrdainedPro ceremonies.",
  },
  {
    id: "op-unity-candle",
    title: "Unity Candle Reflection",
    author: "OrdainedPro",
    source: "Original OrdainedPro unity reading",
    category: "unity",
    ceremonyTypes: ["wedding", "vow_renewal", "family"],
    text: "The lighting of this candle is a simple act with a lasting meaning. Two flames remain themselves, yet together they create one shared light, a symbol of the life, home, and future being formed here today.",
    length: "short",
    tone: ["warm", "symbolic", "romantic", "family"],
    tags: ["unity candle", "symbolic", "ritual"],
    copyrightStatus: "original_ordainedpro",
    allowedUseNotes: "Original OrdainedPro text for use inside OrdainedPro ceremonies.",
  },
  {
    id: "op-family-blessing",
    title: "Family Blessing",
    author: "OrdainedPro",
    source: "Original OrdainedPro family reading",
    category: "family",
    ceremonyTypes: ["wedding", "vow_renewal", "baby_blessing", "coming_of_age"],
    text: "Family is not only the people who stand beside us on easy days. Family is the circle that reminds us who we are, helps us rise when life is heavy, and celebrates the moments that deserve to be remembered.",
    length: "short",
    tone: ["family", "warm", "supportive", "non_religious"],
    tags: ["family involvement", "community", "support"],
    copyrightStatus: "original_ordainedpro",
    allowedUseNotes: "Original OrdainedPro text for use inside OrdainedPro ceremonies.",
  },
  {
    id: "song-lyrics-placeholder",
    title: "Song Lyric Placement",
    author: "User-provided or licensed lyrics",
    source: "Copyrighted song lyrics placeholder",
    category: "song_placeholder",
    ceremonyTypes: ["wedding", "vow_renewal", "celebration_of_life", "memorial", "coming_of_age"],
    text: "[Insert the couple's selected song lyric or song reading here only if they provide the text and have permission to use it. Mr. Script can write original transition wording before and after the song moment.]",
    length: "short",
    tone: ["music", "custom", "copyright-safe"],
    tags: ["song", "lyrics", "permission", "placeholder"],
    copyrightStatus: "placeholder_only",
    allowedUseNotes: "Do not generate full copyrighted song lyrics. Use only user-provided or licensed text.",
  },
]

const normalizeMatchText = (value: string) =>
  value.toLowerCase().replace(/[_-]/g, " ").trim()

export const getReadingsByCategory = (category: string): CeremonyReading[] => {
  if (category === "none") return []
  return CEREMONY_READINGS.filter((reading) => reading.category === category)
}

export const getRandomReading = (category: string): CeremonyReading | null => {
  const readings = getReadingsByCategory(category)
  if (readings.length === 0) return null
  return readings[Math.floor(Math.random() * readings.length)]
}

export const getReadingRecommendations = ({
  ceremonyType,
  tone,
  specialInclusions,
  faithPreference,
  limit = 5,
}: {
  ceremonyType?: string
  tone?: string
  specialInclusions?: string
  faithPreference?: string
  limit?: number
}) => {
  const ceremony = normalizeMatchText(ceremonyType || "")
  const toneText = normalizeMatchText(tone || "")
  const inclusionText = normalizeMatchText(specialInclusions || "")
  const faithText = normalizeMatchText(faithPreference || "")
  const combined = `${ceremony} ${toneText} ${inclusionText} ${faithText}`

  return CEREMONY_READINGS
    .map((reading) => {
      let score = 0
      if (reading.ceremonyTypes.some((type) => combined.includes(normalizeMatchText(type)))) score += 6
      if (reading.tone.some((item) => combined.includes(normalizeMatchText(item)))) score += 3
      if (reading.tags.some((tag) => combined.includes(normalizeMatchText(tag)))) score += 3
      if (faithText.includes("religious") && reading.category === "bible") score += 5
      if (faithText.includes("christian") && reading.category === "bible") score += 5
      if (faithText.includes("non religious") && ["non_religious", "original_blessing"].includes(reading.category)) score += 4
      if (combined.includes("loved") || combined.includes("remembrance") || combined.includes("passed")) {
        if (reading.category === "memorial") score += 5
      }
      if (combined.includes("family")) {
        if (reading.category === "family") score += 4
      }
      if (combined.includes("unity")) {
        if (reading.category === "unity") score += 4
      }
      if (combined.includes("song") || combined.includes("lyrics")) {
        if (reading.category === "song_placeholder") score += 6
      }

      return { reading, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.reading.title.localeCompare(b.reading.title))
    .slice(0, limit)
    .map(({ reading }) => reading)
}

export const formatReadingsForPrompt = (readings: CeremonyReading[]) => {
  if (!readings.length) return "No library readings matched yet."

  return readings
    .map((reading) => [
      `Title: ${reading.title}`,
      `Source: ${reading.author}${reading.source ? `, ${reading.source}` : ""}`,
      `Use status: ${reading.copyrightStatus}`,
      `Use notes: ${reading.allowedUseNotes}`,
      `Suggested text: ${reading.text}`,
    ].join("\n"))
    .join("\n\n")
}
