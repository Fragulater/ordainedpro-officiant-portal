// Ceremony Questionnaire - Questions Mr. Script asks to personalize the ceremony
// Based on professional officiant intake questionnaire
// NOTE: Basic info and Quick Setup selections are auto-populated - no need to re-ask

export interface QuestionnaireQuestion {
  id: string;
  category: string;
  question: string;
  followUp?: string; // Additional context or example
  type: "text" | "textarea" | "select" | "boolean" | "multiselect";
  options?: string[];
  required: boolean;
  aiPromptKey: string; // How this maps to the AI prompt
}

export const QUESTIONNAIRE_CATEGORIES = [
  { id: "ceremony-style", label: "Ceremony Style", icon: "🎨" },
  { id: "love-story", label: "Your Love Story", icon: "💕" },
  { id: "vows-readings", label: "Vows & Readings", icon: "📜" },
  { id: "unity-symbols", label: "Unity & Symbols", icon: "🕯️" },
  { id: "special-moments", label: "Special Moments", icon: "✨" },
];

// Data that is auto-populated from Quick Setup (not asked in questionnaire)
export const AUTO_POPULATED_FIELDS = [
  // From Wedding Couple card
  "brideName",
  "groomName",
  // From Wedding Details card
  "ceremonyDate",
  "ceremonyTime",
  "venue",
  "venueAddress",
  "guestCount",
  // From Quick Setup dropdowns
  "ceremonyStyle",      // Ceremony Style dropdown
  "ceremonyLength",     // Ceremony Length dropdown
  "unityCeremony",      // Unity Ceremony dropdown
  "vowStyle",           // Vows dropdown
  "readingStyle",       // Reading Style dropdown
];

export const CEREMONY_QUESTIONNAIRE: QuestionnaireQuestion[] = [
  // === CEREMONY STYLE (Details beyond dropdown selection) ===
  {
    id: "religious-ceremony",
    category: "ceremony-style",
    question: "Would you like religious elements included?",
    type: "select",
    options: ["No religious elements", "Light spiritual references", "Christian elements", "Jewish elements", "Interfaith", "Other religious tradition", "Pagan/Earth-based"],
    required: true,
    aiPromptKey: "religiousStyle",
  },
  {
    id: "taking-last-name",
    category: "ceremony-style",
    question: "How will you be introduced after the ceremony?",
    followUp: "e.g., 'Mr. and Mrs. Smith', 'The Smiths', 'The Smith-Johnsons'",
    type: "text",
    required: true,
    aiPromptKey: "marriedName",
  },
  {
    id: "customs-traditions",
    category: "ceremony-style",
    question: "Are there any cultural customs or traditions you'd like to include?",
    followUp: "e.g., jumping the broom, breaking glass, handfasting, cultural blessings",
    type: "textarea",
    required: false,
    aiPromptKey: "customsTraditions",
  },
  {
    id: "given-away",
    category: "ceremony-style",
    question: "Will anyone be 'giving away' the bride/partner?",
    followUp: "Who will give them away? What phrase would you like used?",
    type: "textarea",
    required: false,
    aiPromptKey: "givenAway",
  },

  // === LOVE STORY (THE MOST IMPORTANT SECTION) ===
  {
    id: "how-you-met",
    category: "love-story",
    question: "How did you two meet?",
    followUp: "Be detailed! Where, when, what were the circumstances? First impressions?",
    type: "textarea",
    required: true,
    aiPromptKey: "howTheyMet",
  },
  {
    id: "first-date",
    category: "love-story",
    question: "Tell me about your first date.",
    followUp: "Where did you go? What did you do? Any memorable moments?",
    type: "textarea",
    required: true,
    aiPromptKey: "firstDate",
  },
  {
    id: "falling-in-love",
    category: "love-story",
    question: "When did you know this was 'the one'?",
    followUp: "Was there a specific moment? What made you realize you were in love?",
    type: "textarea",
    required: true,
    aiPromptKey: "fallingInLove",
  },
  {
    id: "proposal-story",
    category: "love-story",
    question: "How did the proposal happen?",
    followUp: "Who proposed? Where? Any special details or surprises?",
    type: "textarea",
    required: true,
    aiPromptKey: "proposalStory",
  },
  {
    id: "what-you-love",
    category: "love-story",
    question: "What do you love most about each other?",
    followUp: "What qualities make your partner special?",
    type: "textarea",
    required: true,
    aiPromptKey: "whatYouLove",
  },
  {
    id: "relationship-milestones",
    category: "love-story",
    question: "What are some key milestones in your relationship?",
    followUp: "Moving in together, meeting families, trips, overcoming challenges, etc.",
    type: "textarea",
    required: false,
    aiPromptKey: "milestones",
  },
  {
    id: "inside-jokes",
    category: "love-story",
    question: "Any inside jokes, nicknames, or shared interests to include?",
    followUp: "These personal touches make the ceremony unique and memorable!",
    type: "textarea",
    required: false,
    aiPromptKey: "insideJokes",
  },

  // === VOWS & READINGS (Details beyond dropdown selection) ===
  {
    id: "personal-vows",
    category: "vows-readings",
    question: "If writing personal vows, would you like to share them now or read them at the ceremony?",
    type: "select",
    options: ["We'll share them now for the script", "We'll keep them private until the ceremony", "We need help writing them", "N/A - using traditional vows"],
    required: false,
    aiPromptKey: "personalVowsApproach",
  },
  {
    id: "reading-reader",
    category: "vows-readings",
    question: "If including a reading, who will read it?",
    followUp: "Name and relationship to couple",
    type: "text",
    required: false,
    aiPromptKey: "readingReader",
  },

  // === UNITY & SYMBOLS (Details beyond dropdown selection) ===
  {
    id: "unity-details",
    category: "unity-symbols",
    question: "Any special details about your unity ceremony?",
    followUp: "Colors, family involvement, specific wording preferences",
    type: "textarea",
    required: false,
    aiPromptKey: "unityDetails",
  },
  {
    id: "ring-details",
    category: "unity-symbols",
    question: "Tell me about your rings.",
    followUp: "Any special significance? Family heirlooms? Custom made?",
    type: "textarea",
    required: false,
    aiPromptKey: "ringDetails",
  },

  // === SPECIAL MOMENTS ===
  {
    id: "mention-passing",
    category: "special-moments",
    question: "Are there loved ones who have passed that you'd like to honor?",
    followUp: "Please share their names and relationship (e.g., 'Sarah's father, Michael')",
    type: "textarea",
    required: false,
    aiPromptKey: "honorDeceased",
  },
  {
    id: "blended-family",
    category: "special-moments",
    question: "Is this a blended family? Are there children to include in the ceremony?",
    followUp: "Share names and ages of children, and any special role they'll play",
    type: "textarea",
    required: false,
    aiPromptKey: "blendedFamily",
  },
  {
    id: "unplugged-ceremony",
    category: "special-moments",
    question: "Would you like an unplugged ceremony announcement?",
    followUp: "Asking guests to put away phones and be present",
    type: "select",
    options: ["Yes, please include unplugged announcement", "No unplugged announcement needed", "Brief reminder only"],
    required: false,
    aiPromptKey: "unpluggedCeremony",
  },
  {
    id: "community-vows",
    category: "special-moments",
    question: "Would you like community/audience vows?",
    followUp: "Asking guests to promise their support of the marriage",
    type: "select",
    options: ["Yes, include community vows", "No community vows"],
    required: false,
    aiPromptKey: "communityVows",
  },
  {
    id: "other-special",
    category: "special-moments",
    question: "Anything else special you'd like included?",
    followUp: "Other rituals, acknowledgments, or unique elements",
    type: "textarea",
    required: false,
    aiPromptKey: "otherSpecial",
  },
];

// Helper function to get questions by category
export const getQuestionsByCategory = (categoryId: string): QuestionnaireQuestion[] => {
  return CEREMONY_QUESTIONNAIRE.filter((q) => q.category === categoryId);
};

// Helper function to get required questions
export const getRequiredQuestions = (): QuestionnaireQuestion[] => {
  return CEREMONY_QUESTIONNAIRE.filter((q) => q.required);
};

// Helper function to count questions per category
export const getQuestionCountByCategory = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  CEREMONY_QUESTIONNAIRE.forEach((q) => {
    counts[q.category] = (counts[q.category] || 0) + 1;
  });
  return counts;
};

// Total questions
export const TOTAL_QUESTIONS = CEREMONY_QUESTIONNAIRE.length;
export const REQUIRED_QUESTIONS = CEREMONY_QUESTIONNAIRE.filter((q) => q.required).length;
