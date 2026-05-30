export type MrScriptSensitivity = "celebratory" | "grief" | "neutral"

export type CeremonyLegalStatus = "yes" | "no" | "possibly" | "writing_only"
export type CeremonyVirtualStatus = "yes" | "no" | "depends" | "writing_only"
export type CeremonyReligiousCulturalStatus = "optional" | "required" | "no"

export type MrScriptService = {
  id: string
  category: string
  displayName: string
  shortName: string
  description: string
  sensitivity: MrScriptSensitivity
  legalStatus: CeremonyLegalStatus
  griefRelated: boolean
  writingOnly: boolean
  religiousOrCultural?: CeremonyReligiousCulturalStatus
  virtualAvailable: CeremonyVirtualStatus
  canBeWritingOnly?: boolean
  aliases: string[]
  keywords: string[]
  userPhrases: string[]
  toneOptions: string[]
  toneRules: string[]
  requiredQuestions: string[]
  optionalQuestions: string[]
  storyPrompts: string[]
  intakeQuestionGroups: {
    id: string
    title: string
    prompt: string
    helpText: string
  }[]
  outputTypes: string[]
  scriptSections: string[]
  officiantRequirements?: string[]
  clientFacingDescription?: string
  priceField?: string
  defaultDuration?: string
  travelRequired?: "yes" | "no" | "depends"
  suggestedChecklist?: string[]
  adminServiceTags?: string[]
}

export const MR_SCRIPT_SERVICE_CATEGORIES = [
  "Marriage & Relationship Ceremonies",
  "Coming-of-Age Ceremonies",
  "Memorial, Funeral & Grief Ceremonies",
  "Family & Child Ceremonies",
  "Spiritual & Personal Milestone Ceremonies",
  "Cultural & Religious Ceremony Support",
  "Script & Writing Services",
  "Planning, Rehearsal & Day-Of Support",
  "Custom Life Ceremonies",
]

export const MR_SCRIPT_SERVICE_OPTIONS = [
  "Wedding",
  "Elopement or License Signing",
  "Vow Renewal",
  "Coming-of-Age",
  "Celebration of Life",
  "Pet Memorial",
  "Baby Blessing",
  "Family Ceremony",
  "Cultural or Religious Tradition",
  "Spiritual or Milestone Ceremony",
  "Eulogy, Vows, or Speech",
  "Rehearsal or Ceremony Planning",
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

const commonRelationshipKeywords = [
  "wedding",
  "marry",
  "marriage",
  "ceremony",
  "commitment ceremony",
  "handfasting",
  "unity ceremony",
  "ring ceremony",
  "rings",
  "vows",
  "lgbtq",
  "interfaith",
  "bilingual wedding",
  "destination wedding",
  "hospital wedding",
  "jail wedding",
  "prison wedding",
  "bedside wedding",
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
    legalStatus: "possibly",
    griefRelated: false,
    writingOnly: false,
    virtualAvailable: "depends",
    aliases: ["legal wedding ceremony", "civil ceremony", "religious wedding", "spiritual wedding", "non-religious wedding", "commitment ceremony", "handfasting"],
    keywords: commonRelationshipKeywords,
    userPhrases: ["I need someone to marry us", "We are getting married", "We need a wedding officiant", "We want a non-religious ceremony"],
    toneOptions: ["Formal and Traditional", "Warm and Personal", "Light and Joyful", "Intimate and Romantic", "Fun and Casual", "Cultural or Interfaith"],
    toneRules: [
      "Use warm, celebratory language.",
      "Ask whether the ceremony is legal or symbolic before using legal pronouncement language.",
      "Do not assume religion, gender roles, or family structure.",
    ],
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
      "Should family members, children, or guests be included?",
    ],
    storyPrompts: [
      "Individual backgrounds before they met",
      "How they first met and first impressions",
      "Early dates, favorite memories, or funny moments",
      "Milestones, proposal, family, challenges, and future hopes",
    ],
    intakeQuestionGroups: [
      {
        id: "relationship-story",
        title: "Relationship story",
        prompt: "What relationship story details would make this wedding feel personal?",
        helpText: "Helpful notes include how they met, what they love about each other, the proposal, family moments, challenges, or future hopes.",
      },
      {
        id: "ceremony-elements",
        title: "Ceremony elements",
        prompt: "Which wedding ceremony elements should be included or skipped?",
        helpText: "Mention vows, rings, unity ceremony, readings, prayers, remembrance, cultural traditions, family involvement, or anything the couple wants kept simple.",
      },
    ],
    outputTypes: ["ceremony_script", "ceremony_outline", "vow_wording", "reading_suggestions", "checklist"],
    scriptSections: ["Processional", "Welcome", "Reflection", "Declaration of Intent", "Vows", "Rings", "Pronouncement", "Recessional"],
    officiantRequirements: ["Confirm local marriage-law requirements.", "Confirm whether the couple has a valid marriage license when legal solemnization is requested."],
    clientFacingDescription: "A personalized wedding ceremony service for legal or symbolic celebrations.",
    defaultDuration: "15-30 minutes",
    travelRequired: "depends",
  },
  {
    id: "elopement_license_signing",
    category: "Marriage & Relationship Ceremonies",
    displayName: "Elopement or License Signing",
    shortName: "Elopement",
    description:
      "A short legal, civil, emergency, micro-wedding, elopement, or license-signing focused service.",
    sensitivity: "celebratory",
    legalStatus: "possibly",
    griefRelated: false,
    writingOnly: false,
    virtualAvailable: "depends",
    aliases: ["elopement", "micro-wedding", "civil ceremony", "license signing", "papers signed", "courthouse-style ceremony", "emergency wedding"],
    keywords: ["elope", "elopement", "license", "papers", "signing", "civil", "micro wedding", "micro-wedding", "emergency wedding", "quick wedding"],
    userPhrases: ["We just want the papers signed", "We need a quick legal ceremony", "We are eloping", "We only need the marriage license signed"],
    toneOptions: ["Simple and Legal", "Warm and Brief", "Civil and Professional", "Intimate", "Light and Joyful"],
    toneRules: [
      "Keep the ceremony brief unless the user asks for more.",
      "Mention legal requirements only generally; do not give legal advice.",
      "Confirm whether vows, rings, or guests are included.",
    ],
    requiredQuestions: [
      "What are the couple's names?",
      "Is this a legal signing, a short ceremony, or both?",
      "Where will the signing or ceremony take place?",
      "Do you want vows, rings, or only the required legal wording?",
    ],
    optionalQuestions: [
      "Will there be witnesses or guests?",
      "Do you want a short personal reading or blessing?",
      "Is this urgent or scheduled in advance?",
    ],
    storyPrompts: [
      "Why they chose a small or simple ceremony",
      "Whether this should feel purely legal or still warm and personal",
      "Any guests, witnesses, or family members present",
    ],
    intakeQuestionGroups: [
      {
        id: "legal-logistics",
        title: "Legal logistics",
        prompt: "What legal or logistical details should the officiant know?",
        helpText: "Mention location, witnesses, marriage license status, timing, and whether the couple wants vows, rings, or a signing-only service.",
      },
      {
        id: "brief-personalization",
        title: "Brief personalization",
        prompt: "Should this short ceremony include any personal words?",
        helpText: "A sentence or two about the couple, a brief blessing, or a simple reading can make even a quick ceremony feel meaningful.",
      },
    ],
    outputTypes: ["short_ceremony_script", "license_signing_script", "ceremony_outline", "client_email"],
    scriptSections: ["Welcome", "Legal Intent", "Optional Vows or Rings", "Pronouncement", "Signing Reminder"],
    defaultDuration: "5-10 minutes",
    travelRequired: "depends",
  },
  {
    id: "vow_renewal",
    category: "Marriage & Relationship Ceremonies",
    displayName: "Vow Renewal",
    shortName: "Vow Renewal",
    description:
      "A recommitment ceremony honoring a couple's shared history, continued promises, anniversary, or renewed vows.",
    sensitivity: "celebratory",
    legalStatus: "no",
    griefRelated: false,
    writingOnly: false,
    virtualAvailable: "yes",
    aliases: ["anniversary ceremony", "recommitment ceremony", "renew vows", "renewal ceremony"],
    keywords: ["vow renewal", "renew vows", "anniversary ceremony", "recommitment", "relationship ceremony", "anniversary"],
    userPhrases: ["We want to renew our vows", "We are celebrating our anniversary", "We want to recommit to each other"],
    toneOptions: ["Romantic", "Warm and Personal", "Family-Centered", "Light and Joyful", "Formal"],
    toneRules: [
      "Do not include legal pronouncement language.",
      "Honor the couple's history and future promises.",
      "Invite children or family into the moment when requested.",
    ],
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
    intakeQuestionGroups: [
      {
        id: "shared-journey",
        title: "Shared journey",
        prompt: "What should be highlighted about the couple's years together?",
        helpText: "Include years married, family, milestones, original wedding memories, growth, challenges, humor, gratitude, and hopes for the next chapter.",
      },
      {
        id: "renewal-elements",
        title: "Renewal elements",
        prompt: "Which vow renewal moments should be included?",
        helpText: "Mention renewed vows, ring rededication, children or family involvement, readings, prayer, music, or a brief anniversary blessing.",
      },
    ],
    outputTypes: ["vow_renewal_script", "renewed_vows", "anniversary_blessing", "ceremony_outline"],
    scriptSections: ["Welcome", "Reflection on Their Journey", "Renewed Promises", "Optional Rings", "Blessing", "Closing"],
    defaultDuration: "10-20 minutes",
    travelRequired: "depends",
  },
  {
    id: "coming_of_age",
    category: "Coming-of-Age Ceremonies",
    displayName: "Coming-of-Age Ceremony",
    shortName: "Coming-of-Age",
    description:
      "A family-centered milestone ceremony such as a Quinceanera, sweet sixteen, graduation blessing, youth blessing, or rite of passage.",
    sensitivity: "celebratory",
    legalStatus: "no",
    griefRelated: false,
    writingOnly: false,
    virtualAvailable: "yes",
    aliases: ["Quinceanera Ceremony", "Sweet Sixteen Ceremony", "Rite of Passage", "Graduation Blessing", "Youth Blessing"],
    keywords: ["quinceanera", "quince", "sweet sixteen", "sweet 16", "coming of age", "15th birthday", "daughter turning 15", "rite of passage", "graduation blessing", "court of honor"],
    userPhrases: ["My daughter is turning 15", "We need a quince blessing", "We need a sweet sixteen ceremony", "We want a coming-of-age ceremony"],
    toneOptions: ["Joyful and Family-Centered", "Traditional", "Spiritual", "Cultural", "Bilingual", "Light and Warm"],
    toneRules: [
      "Honor the honoree without infantilizing them.",
      "Ask about faith, language, and cultural traditions before including them.",
      "Keep family roles respectful and flexible.",
    ],
    requiredQuestions: [
      "What is the honoree's name?",
      "What milestone is being celebrated?",
      "Should the ceremony feel religious, spiritual, cultural, non-religious, or bilingual?",
      "Which family members or mentors should be mentioned?",
    ],
    optionalQuestions: [
      "Should traditions like candle, crown, shoe, Bible, rosary, parent blessing, or court of honor be included?",
      "Should grandparents, godparents, or siblings have speaking moments?",
      "Should the ceremony be in English, Spanish, or bilingual?",
    ],
    storyPrompts: [
      "The honoree's personality, values, talents, and interests",
      "Accomplishments, school, faith, culture, sports, arts, or service",
      "Family members, mentors, or friends who helped shape them",
      "Future hopes such as college, career, travel, goals, or adulthood",
    ],
    intakeQuestionGroups: [
      {
        id: "honoree-story",
        title: "Honoree story",
        prompt: "What should the ceremony say about the person being honored?",
        helpText: "Include personality, achievements, family relationships, interests, faith or culture, and what makes this milestone meaningful.",
      },
      {
        id: "family-traditions",
        title: "Family traditions",
        prompt: "Are there family, cultural, religious, or symbolic traditions to include?",
        helpText: "Examples include candle, crown, shoe, Bible, rosary, parent blessing, court of honor, mentor words, or a custom family moment.",
      },
    ],
    outputTypes: ["ceremony_script", "family_blessing", "parent_speech", "bilingual_welcome", "ceremony_outline"],
    scriptSections: ["Welcome", "Meaning of the Milestone", "Family Recognition", "Traditions", "Blessing", "Closing"],
    defaultDuration: "15-30 minutes",
    travelRequired: "depends",
  },
  {
    id: "celebration_of_life",
    category: "Memorial, Funeral & Grief Ceremonies",
    displayName: "Celebration of Life or Memorial",
    shortName: "Celebration of Life",
    description:
      "A gentle remembrance script for a funeral, wake, memorial, graveside service, pet memorial, or celebration of life.",
    sensitivity: "grief",
    legalStatus: "no",
    griefRelated: true,
    writingOnly: false,
    virtualAvailable: "yes",
    aliases: ["wake officiant", "funeral service", "memorial service", "graveside service", "ash scattering", "vigil", "pet memorial"],
    keywords: ["funeral", "memorial", "celebration of life", "wake", "graveside", "passed away", "loss", "died", "eulogy", "remembrance", "ashes", "vigil", "pet memorial", "dog passed", "cat passed"],
    userPhrases: ["My father passed away", "We need someone to speak at the wake", "My dog passed away", "We need a graveside service"],
    toneOptions: ["Gentle and Comforting", "Solemn", "Hopeful", "Celebration of Life", "Spiritual", "Non-Religious"],
    toneRules: [
      "Express condolences before asking logistical questions.",
      "Use gentle, compassionate language.",
      "Do not sound salesy or overly cheerful.",
      "Do not assume religious beliefs.",
      "Avoid humor unless the family asks for a celebration-of-life tone.",
    ],
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
      "Should military honors, candle lighting, or a closing ritual be included?",
    ],
    storyPrompts: [
      "The kind of person they were and how people experienced them",
      "What they loved: family, work, hobbies, faith, service, or simple joys",
      "Close family, friends, mentors, and meaningful relationships",
      "Accomplishments, lessons, favorite stories, legacy, and what they leave behind",
    ],
    intakeQuestionGroups: [
      {
        id: "life-story",
        title: "Life story",
        prompt: "What should be remembered about the person being honored?",
        helpText: "Share who they were, what they loved, important family and friends, accomplishments, favorite memories, lessons, and legacy.",
      },
      {
        id: "service-tone",
        title: "Service tone",
        prompt: "How should this service feel for the family and guests?",
        helpText: "Mention whether it should be solemn, hopeful, spiritual, non-religious, story-filled, brief, gently humorous, or mostly quiet reflection.",
      },
      {
        id: "memorial-elements",
        title: "Memorial elements",
        prompt: "Are there readings, songs, speakers, prayers, military honors, or closing rituals to include?",
        helpText: "Only include details the family is comfortable sharing. If something is sensitive, note how carefully it should be handled.",
      },
    ],
    outputTypes: ["memorial_script", "wake_opening_words", "eulogy", "graveside_service", "closing_blessing", "celebration_of_life_outline"],
    scriptSections: ["Words of Condolence", "Welcome", "Life Tribute", "Readings or Music", "Reflection", "Closing Words"],
    priceField: "memorial_service_fee",
    defaultDuration: "10-30 minutes",
    travelRequired: "depends",
    suggestedChecklist: ["Confirm service location and time", "Collect life story notes", "Confirm speakers, readings, music, and prayers", "Ask family what should be avoided"],
    adminServiceTags: ["funeral", "wake", "memorial", "celebration_of_life", "grief"],
  },
  {
    id: "pet_memorial",
    category: "Memorial, Funeral & Grief Ceremonies",
    displayName: "Pet Memorial",
    shortName: "Pet Memorial",
    description:
      "A gentle remembrance ceremony or written tribute for a beloved pet, companion animal, or family animal memorial.",
    sensitivity: "grief",
    legalStatus: "no",
    griefRelated: true,
    writingOnly: false,
    religiousOrCultural: "optional",
    virtualAvailable: "yes",
    canBeWritingOnly: true,
    aliases: ["pet funeral", "dog memorial", "cat memorial", "animal memorial", "pet tribute", "pet remembrance"],
    keywords: ["pet memorial", "pet funeral", "dog passed", "cat passed", "my dog died", "my cat died", "beloved pet", "animal memorial", "pet tribute", "rainbow bridge"],
    userPhrases: ["My dog passed away", "My cat died", "We want to remember our pet", "We need words for a pet memorial"],
    toneOptions: ["Gentle and Comforting", "Warm and Grateful", "Family-Centered", "Non-Religious", "Spiritual"],
    toneRules: [
      "Treat the pet as a meaningful family relationship.",
      "Use gentle, compassionate language without minimizing the loss.",
      "Do not overuse cliches like rainbow bridge unless the family requests that language.",
    ],
    requiredQuestions: [
      "What was the pet's name?",
      "What kind of pet or companion animal are they remembering?",
      "Who should be included in the remembrance?",
      "Should the tone be spiritual, non-religious, gentle, hopeful, or celebration-of-life?",
    ],
    optionalQuestions: [
      "Are there favorite memories, habits, nicknames, or places to include?",
      "Will there be a burial, ashes, photo table, candle, or keepsake moment?",
      "Should children or family members have a short speaking part?",
    ],
    storyPrompts: [
      "The pet's name, personality, favorite habits, and quirks",
      "How the family found or adopted them",
      "Favorite memories, places, routines, and the comfort they brought",
      "What the family wants to say goodbye to or be grateful for",
    ],
    intakeQuestionGroups: [
      {
        id: "pet-life-story",
        title: "Pet life story",
        prompt: "What should be remembered about this beloved pet?",
        helpText: "Share their name, personality, favorite routines, how they joined the family, and what made them special.",
      },
      {
        id: "pet-remembrance-elements",
        title: "Remembrance elements",
        prompt: "Should the memorial include a candle, ashes, burial, photo table, keepsake, reading, or family speaking moment?",
        helpText: "These details help create a tender service without making the family repeat everything during a hard moment.",
      },
    ],
    outputTypes: ["pet_memorial_script", "pet_tribute", "closing_blessing", "family_reading", "memorial_outline"],
    scriptSections: ["Words of Sympathy", "Welcome", "Pet Life Tribute", "Family Reflection", "Remembrance Moment", "Closing Words"],
    priceField: "pet_memorial_fee",
    defaultDuration: "5-15 minutes",
    travelRequired: "depends",
    suggestedChecklist: ["Collect pet name and story", "Confirm remembrance setting", "Ask about children or family speakers", "Confirm burial, ashes, candle, or keepsake details"],
    adminServiceTags: ["pet_memorial", "grief", "tribute", "writing_optional"],
  },
  {
    id: "baby_blessing",
    category: "Family & Child Ceremonies",
    displayName: "Baby Blessing or Naming",
    shortName: "Baby Blessing",
    description:
      "A welcoming ceremony for a child, baby blessing, baby naming, adoption ceremony, godparent moment, or family dedication.",
    sensitivity: "celebratory",
    legalStatus: "no",
    griefRelated: false,
    writingOnly: false,
    virtualAvailable: "yes",
    aliases: ["baby naming ceremony", "child dedication", "godparent ceremony", "adoption welcome", "family dedication"],
    keywords: ["baby blessing", "baby naming", "child dedication", "adoption", "godparent", "family blessing", "guardian blessing", "sibling welcome"],
    userPhrases: ["We want a baby blessing", "We need a baby naming ceremony", "We adopted and want a family ceremony"],
    toneOptions: ["Tender and Warm", "Spiritual", "Family-Centered", "Joyful", "Non-Religious"],
    toneRules: [
      "Center the child and family with tender language.",
      "Ask about religious or non-religious expectations before using blessing language.",
      "Include guardians, godparents, siblings, or community promises only if requested.",
    ],
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
    intakeQuestionGroups: [
      {
        id: "child-family",
        title: "Child and family",
        prompt: "What should the ceremony say about the child and family?",
        helpText: "Include the child's name, name meaning, parents or guardians, siblings, godparents, grandparents, adoption story, or family values.",
      },
      {
        id: "family-promises",
        title: "Family promises",
        prompt: "What promises, blessings, or hopes should be spoken over the child?",
        helpText: "These can be spiritual, religious, cultural, non-religious, or simple words of love and support.",
      },
    ],
    outputTypes: ["baby_blessing_script", "family_promises", "guardian_blessing", "ceremony_outline"],
    scriptSections: ["Welcome", "Meaning of the Child's Name", "Parent Promises", "Family Blessing", "Community Support", "Closing"],
    defaultDuration: "10-20 minutes",
    travelRequired: "depends",
  },
  {
    id: "family_ceremony",
    category: "Family & Child Ceremonies",
    displayName: "Family Ceremony",
    shortName: "Family Ceremony",
    description:
      "A ceremony for adoption, blended family unity, foster family welcome, sibling welcome, guardian blessing, or new family home blessing.",
    sensitivity: "celebratory",
    legalStatus: "no",
    griefRelated: false,
    writingOnly: false,
    virtualAvailable: "yes",
    aliases: ["adoption ceremony", "foster family welcome", "blended family unity", "family unity ceremony", "guardian blessing", "new family home blessing"],
    keywords: ["adoption", "foster", "blended family", "family unity", "guardian", "sibling welcome", "family ceremony", "new family", "home blessing"],
    userPhrases: ["We are blending our families", "We want an adoption ceremony", "We want to welcome a child into the family"],
    toneOptions: ["Tender and Warm", "Family-Centered", "Joyful", "Healing", "Non-Religious", "Spiritual"],
    toneRules: [
      "Use inclusive family language.",
      "Avoid implying all family transitions are simple or painless.",
      "Ask who should be named, included, or protected from public mention.",
    ],
    requiredQuestions: [
      "What family moment should this ceremony mark?",
      "Who should be included or named?",
      "Should it feel religious, spiritual, symbolic, cultural, or non-religious?",
      "Are there promises, readings, or symbolic actions to include?",
    ],
    optionalQuestions: [
      "Should children or guardians speak?",
      "Is there any sensitive family history that should be avoided?",
      "Should a keepsake, candle, sand, or family blessing be included?",
    ],
    storyPrompts: [
      "The family transition being honored",
      "Names and roles of parents, guardians, children, siblings, or mentors",
      "Promises, hopes, support, and values",
      "Any sensitive dynamics to handle gently",
    ],
    intakeQuestionGroups: [
      {
        id: "family-story",
        title: "Family story",
        prompt: "What family story or transition should this ceremony honor?",
        helpText: "Mention who is involved, what is being welcomed or blessed, and how formal, spiritual, or personal it should feel.",
      },
      {
        id: "family-symbols",
        title: "Family symbols",
        prompt: "Are there promises, objects, readings, or symbolic actions to include?",
        helpText: "Examples include candles, sand, keepsakes, family vows, parent promises, community promises, or a blessing.",
      },
    ],
    outputTypes: ["family_ceremony_script", "family_promises", "blessing", "ceremony_outline"],
    scriptSections: ["Welcome", "Meaning of This Family Moment", "Family Recognition", "Promises or Symbolic Action", "Blessing", "Closing"],
    defaultDuration: "10-20 minutes",
    travelRequired: "depends",
  },
  {
    id: "cultural_religious_tradition",
    category: "Cultural & Religious Ceremony Support",
    displayName: "Cultural or Religious Tradition Support",
    shortName: "Cultural Tradition",
    description:
      "Support for ceremony wording around requested faith, spiritual, cultural, bilingual, interfaith, or family traditions while reminding the officiant to stay within their comfort and authority.",
    sensitivity: "neutral",
    legalStatus: "no",
    griefRelated: false,
    writingOnly: false,
    religiousOrCultural: "required",
    virtualAvailable: "depends",
    canBeWritingOnly: true,
    aliases: ["interfaith ceremony", "bilingual ceremony", "handfasting", "jumping the broom", "lasso ceremony", "arras ceremony", "tea ceremony", "chuppah", "breaking the glass"],
    keywords: [
      "interfaith",
      "bilingual",
      "spanish english",
      "religious tradition",
      "cultural tradition",
      "handfasting",
      "jumping the broom",
      "lasso",
      "arras",
      "tea ceremony",
      "chuppah",
      "breaking the glass",
      "filipino tradition",
      "mexican tradition",
      "celtic",
      "pagan",
      "wiccan",
      "christian",
      "jewish inspired",
      "buddhist inspired",
      "hindu inspired",
      "muslim inspired",
    ],
    userPhrases: [
      "We want a bilingual ceremony",
      "Can you include jumping the broom?",
      "We want a lasso ceremony",
      "We want an interfaith wedding",
      "Can we include a family cultural tradition?",
    ],
    toneOptions: ["Respectful", "Cultural", "Spiritual", "Interfaith", "Family-Centered", "Educational"],
    toneRules: [
      "Do not claim cultural, religious, or spiritual authority the officiant has not confirmed.",
      "Use respectful wording and ask the family or couple to confirm accuracy.",
      "When a tradition is culturally specific, suggest honoring it with permission, context, and care.",
      "Avoid appropriating Indigenous or closed traditions. Ask whether the officiant is invited or qualified to include them.",
    ],
    requiredQuestions: [
      "Which tradition, faith element, language, or cultural moment should be included?",
      "Who requested this tradition and how should it be explained to guests?",
      "Should the wording be religious, spiritual, cultural, bilingual, or symbolic?",
      "Is there a family member, elder, clergy person, or cultural guide who should approve the wording?",
    ],
    optionalQuestions: [
      "Should the tradition be briefly explained before it happens?",
      "Should guests participate or simply witness it?",
      "Are there words, prayers, objects, music, or family roles that must be handled exactly?",
      "Is there anything the officiant should avoid saying?",
    ],
    storyPrompts: [
      "The tradition or cultural element being included",
      "Why it matters to the couple, family, honoree, or community",
      "Who should perform, explain, bless, or witness it",
      "Words, translations, objects, symbols, or boundaries that must be respected",
    ],
    intakeQuestionGroups: [
      {
        id: "tradition-context",
        title: "Tradition context",
        prompt: "What tradition, faith element, language, or cultural moment should be included?",
        helpText: "Name the tradition and explain who requested it, why it matters, and whether wording should be approved by family, clergy, elders, or a cultural guide.",
      },
      {
        id: "tradition-boundaries",
        title: "Tradition boundaries",
        prompt: "Are there exact words, objects, translations, roles, or boundaries the officiant should respect?",
        helpText: "This helps the officiant include the tradition carefully without guessing or misrepresenting the meaning.",
      },
    ],
    outputTypes: ["tradition_wording", "ceremony_insert", "guest_explanation", "bilingual_welcome", "officiant_note"],
    scriptSections: ["Context for Guests", "Transition Into Tradition", "Tradition Wording", "Family or Guest Participation", "Transition Back to Ceremony"],
    officiantRequirements: [
      "Confirm the officiant is comfortable and invited to include this tradition.",
      "For legal weddings, confirm this tradition does not replace required legal language.",
      "Ask the family or couple to review sensitive cultural or religious wording before the ceremony.",
    ],
    clientFacingDescription: "Respectful support for cultural, religious, bilingual, interfaith, or symbolic ceremony moments.",
    priceField: "cultural_tradition_support_fee",
    defaultDuration: "5-15 minutes",
    travelRequired: "depends",
    suggestedChecklist: ["Confirm requested tradition", "Identify who approves wording", "Confirm objects, roles, and timing", "Add pronunciation or translation notes"],
    adminServiceTags: ["cultural", "religious", "interfaith", "bilingual", "traditions"],
  },
  {
    id: "spiritual_milestone",
    category: "Spiritual & Personal Milestone Ceremonies",
    displayName: "Spiritual or Personal Milestone Ceremony",
    shortName: "Milestone Ceremony",
    description:
      "A symbolic ceremony for house blessing, business blessing, new beginning, letting-go, sobriety, retirement, elder honoring, ancestor honoring, seasonal ceremony, or personal transition.",
    sensitivity: "neutral",
    legalStatus: "no",
    griefRelated: false,
    writingOnly: false,
    virtualAvailable: "yes",
    aliases: ["house blessing", "business blessing", "new beginning ceremony", "divorce healing", "letting-go ceremony", "sobriety milestone", "retirement ceremony", "elder honoring", "ancestor honoring", "seasonal ceremony"],
    keywords: ["house blessing", "business blessing", "new beginning", "letting go", "letting-go", "divorce healing", "sobriety", "recovery", "retirement", "elder", "ancestor", "seasonal", "solstice", "equinox", "moon ceremony", "friendship ceremony"],
    userPhrases: ["We want a ceremony for moving on", "We want to bless our new business", "We want to honor an elder", "We want a ceremony for a new beginning"],
    toneOptions: ["Symbolic", "Spiritual", "Healing", "Non-Religious", "Reflective", "Celebratory"],
    toneRules: [
      "Ask what the moment is meant to do: celebrate, bless, heal, release, honor, or transition.",
      "Do not assume spiritual or cultural authority.",
      "Keep symbolic actions simple and respectful.",
    ],
    requiredQuestions: [
      "What life moment should this ceremony mark?",
      "Is it meant to celebrate, honor, remember, bless, heal, or mark a transition?",
      "Should it feel spiritual, religious, cultural, symbolic, or non-religious?",
      "Who should be included or named?",
    ],
    optionalQuestions: [
      "Should there be a reading, candle, object, blessing, or symbolic action?",
      "Is there anything that should be avoided?",
      "Should guests participate with a response, blessing, or shared action?",
    ],
    storyPrompts: [
      "The personal milestone or transition",
      "What is being released, welcomed, blessed, celebrated, or honored",
      "People, places, objects, or symbols that matter",
      "The feeling people should leave with when the ceremony ends",
    ],
    intakeQuestionGroups: [
      {
        id: "milestone-meaning",
        title: "Milestone meaning",
        prompt: "What personal, spiritual, or milestone moment should this ceremony mark?",
        helpText: "Describe the transition, blessing, healing, gratitude, release, remembrance, or new beginning behind the ceremony.",
      },
      {
        id: "symbolic-action",
        title: "Symbolic action",
        prompt: "Should the ceremony include a symbolic action, object, reading, or group response?",
        helpText: "Examples include candle lighting, blessing a room, releasing written words, sharing gratitude, honoring an elder, or welcoming a new chapter.",
      },
    ],
    outputTypes: ["milestone_ceremony_script", "blessing", "symbolic_action_wording", "ceremony_outline"],
    scriptSections: ["Welcome", "Meaning of the Moment", "Reflection", "Symbolic Action", "Blessing or Intention", "Closing"],
    defaultDuration: "10-20 minutes",
    travelRequired: "depends",
  },
  {
    id: "writing_service",
    category: "Script & Writing Services",
    displayName: "Eulogy, Vows, or Speech",
    shortName: "Eulogy, Vows, or Speech",
    description:
      "A writing-only service for vows, eulogies, toasts, readings, ceremony outlines, tribute speeches, bilingual scripts, ceremony translation, or ceremony wording.",
    sensitivity: "neutral",
    legalStatus: "writing_only",
    griefRelated: false,
    writingOnly: true,
    virtualAvailable: "writing_only",
    aliases: ["custom script", "vow writing", "eulogy writing", "speech writing", "toast writing", "ceremony outline", "script editing", "ceremony translation"],
    keywords: ["vows", "eulogy", "speech", "toast", "reading", "write", "wording", "script editing", "custom poem", "love story writing", "life story tribute", "translation", "bilingual script", "ceremony script"],
    userPhrases: ["Can someone write my vows?", "I need help writing a eulogy", "Can you write a ceremony script?", "I need my ceremony translated"],
    toneOptions: ["Heartfelt", "Polished", "Simple and Natural", "Formal", "Light and Warm", "Gentle"],
    toneRules: [
      "Write in the requested speaker's voice.",
      "Do not create a full ceremony if the user only requested a speech, eulogy, vows, or toast.",
      "For grief writing, use gentle language and avoid forced optimism.",
    ],
    requiredQuestions: [
      "What kind of piece should be written?",
      "Who is it for?",
      "What tone should it have?",
      "Are there key stories, promises, memories, or details to include?",
    ],
    optionalQuestions: [
      "Should it sound like the speaker's natural voice?",
      "Is there a word count or speaking time target?",
      "Should the writing be religious, spiritual, cultural, or non-religious?",
    ],
    storyPrompts: [
      "Who is speaking and who the piece is for",
      "The most important memory, message, promise, or tribute",
      "Words, stories, humor, faith, gratitude, or emotion to include",
      "The desired ending: blessing, toast, goodbye, commitment, or call to action",
    ],
    intakeQuestionGroups: [
      {
        id: "speaker-voice",
        title: "Speaker voice",
        prompt: "Whose voice should this sound like, and who is it for?",
        helpText: "Mention whether the wording should sound natural, polished, emotional, simple, formal, funny, spiritual, or conversational.",
      },
      {
        id: "main-message",
        title: "Main message",
        prompt: "What is the most important message, memory, promise, or tribute to include?",
        helpText: "A few high-level bullet points are enough. Mr. Script can shape them into a clean speech or written piece.",
      },
    ],
    outputTypes: ["vows", "eulogy", "toast", "speech", "reading", "ceremony_outline", "translation"],
    scriptSections: ["Opening", "Personal Details", "Main Message", "Closing"],
    defaultDuration: "writing-only",
    travelRequired: "no",
  },
  {
    id: "rehearsal_planning",
    category: "Planning, Rehearsal & Day-Of Support",
    displayName: "Rehearsal or Ceremony Planning",
    shortName: "Rehearsal Planning",
    description:
      "Planning support for rehearsal, processional, recessional, family seating, wedding party lineup, ceremony timing, vendor cues, sound check, and day-of ceremony flow.",
    sensitivity: "neutral",
    legalStatus: "no",
    griefRelated: false,
    writingOnly: false,
    virtualAvailable: "depends",
    aliases: ["ceremony rehearsal", "processional planning", "recessional planning", "day-of ceremony coordination", "backup officiant", "timeline help"],
    keywords: ["rehearsal", "processional", "recessional", "lineup", "timeline", "music cue", "sound check", "vendor coordination", "backup officiant", "day-of", "ceremony timing"],
    userPhrases: ["We need help with the rehearsal", "Who walks first?", "We need a ceremony timeline", "We need processional planning"],
    toneOptions: ["Organized", "Calm and Professional", "Detailed", "Simple and Practical"],
    toneRules: [
      "Focus on logistics and clarity.",
      "Ask who is participating before building a lineup.",
      "Keep advice practical and easy for the officiant to execute.",
    ],
    requiredQuestions: [
      "What type of ceremony is being rehearsed or planned?",
      "Who is in the processional and recessional?",
      "Where is the ceremony taking place?",
      "What timing, music, microphone, or vendor cues need to be planned?",
    ],
    optionalQuestions: [
      "Do you need family seating guidance?",
      "Is there a wedding party lineup?",
      "Do you need a license reminder, backup officiant plan, or virtual support?",
    ],
    storyPrompts: [
      "The people walking or speaking",
      "Venue layout and aisle setup",
      "Music cues, microphone needs, readings, and unity ceremony placement",
      "Timing, vendor cues, and final reminders",
    ],
    intakeQuestionGroups: [
      {
        id: "ceremony-logistics",
        title: "Ceremony logistics",
        prompt: "What ceremony logistics need to be planned?",
        helpText: "Mention processional order, readers, music cues, microphones, unity ceremony placement, family seating, and vendor timing.",
      },
      {
        id: "participants",
        title: "Participants",
        prompt: "Who is participating in the ceremony and rehearsal?",
        helpText: "List couple, wedding party, family members, readers, musicians, children, pets, or anyone walking or speaking.",
      },
    ],
    outputTypes: ["rehearsal_plan", "processional_order", "ceremony_timeline", "checklist", "client_email"],
    scriptSections: ["Rehearsal Goals", "Lineup", "Processional", "Ceremony Cue Plan", "Recessional", "Final Reminders"],
    defaultDuration: "planning support",
    travelRequired: "depends",
  },
  {
    id: "custom_life_ceremony",
    category: "Custom Life Ceremonies",
    displayName: "Custom Life Ceremony",
    shortName: "Custom Life Ceremony",
    description:
      "A personalized ceremony for a meaningful transition, remembrance, blessing, healing moment, new beginning, chosen family moment, or community milestone.",
    sensitivity: "neutral",
    legalStatus: "no",
    griefRelated: false,
    writingOnly: false,
    virtualAvailable: "yes",
    aliases: ["custom ceremony", "life ceremony", "chosen family ceremony", "name change ceremony", "gender affirmation ceremony", "ancestor remembrance", "garden blessing"],
    keywords: ["custom", "life ceremony", "blessing", "transition", "new beginning", "healing", "honor", "remember", "ritual", "chosen family", "name change", "gender affirmation", "ancestor", "garden", "moving on"],
    userPhrases: ["I do not know what this is called", "We want to honor my grandma's garden", "We want a ceremony for our chosen family", "We want a positive divorce ceremony"],
    toneOptions: ["Symbolic", "Spiritual", "Non-Religious", "Healing", "Celebratory", "Reflective"],
    toneRules: [
      "Ask whether the ceremony is meant to celebrate, honor, remember, bless, heal, or mark a transition.",
      "Do not assume religion, culture, or legal meaning.",
      "Shape the ceremony around the meaning of the moment.",
    ],
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
    intakeQuestionGroups: [
      {
        id: "life-moment",
        title: "Life moment",
        prompt: "What life moment, milestone, transition, or custom ceremony should this honor?",
        helpText: "Describe who is involved, why the moment matters, and what feeling the officiant should create for everyone present.",
      },
      {
        id: "symbols-participants",
        title: "Symbols and participants",
        prompt: "Are there symbols, people, readings, objects, or rituals that should be included?",
        helpText: "Examples include candle, keepsake, blessing, community response, remembrance object, music, reading, or a custom symbolic action.",
      },
    ],
    outputTypes: ["custom_ceremony_script", "ceremony_outline", "symbolic_action_wording", "blessing", "intake_questionnaire"],
    scriptSections: ["Welcome", "Meaning of the Moment", "Story or Reflection", "Symbolic Action", "Blessing", "Closing"],
    defaultDuration: "10-30 minutes",
    travelRequired: "depends",
  },
]

const normalizeForMatch = (value: string) =>
  value.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim()

const scoreServiceMatch = (service: MrScriptService, normalized: string) => {
  const exactTerms = [service.id, service.displayName, service.shortName, ...service.aliases]
  const keywordTerms = [...service.keywords, ...service.userPhrases]

  let score = 0
  exactTerms.forEach((term) => {
    const normalizedTerm = normalizeForMatch(term)
    if (normalized === normalizedTerm) score += 30
    else if (normalized.includes(normalizedTerm)) score += 18
  })

  keywordTerms.forEach((term) => {
    const normalizedTerm = normalizeForMatch(term)
    if (normalized.includes(normalizedTerm)) score += normalizedTerm.includes(" ") ? 10 : 5
  })

  if (service.griefRelated && /\b(died|passed|loss|funeral|wake|memorial|graveside|ashes|eulogy)\b/.test(normalized)) score += 16
  if (service.id === "pet_memorial" && /\b(pet|dog|cat|animal|companion|rainbow bridge)\b/.test(normalized)) score += 22
  if (service.writingOnly && /\b(write|writing|edit|wording|speech|toast|eulogy|vows)\b/.test(normalized)) score += 10
  if (service.id === "elopement_license_signing" && /\b(papers|license|sign|signed|quick|elope)\b/.test(normalized)) score += 16
  if (service.id === "coming_of_age" && /\b(15|sixteen|daughter|honoree|quince)\b/.test(normalized)) score += 12
  if (service.id === "family_ceremony" && /\b(adoption|foster|blended|guardian|sibling|family unity)\b/.test(normalized)) score += 14
  if (service.id === "cultural_religious_tradition" && /\b(interfaith|bilingual|tradition|cultural|religious|lasso|arras|handfasting|broom|chuppah|tea ceremony)\b/.test(normalized)) score += 18
  if (service.id === "rehearsal_planning" && /\b(rehearsal|lineup|processional|timeline|cue)\b/.test(normalized)) score += 14

  return score
}

export function getMrScriptServiceByResponse(response?: string): MrScriptService {
  if (!response) return MR_SCRIPT_SERVICES[0]

  const normalized = normalizeForMatch(response)
  const rankedServices = MR_SCRIPT_SERVICES
    .map((service) => ({ service, score: scoreServiceMatch(service, normalized) }))
    .sort((a, b) => b.score - a.score)

  return rankedServices[0]?.score > 0
    ? rankedServices[0].service
    : MR_SCRIPT_SERVICES.find((service) => service.id === "custom_life_ceremony") || MR_SCRIPT_SERVICES[0]
}

export function getMrScriptStoryPrompts(response?: string): string[] {
  return getMrScriptServiceByResponse(response).storyPrompts
}

export function getMrScriptServiceSummary(service: MrScriptService) {
  return {
    id: service.id,
    category: service.category,
    displayName: service.displayName,
    legalStatus: service.legalStatus,
    griefRelated: service.griefRelated,
    writingOnly: service.writingOnly,
    religiousOrCultural: service.religiousOrCultural || "optional",
    virtualAvailable: service.virtualAvailable,
    canBeWritingOnly: Boolean(service.canBeWritingOnly || service.writingOnly),
    outputTypes: service.outputTypes,
    priceField: service.priceField,
    defaultDuration: service.defaultDuration,
    travelRequired: service.travelRequired,
    suggestedChecklist: service.suggestedChecklist || [],
    adminServiceTags: service.adminServiceTags || [],
  }
}
