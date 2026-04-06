"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import mammoth from "mammoth";
import ChatInput from "@/components/ChatInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/supabase/utils/client";
import { READING_CATEGORIES, getReadingsByCategory, getRandomReading } from "@/data/ceremony-readings";
import { CEREMONY_QUESTIONNAIRE, QUESTIONNAIRE_CATEGORIES, getQuestionsByCategory, TOTAL_QUESTIONS } from "@/data/ceremony-questionnaire";
import {
  MessageCircle,
  MessageSquare,
  FileText,
  CheckSquare,
  Calendar as CalendarIcon,
  Users,
  Send,
  Paperclip,
  Download,
  Plus,
  Check,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Heart,
  Star,
  FileSignature,
  DollarSign,
  ShoppingCart,
  Edit,
  FileEdit,
  Share,
  Eye,
  AlertCircle,
  CreditCard,
  Receipt,
  Banknote,
  TrendingUp,
  X,
  Save,
  UserPlus,
  Bell,
  Flag,
  Filter,
  SortAsc,
  Upload,
  Trash2,
  ChevronRight,
  Globe,
  LogOut,
  Settings,
  RefreshCw,
} from "lucide-react";
import { AddTaskDialog, Task } from "@/components/AddTaskDialog";
import {
  ScheduleMeetingDialog,
  Meeting,
} from "@/components/ScheduleMeetingDialog";
import { FileUpload, UploadedFile } from "@/components/FileUpload";
import {
  ContractUploadDialog,
  Contract as ContractUploadType,
} from "@/components/ContractUploadDialog";
import { OfficiantDashboardDialog } from "@/components/OfficiantDashboardDialog";
import { UploadScriptDialog } from "@/components/UploadScriptDialog";
import { ScriptEditorDialog } from "@/components/ScriptEditorDialog";

// Helper function to generate consistent colors based on couple ID
const getCoupleColors = (coupleId: number) => {
  const colorPairs = [
    {
      bride: "bg-pink-500",
      groom: "bg-blue-500",
      brideRing: "ring-pink-100",
      groomRing: "ring-blue-100",
      brideText: "text-pink-600",
      groomText: "text-blue-600",
      brideIcon: "text-pink-500",
      groomIcon: "text-blue-500",
    },
    {
      bride: "bg-red-500",
      groom: "bg-indigo-500",
      brideRing: "ring-red-100",
      groomRing: "ring-indigo-100",
      brideText: "text-red-600",
      groomText: "text-indigo-600",
      brideIcon: "text-red-500",
      groomIcon: "text-indigo-500",
    },
    {
      bride: "bg-purple-500",
      groom: "bg-green-500",
      brideRing: "ring-purple-100",
      groomRing: "ring-green-100",
      brideText: "text-purple-600",
      groomText: "text-green-600",
      brideIcon: "text-purple-500",
      groomIcon: "text-green-500",
    },
    {
      bride: "bg-orange-500",
      groom: "bg-cyan-500",
      brideRing: "ring-orange-100",
      groomRing: "ring-cyan-100",
      brideText: "text-orange-600",
      groomText: "text-cyan-600",
      brideIcon: "text-orange-500",
      groomIcon: "text-cyan-500",
    },
  ];
  return colorPairs[(coupleId - 1) % colorPairs.length];
};

// AI Chatbot Interfaces
interface ChatMessage {
  id: string;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
  questionId?: string;
  isRefineQuestion?: boolean;
  refineQuestionData?: {
    questionId: string;
    questionIndex: number;
    options: string[];
    type: "multiple-choice" | "text";
  };
  isFollowUpQuestion?: boolean;
  followUpData?: {
    options: string[];
    allowCustomInput: boolean;
    originalOption: string;
  };
}
interface Contract {
  id: number;
  user_id: string;
  couple_id: number | null;
  name: string;
  description: string | null;
  type: string;
  status: "draft" | "sent" | "signed" | "expired";
  expiry_date: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
  signedBy?: string; // optional computed field
  signedDate?: string;
  sentDate?: string;
  createdDate?: string;
}

interface Question {
  id: string;
  type: "text" | "multiple-choice" | "rating" | "boolean";
  question: string;
  options?: string[];
  required: boolean;
  followUpQuestions?: Question[];
  category: "ceremony-type" | "logistics" | "personal" | "preferences" | "additions" | "unity" | "religious" | "cultural" | "removals" | "tone" | "custom";
  aiRecommendation?: string;
  dependsOn?: {
    questionId: string;
    values: string[];
  };
}

interface CeremonyProfile {
  ceremonyType: string;
  duration: string;
  tone: string;
  specialRequests: string[];
  couplePreferences: Record<string, any>;
}

const GUIDED_QUESTIONS: Question[] = [
  {
    id: "ceremony-type",
    type: "multiple-choice",
    question: "What type of ceremony are you looking to officiate?",
    options: [
      "Traditional",
      "Modern",
      "Religious",
      "Secular",
      "Interfaith",
      "Fully Custom Ceremony",
    ],
    required: true,
    category: "ceremony-type",
    aiRecommendation:
      "Traditional ceremonies include classic vows and ring exchanges, while modern ceremonies offer more flexibility for personalization.",
  },
  {
    id: "ceremony-duration",
    type: "multiple-choice",
    question: "How long should the ceremony be?",
    options: ["15-20 minutes", "20-30 minutes", "30-45 minutes", "45+ minutes"],
    required: true,
    category: "logistics",
    aiRecommendation:
      "Most wedding ceremonies are 20-30 minutes. Shorter ceremonies focus on essentials, while longer ones include more personal elements.",
  },
  {
    id: "ceremony-tone",
    type: "multiple-choice",
    question: "What tone would you like for the ceremony?",
    options: [
      "Formal and Traditional",
      "Warm and Personal",
      "Light and Joyful",
      "Intimate and Romantic",
      "Fun and Casual",
    ],
    required: true,
    category: "preferences",
    aiRecommendation:
      "The tone should reflect the couple's personality. I can help adjust the language and style accordingly.",
  },
  {
    id: "special-elements",
    type: "multiple-choice",
    question: "Are there any special elements the couple wants to include?",
    options: [
      "Unity Candle",
      "Sand Ceremony",
      "Ring Warming",
      "Handfasting",
      "Cultural Traditions",
      "No Special Elements Needed",
    ],
    required: false,
    category: "personal",
    aiRecommendation:
      "Special elements add meaning and personalization. I can provide scripts and guidance for any of these traditions.",
  },
  {
    id: "vows-type",
    type: "multiple-choice",
    question:
      "Will the couple be writing their own vows or using traditional vows?",
    options: [
      "Traditional Vows",
      "Personal Written Vows",
      "Traditional + Personal Vows",
      "Undecided - Help Me Choose",
    ],
    required: true,
    category: "preferences",
    aiRecommendation:
      "I can provide traditional vow options or help you guide the couple in writing personal vows that fit the ceremony style.",
  },
];

// Refinement Questions - Asked after initial script is generated
const REFINEMENT_QUESTIONS: Question[] = [
  {
    id: "refine-add-elements",
    type: "multiple-choice",
    question: "Would you like to ADD any elements to your script?",
    options: [
      "Additional Unity Ceremony",
      "Religious/Spiritual Section",
      "Cultural Traditions",
      "Special Reading or Poem",
      "Memory Tribute (for loved ones passed)",
      "Children/Family Inclusion",
      "No Additional Elements",
    ],
    required: false,
    category: "additions",
    aiRecommendation:
      "Adding elements personalizes the ceremony. I can seamlessly incorporate any of these into your existing script.",
  },
  {
    id: "refine-unity-type",
    type: "multiple-choice",
    question: "Which additional unity ceremony would you like to include?",
    options: [
      "Unity Candle Ceremony",
      "Sand Ceremony",
      "Wine/Communion Ceremony",
      "Handfasting/Ribbon Ceremony",
      "Tree Planting Ceremony",
      "Love Letter Box",
      "Ring Warming",
      "Skip - Not Needed",
    ],
    required: false,
    category: "unity",
    aiRecommendation:
      "Each unity ceremony symbolizes the joining of two lives. I'll add the script and instructions for your chosen ceremony.",
    dependsOn: { questionId: "refine-add-elements", values: ["Additional Unity Ceremony"] },
  },
  {
    id: "refine-religious-type",
    type: "multiple-choice",
    question: "What type of religious or spiritual elements would you like?",
    options: [
      "Christian Prayers & Blessings",
      "Jewish Elements (Breaking Glass, etc.)",
      "Interfaith Blessings",
      "Non-denominational Spirituality",
      "Buddhist/Eastern Traditions",
      "Celtic/Pagan Traditions",
      "Skip - Not Needed",
    ],
    required: false,
    category: "religious",
    aiRecommendation:
      "I'll incorporate appropriate prayers, blessings, or spiritual elements that honor your faith traditions.",
    dependsOn: { questionId: "refine-add-elements", values: ["Religious/Spiritual Section"] },
  },
  {
    id: "refine-cultural",
    type: "text",
    question: "Please describe the cultural traditions you'd like to include:",
    options: [],
    required: false,
    category: "cultural",
    aiRecommendation:
      "Describe any cultural traditions (e.g., jumping the broom, circling, seven steps, etc.) and I'll weave them into your ceremony.",
    dependsOn: { questionId: "refine-add-elements", values: ["Cultural Traditions"] },
  },
  {
    id: "refine-remove-elements",
    type: "multiple-choice",
    question: "Would you like to REMOVE or SHORTEN any sections?",
    options: [
      "Shorten the Opening/Welcome",
      "Remove Unity Ceremony",
      "Shorten Vows Section",
      "Remove Readings",
      "Simplify Ring Exchange",
      "Shorten Overall Length",
      "Keep As Is - No Changes",
    ],
    required: false,
    category: "removals",
    aiRecommendation:
      "I can streamline any section to better fit your ceremony length or preferences.",
  },
  {
    id: "refine-tone-adjust",
    type: "multiple-choice",
    question: "Would you like to adjust the tone of any section?",
    options: [
      "Make it more formal",
      "Make it more casual/fun",
      "Add more humor",
      "Make it more romantic",
      "Make it more spiritual",
      "Keep Current Tone - No Changes",
    ],
    required: false,
    category: "tone",
    aiRecommendation:
      "I can adjust the language and style to better match your vision for the ceremony.",
  },
  {
    id: "refine-custom-request",
    type: "text",
    question: "Any other specific changes or additions you'd like? (Type your request)",
    options: [],
    required: false,
    category: "custom",
    aiRecommendation:
      "Tell me exactly what you'd like to add, change, or remove, and I'll update the script accordingly.",
  },
];

// Follow-up questions for options that need more detail
interface FollowUpQuestion {
  prompt: string;
  options?: string[];
  allowCustomInput?: boolean;
}

const FOLLOW_UP_QUESTIONS: Record<string, FollowUpQuestion> = {
  // Ceremony Types that need follow-up
  "Religious": {
    prompt: "Which religious tradition would you like the ceremony to follow?",
    options: [
      "Christian (Protestant)",
      "Christian (Catholic)",
      "Jewish",
      "Muslim",
      "Hindu",
      "Buddhist",
      "Other - Please Specify"
    ],
    allowCustomInput: true,
  },
  "Interfaith": {
    prompt: "Which faith traditions would you like to blend in the ceremony?",
    options: [
      "Christian + Jewish",
      "Christian + Hindu",
      "Christian + Muslim",
      "Jewish + Buddhist",
      "Hindu + Buddhist",
      "Other Combination - Please Specify"
    ],
    allowCustomInput: true,
  },
  "Fully Custom Ceremony": {
    prompt: "What elements would you like to include in your custom ceremony? (Select all that apply or describe)",
    options: [
      "Non-traditional vows",
      "Unique readings or poems",
      "Special rituals or symbols",
      "Themed ceremony (beach, garden, etc.)",
      "Interactive guest participation",
      "Let me describe what I want"
    ],
    allowCustomInput: true,
  },

  // Special Elements that need follow-up
  "Cultural Traditions": {
    prompt: "Which cultural tradition(s) would you like to include?",
    options: [
      "Jumping the Broom (African American)",
      "Breaking the Glass (Jewish)",
      "Handfasting (Celtic/Pagan)",
      "Seven Steps/Saptapadi (Hindu)",
      "Circling/Hakafot (Jewish)",
      "Las Arras/Unity Coins (Latino)",
      "Tea Ceremony (Chinese/Japanese)",
      "Crowning/Stefana (Greek Orthodox)",
      "Other - Please Describe"
    ],
    allowCustomInput: true,
  },
  "Handfasting": {
    prompt: "What style of handfasting would you prefer?",
    options: [
      "Traditional Celtic with ribbon/cord",
      "Modern interpretation with colored ribbons",
      "Include family members tying the knot",
      "Brief symbolic binding",
      "Extended with vows during binding"
    ],
  },

  // Refinement options that need follow-up
  "Memory Tribute (for loved ones passed)": {
    prompt: "Please share the names and relationships of loved ones you'd like to honor:",
    allowCustomInput: true,
  },
  "Children/Family Inclusion": {
    prompt: "Please share details about the children/family members to include:",
    options: [
      "Ring bearer / Flower girl roles",
      "Family vows (promises to children)",
      "Family unity ceremony (sand, candle, etc.)",
      "Children reading or speaking",
      "Blended family medallion ceremony",
      "Let me provide specific details"
    ],
    allowCustomInput: true,
  },
  "Special Reading or Poem": {
    prompt: "What type of reading would you like to include?",
    options: [
      "Classic love poetry (Shakespeare, Neruda, etc.)",
      "Religious scripture or blessing",
      "Modern love quotes or prose",
      "Humorous reading",
      "Reading from a favorite book/movie",
      "I have a specific reading in mind"
    ],
    allowCustomInput: true,
  },
  "Additional Unity Ceremony": {
    prompt: "Which unity ceremony appeals to you most?",
    options: [
      "Unity Candle - Lighting one flame together",
      "Sand Ceremony - Blending colored sands",
      "Wine Ceremony - Sharing a cup together",
      "Tree Planting - Planting together for growth",
      "Love Letter Box - Sealing letters to open later",
      "Ring Warming - Guests bless the rings",
      "Other - Please Describe"
    ],
    allowCustomInput: true,
  },
};

// AI Assistant Functions
const generateAIResponse = (
  question: Question,
  previousResponses: Record<string, string>
): string => {
  const responses = [
    `Great! Let me ask you about ${question.category === "ceremony-type"
      ? "the type of ceremony"
      : question.category === "logistics"
        ? "the practical details"
        : question.category === "personal"
          ? "personal touches"
          : "your preferences"
    }.`,

    `${question.question}`,

    question.aiRecommendation ? `💡 ${question.aiRecommendation}` : "",
  ].filter(Boolean);

  return responses.join("\n\n");
};

const generateRecommendation = (responses: Record<string, string>): string => {
  const ceremonyType = responses["ceremony-type"];
  const duration = responses["ceremony-duration"];
  const tone = responses["ceremony-tone"];

  let recommendation =
    "Based on your preferences, here's what I recommend for your ceremony script:\n\n";

  if (ceremonyType) {
    recommendation += `📝 **Ceremony Style**: Since you've chosen a ${ceremonyType.toLowerCase()} ceremony, `;
    if (ceremonyType === "Traditional") {
      recommendation +=
        "I'll include classic elements like traditional vows, ring exchange, and formal language.\n\n";
    } else if (ceremonyType === "Modern") {
      recommendation +=
        "I'll create a contemporary script with flexible elements and personalized touches.\n\n";
    } else if (ceremonyType === "Religious") {
      recommendation +=
        "I'll incorporate appropriate religious elements and blessings.\n\n";
    }
  }

  if (duration) {
    recommendation += `⏰ **Timing**: For a ${duration.toLowerCase()} ceremony, I'll structure the script with appropriate pacing and content.\n\n`;
  }

  if (tone) {
    recommendation += `🎭 **Tone**: The ${tone.toLowerCase()} approach will be reflected in the language and style throughout.\n\n`;
  }

  recommendation +=
    "Would you like me to start generating your personalized ceremony script now? I can always adjust it based on any additional preferences you have!";

  return recommendation;
};

// Generate a complete ceremony script based on user responses
// Word count targets by ceremony duration (at ~100 words/minute speaking pace)
// 15-20 minutes: ~1,500-2,000 words
// 20-30 minutes: ~2,000-3,000 words
// 30-45 minutes: ~3,000-4,500 words
// 45+ minutes: ~4,500+ words

const generateCompleteScript = (
  responses: Record<string, string>,
  coupleInfo: any,
  weddingDetails: any
): string => {
  const ceremonyType = responses["ceremony-type"] || "Traditional";
  const duration = responses["ceremony-duration"] || "20-30 minutes";
  const tone = responses["ceremony-tone"] || "Warm and Personal";
  const unityCeremony = responses["special-elements"] || "None";
  const vowsType = responses["vows-type"] || "Traditional Vows";

  const brideName = coupleInfo.brideName || "Sarah";
  const groomName = coupleInfo.groomName || "David";
  const venue = weddingDetails.venueName || "Sunset Gardens";
  const date = new Date(
    weddingDetails.weddingDate || "2024-08-25"
  ).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Determine ceremony length category
  const isShort = duration === "15-20 minutes";
  const isMedium = duration === "20-30 minutes";
  const isLong = duration === "30-45 minutes";
  const isExtended = duration === "45+ minutes";

  let script = `${ceremonyType.toUpperCase()} WEDDING CEREMONY SCRIPT
Generated by Mr. Script for ${brideName} & ${groomName}
${venue} - ${date}
Target Duration: ${duration}

═══════════════════════════════════════════════════════════════

PROCESSIONAL
[Music begins as wedding party enters]
[Estimated time: 3-5 minutes]

═══════════════════════════════════════════════════════════════

WELCOME & OPENING WORDS
`;

  // Opening words - vary length based on duration
  if (isShort) {
    script += `"Welcome, everyone. We are gathered here today to celebrate the marriage of ${brideName} and ${groomName}. Thank you all for being here to share in this joyous occasion."`;
  } else if (isMedium) {
    script += `"Family and friends, welcome. We are gathered here today at ${venue} to celebrate the union of ${brideName} and ${groomName} in marriage.

On this beautiful ${date}, we witness not just the joining of two hearts, but the creation of a new family built on love, trust, and commitment.

${brideName} and ${groomName}, you have chosen to share your lives together, and we are honored to be part of this special moment."`;
  } else if (isLong) {
    script += `"Family and friends, welcome. We are gathered here today at ${venue} to celebrate one of life's most treasured moments—the union of ${brideName} and ${groomName} in marriage.

On this beautiful ${date}, we witness not just the joining of two hearts, but the creation of a new family built on love, trust, and commitment.

Marriage is a sacred bond that has been honored throughout the ages. It is not to be entered into lightly, but thoughtfully and reverently. ${brideName} and ${groomName} come before you today having carefully considered the commitment they are about to make.

They have chosen each other as partners for this journey through life. They have weathered challenges together, celebrated joys together, and have grown stronger in their love for one another.

Today, surrounded by those who love them most, they will make their promises to each other—promises to love, honor, and cherish one another for all the days of their lives."`;
  } else {
    // Extended (45+ minutes)
    script += `"Family and friends, welcome. We are gathered here today at ${venue} to celebrate one of life's most treasured moments—the union of ${brideName} and ${groomName} in marriage.

On this beautiful ${date}, we witness not just the joining of two hearts, but the creation of a new family built on love, trust, and commitment.

Marriage is a sacred bond that has been honored throughout the ages, across cultures, and in countless traditions. It is not to be entered into lightly, but thoughtfully, reverently, and with a deep understanding of its significance.

${brideName} and ${groomName} come before you today having carefully considered the commitment they are about to make. Their journey to this moment has been one of discovery—discovering the depths of their love, the strength of their partnership, and the joy they bring to each other's lives.

They have chosen each other as partners for this journey through life. They have weathered challenges together, celebrated joys together, and have grown stronger in their love for one another. Today, they take the next step in their journey—a step that will forever change their lives.

Today, surrounded by those who love them most, they will make their promises to each other—promises to love, honor, and cherish one another for all the days of their lives. These are not merely words spoken in ceremony, but commitments that will guide them through the years ahead."`;
  }

  // Add reading for longer ceremonies
  if (isLong || isExtended) {
    script += `

═══════════════════════════════════════════════════════════════

READING
[Reader approaches the podium]

"Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres. Love never fails."
— 1 Corinthians 13:4-8`;
  }

  // Add second reading for extended ceremonies
  if (isExtended) {
    script += `

[Second Reader]

"Let me not to the marriage of true minds
Admit impediments. Love is not love
Which alters when it alteration finds,
Or bends with the remover to remove.
O no! it is an ever-fixed mark
That looks on tempests and is never shaken;
It is the star to every wand'ring bark,
Whose worth's unknown, although his height be taken."
— Shakespeare, Sonnet 116`;
  }

  // Address to the couple for longer ceremonies
  if (isLong || isExtended) {
    script += `

═══════════════════════════════════════════════════════════════

ADDRESS TO THE COUPLE

"${brideName} and ${groomName}, today marks the beginning of a new chapter in your story—one that you will write together, day by day, moment by moment.

Marriage is not just about the big moments—the celebrations, the milestones, the achievements. It is equally about the quiet moments—the shared cups of coffee in the morning, the comfort of a familiar embrace, the unspoken understanding that comes from truly knowing another person.

As you stand here today, remember that love is both a feeling and a choice. There will be days when love feels effortless, when joy overflows, when gratitude fills your hearts. And there will be days when love requires intention, patience, and grace.

On those challenging days, remember this moment. Remember the love in your hearts today. Remember the commitment you are making before your family and friends. And remember that you are not alone—you have each other, and you have the love and support of everyone gathered here."`;
  }

  // Add reflection on relationship for extended ceremonies
  if (isExtended) {
    script += `

═══════════════════════════════════════════════════════════════

REFLECTION ON YOUR RELATIONSHIP

"${brideName} and ${groomName}, your love story is unique and beautiful. From your first meeting to this moment, you have built something extraordinary together.

You have learned each other's hopes and dreams, fears and vulnerabilities. You have seen each other at your best and your worst, and you have chosen each other still. That choice—that daily, intentional choice to love—is what will sustain your marriage through all the years to come.

Marriage will change you both. It will challenge you to grow in ways you cannot yet imagine. It will teach you new depths of patience, new heights of joy, new meanings of partnership. Embrace these changes, for they are the gifts of a life shared.

Remember to never stop dating each other. Never stop learning about each other. Never stop being curious about the person you fell in love with, for they will continue to grow and change, and that is a beautiful thing to witness and be part of."`;
  }

  script += `

═══════════════════════════════════════════════════════════════

DECLARATION OF INTENT

"${brideName}, do you take ${groomName} to be your lawfully wedded husband, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?"
[${brideName} responds: "I do"]

"${groomName}, do you take ${brideName} to be your lawfully wedded wife, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?"
[${groomName} responds: "I do"]

═══════════════════════════════════════════════════════════════

EXCHANGE OF VOWS
`;

  // Add vow section based on selection and ceremony length
  if (vowsType === "Personal Written Vows") {
    script += `[${brideName} and ${groomName} will now share their personal vows]

${brideName}: [Personal vows to be written by bride - aim for 1-2 minutes]

${groomName}: [Personal vows to be written by groom - aim for 1-2 minutes]`;
  } else if (vowsType === "Traditional Vows") {
    if (isShort) {
      script += `${brideName}: "I, ${brideName}, take you, ${groomName}, to be my husband. I promise to love, honor, and cherish you for as long as we both shall live."

${groomName}: "I, ${groomName}, take you, ${brideName}, to be my wife. I promise to love, honor, and cherish you for as long as we both shall live."`;
    } else {
      script += `${brideName}: "I, ${brideName}, take you, ${groomName}, to be my husband. I promise to love you, honor you, and cherish you, in sickness and in health, for richer or poorer, for better or worse, for as long as we both shall live. I will be your partner in all things, your comfort in sorrow, and your companion in joy."

${groomName}: "I, ${groomName}, take you, ${brideName}, to be my wife. I promise to love you, honor you, and cherish you, in sickness and in health, for richer or poorer, for better or worse, for as long as we both shall live. I will be your partner in all things, your comfort in sorrow, and your companion in joy."`;
    }
  } else {
    script += `[${vowsType} to be exchanged between ${brideName} and ${groomName}]`;
  }

  // Add unity ceremony if selected
  if (unityCeremony && unityCeremony !== "None") {
    script += `

═══════════════════════════════════════════════════════════════

${unityCeremony.toUpperCase()} CEREMONY
`;
    if (unityCeremony === "Unity Candle") {
      if (isShort || isMedium) {
        script += `[${brideName} and ${groomName} will now light the unity candle together]

"The unity candle represents the joining of your two lives into one. As you light this candle together, may it serve as a reminder that your love will forever burn bright."`;
      } else {
        script += `[${brideName} and ${groomName} will now light the unity candle together]

"Before you are three candles. The two outer candles represent your individual lives—the experiences, memories, and relationships that have shaped who you are today.

As you each take your candle and together light the center candle, you symbolize the joining of your two lives into one shared journey. The outer candles remain lit, for you do not lose your individuality in marriage—rather, you bring your unique selves together to create something new and beautiful.

May this flame burn bright throughout your marriage, a constant reminder of the love and commitment you share today."`;
      }
    } else if (unityCeremony === "Sand Ceremony") {
      if (isShort || isMedium) {
        script += `[${brideName} and ${groomName} will now perform the sand ceremony]

"As you pour your individual sands together, you are creating something new and beautiful. Just as these grains of sand can never be separated, so too are your lives now joined as one."`;
      } else {
        script += `[${brideName} and ${groomName} will now perform the sand ceremony]

"Before you are two vessels of sand—one representing ${brideName}, the other ${groomName}. Each grain of sand represents a moment, a memory, a part of who you are.

As you pour your sand together into this single vessel, watch as the colors blend and intertwine, creating a pattern that is entirely unique—one that could never be recreated, one that could never be separated back into its original parts.

This is marriage. You bring together two separate lives, two histories, two futures, and you create something entirely new. The individual grains remain, but they are now part of something greater—a shared life, a shared journey, a shared love."`;
      }
    } else if (unityCeremony === "Handfasting") {
      if (isShort || isMedium) {
        script += `[${brideName} and ${groomName} will now participate in the handfasting ceremony]

"As we bind your hands together, we symbolize your commitment to each other. This is where the phrase 'tying the knot' comes from, representing the unbreakable bond you share."`;
      } else {
        script += `[${brideName} and ${groomName} will now participate in the handfasting ceremony]

"Please join hands. The handfasting is an ancient Celtic tradition, from which we derive the phrase 'tying the knot.'

As I bind your hands together with this cord, know that these ties are not formed by this cord, but rather by your own vows and commitment to one another. The cord is merely a symbol of the bond you have already created.

[Officiant binds hands with cord in a figure-eight pattern]

Your hands are bound together now, symbolizing your commitment to face life's joys and challenges hand in hand. When you feel the weight of this cord, remember the support you have in each other. When you see the pattern of the knot, remember that your lives are now beautifully and permanently intertwined."`;
      }
    } else {
      script += `[${brideName} and ${groomName} will now participate in the ${unityCeremony}]

"This ${unityCeremony} represents the joining of your lives and the commitment you make to each other today. May it serve as a lasting symbol of your love and devotion."`;
    }
  }

  script += `

═══════════════════════════════════════════════════════════════

RING CEREMONY
`;

  if (isShort) {
    script += `"These rings symbolize your love and commitment."

[Exchange of rings]

${brideName}: "${groomName}, I give you this ring as a symbol of my love."
${groomName}: "${brideName}, I give you this ring as a symbol of my love."`;
  } else if (isMedium) {
    script += `"These rings serve as a symbol of your unending love and commitment. As you place them on each other's hands, remember that love is not just a feeling, but a choice you make every day."

[Exchange of rings]

${brideName}: "${groomName}, I give you this ring as a symbol of my love and commitment to you."
${groomName}: "${brideName}, I give you this ring as a symbol of my love and commitment to you."`;
  } else {
    script += `"The wedding ring is an ancient symbol, dating back thousands of years. Its circular shape represents eternity—no beginning, no end—just as your love has no bounds.

The ring is placed on the fourth finger of the left hand because ancient civilizations believed a vein ran directly from this finger to the heart—the vena amoris, the vein of love.

As you exchange these rings today, you give and receive a symbol of your eternal commitment to one another."

[Exchange of rings]

${brideName}: "${groomName}, I give you this ring as a symbol of my love, my faith in our strength together, and my commitment to our life as one. Wear it always as a sign of my love and devotion."

${groomName}: "${brideName}, I give you this ring as a symbol of my love, my faith in our strength together, and my commitment to our life as one. Wear it always as a sign of my love and devotion."`;
  }

  // Add blessing for longer ceremonies
  if (isLong || isExtended) {
    script += `

═══════════════════════════════════════════════════════════════

BLESSING

"May your marriage be filled with all the right ingredients: a heap of love, a dash of humor, a touch of romance, and a spoonful of understanding.

May you have the patience to listen, the wisdom to speak kindly, and the strength to support each other through all of life's adventures.

May your home be filled with laughter and love, and may you always find in each other the comfort of a best friend.

May the love you share today continue to grow and deepen with each passing year."`;
  }

  // Add special blessing for extended ceremonies
  if (isExtended) {
    script += `

═══════════════════════════════════════════════════════════════

COMMUNITY BLESSING

"And now, I ask all of you gathered here to offer your blessing and support to ${brideName} and ${groomName}.

Do you, their family and friends, pledge to support this couple in their marriage? Do you promise to encourage them, to celebrate with them in times of joy, and to comfort them in times of sorrow? If so, please respond: 'We do.'

[Guests respond: "We do"]

${brideName} and ${groomName}, you see? You do not walk this path alone. You are surrounded by people who love you, who believe in you, and who will support you throughout your marriage."`;
  }

  script += `

═══════════════════════════════════════════════════════════════

PRONOUNCEMENT
`;

  if (isShort) {
    script += `"By the power vested in me, I now pronounce you husband and wife. You may kiss!"`;
  } else {
    script += `"And so, having witnessed your vows to each other, having seen the rings placed upon your hands, and having received the blessing of all gathered here—

By the power vested in me, and in the presence of these witnesses, I am delighted to pronounce you husband and wife.

You may seal your marriage with a kiss!"`;
  }

  script += `

[First kiss as married couple]

═══════════════════════════════════════════════════════════════

PRESENTATION & RECESSIONAL

"Ladies and gentlemen, it is my honor and privilege to present to you, for the first time as a married couple: ${brideName} and ${groomName}!"

[Celebratory music plays as the newlyweds exit]

═══════════════════════════════════════════════════════════════

CEREMONY NOTES:
- Target Duration: ${duration}
- Estimated Word Count: ${isShort ? "~1,500-2,000 words" : isMedium ? "~2,000-3,000 words" : isLong ? "~3,000-4,500 words" : "~4,500+ words"}
- Style: ${ceremonyType}
- Tone: ${tone}
${unityCeremony !== "None" ? `- Unity Ceremony: ${unityCeremony}` : ""}
- Vow Style: ${vowsType}

═══════════════════════════════════════════════════════════════

This script has been customized for your ceremony by Mr. Script.
Feel free to modify any sections to better reflect your style and preferences.

Speaking Tips:
- Average speaking pace: 100-120 words per minute
- Pause for emphasis at key moments
- Make eye contact with the couple during personal moments
- Speak clearly and project to the back of the venue`;

  return script;
};

interface CommunicationPortalProps {
  onScriptUploaded?: (content: string, fileName: string) => void;
}

export function CommunicationPortal({
  onScriptUploaded,
}: CommunicationPortalProps = {}) {
  // Load officiant profile for business name on invoices
  const [officiantProfile, setOfficiantProfile] = useState<any>({
    businessName: "Grace Wedding Ceremonies",
    fullName: "Pastor Michael Adams",
    phone: "(555) 987-6543",
    email: "pastor.michael@ordainedpro.com",
    website: "https://pastoradams.com",
  });

  // ✅ Load profile from Supabase (not localStorage)
  useEffect(() => {
    const loadProfileFromSupabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No profile exists yet - that's ok
            console.log("📝 No profile found in Supabase yet");
            return;
          }
          throw error;
        }

        if (data) {
          console.log("✅ Loaded officiant profile from Supabase:", data);
          setOfficiantProfile({
            fullName: data.full_name || "",
            email: data.email || "",
            phone: data.phone || "",
            location: `${data.city || ""}, ${data.state || ""}`.trim(),
            specialty: "Wedding Officiant",
            rating: 4.9,
            reviewCount: 127,
            yearsExperience: data.years_experience || 0,
            ceremoniesCompleted: 150,
            headshot: data.headshot_url || "",
            bio: data.bio || "",
            website: data.website || "",
          });
        }
      } catch (err) {
        console.error("❌ Error loading profile from Supabase:", err);
      }
    };

    loadProfileFromSupabase();
  }, []);

  // Check if this is the user's first visit and show welcome dialog
  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedOrdainedPro");
    if (!hasVisited) {
      // Show welcome dialog after a short delay for better UX
      setTimeout(() => {
        setShowWelcomeDialog(true);
      }, 1000);
    }
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [newMessage, setNewMessage] = useState("");
  const [newTask, setNewTask] = useState("");

  const [showAddCeremonyDialog, setShowAddCeremonyDialog] = useState(false);
  const [showEditCoupleDialog, setShowEditCoupleDialog] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [showScheduleMeetingDialog, setShowScheduleMeetingDialog] =
    useState(false);
  const [showContractUploadDialog, setShowContractUploadDialog] =
    useState(false);
  const [showEditWeddingDialog, setShowEditWeddingDialog] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showEditMeetingDialog, setShowEditMeetingDialog] = useState(false);
  const [showFileViewerDialog, setShowFileViewerDialog] = useState(false);
  const [showContractViewerDialog, setShowContractViewerDialog] =
    useState(false);
  const [showSendContractDialog, setShowSendContractDialog] = useState(false);
  const [showSendPaymentReminderDialog, setShowSendPaymentReminderDialog] =
    useState(false);
  const [showGenerateInvoiceDialog, setShowGenerateInvoiceDialog] =
    useState(false);
  const [showUploadScriptDialog, setShowUploadScriptDialog] = useState(false);
  const [showLibraryScriptEditor, setShowLibraryScriptEditor] = useState(false);
  const [selectedLibraryScript, setSelectedLibraryScript] = useState<any>(null);
  const [sendingContract, setSendingContract] = useState<any>(null);
  const [emailForm, setEmailForm] = useState({
    to: "",
    customEmail: "",
    subject: "",
    body: "",
  });
  const [paymentReminderForm, setPaymentReminderForm] = useState({
    to: "",
    customEmail: "",
    subject: "",
    body: "",
  });
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    dueDate: "",
    weddingDate: "2024-08-25",
    coupleName: "Sarah Johnson & David Chen",
    venue: "Sunset Gardens",
    items: [
      {
        id: 1,
        service: "Wedding Ceremony Officiant",
        description:
          "Professional wedding ceremony officiation services including pre-ceremony consultation, personalized script, and ceremony performance",
        category: "Ceremony Services",
        quantity: 1,
        rate: 800,
        amount: 800,
      },
    ],
    subtotal: 800,
    taxRate: 0,
    taxAmount: 0,
    depositPaid: 300,
    balanceDue: 500,
    total: 800,
    notes:
      "Payment due within 30 days. Thank you for choosing our services for your special day!",
    paymentMethods:
      "Check, Cash, Venmo (@Pastor-Michael), PayPal (pastor.michael@ordainedpro.com), Zelle",
    terms:
      "Payment due within 30 days of invoice date. Final payment must be received at least 7 days before the wedding ceremony. Late payments may incur additional fees.",
    bankDetails: "Bank transfers available upon request",
    emailRecipients: "both",
  });
  const [viewingContract, setViewingContract] = useState<any>(null);
  const [viewingFile, setViewingFile] = useState<any>(null);
  const [editMeetingForm, setEditMeetingForm] = useState({
    id: 0,
    subject: "",
    date: "",
    time: "",
    duration: 60,
    meetingType: "in-person",
    location: "",
    body: "",
  });
  const [addEventForm, setAddEventForm] = useState({
    subject: "",
    date: "",
    time: "",
    category: "rehearsal",
    details: "",
  });
  const [isCeremonyActive, setIsCeremonyActive] = useState(true);
  const [taskFilter, setTaskFilter] = useState<
    "all" | "pending" | "completed" | "high-priority"
  >("all");
  // all, pending, completed, high-priority
  const [messageAttachments, setMessageAttachments] = useState<UploadedFile[]>(
    []
  );
  const [ceremonyFiles, setCeremonyFiles] = useState<UploadedFile[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [showAttachments, setShowAttachments] = useState(false);

  // Persistent storage for saved ceremonies
  const [savedCeremonies, setSavedCeremonies] = useState<any[]>([]);

  // State for managing multiple couples/weddings
  const [allCouples, setAllCouples] = useState([
    {
      id: 1,
      brideName: "Sarah Johnson",
      brideEmail: "ganuactivate@gmail.com",
      bridePhone: "(555) 123-4567",
      brideAddress: "123 Elm Street, Garden City, CA 90210",
      groomName: "David Chen",
      groomEmail: "ganuactivate@gmail.com",
      groomPhone: "(555) 234-5678",
      groomAddress: "456 Oak Street, Garden City, CA 90210",
      address: "456 Oak Street, Garden City, CA 90210",
      emergencyContact: "Emily Johnson (555) 345-6789",
      specialRequests: "Vegan ceremony preferences, no religious references",
      isActive: true,
      colors: getCoupleColors(1),
      weddingDetails: {
        venueName: "Sunset Gardens",
        venueAddress: "123 Rose Avenue, Garden City, CA 90210",
        weddingDate: "2024-08-25",
        startTime: "16:00",
        endTime: "18:00",
        expectedGuests: "75",
        officiantNotes: "",
      },
      paymentInfo: {
        totalAmount: 800,
        depositPaid: 300,
        balance: 500,
        depositDate: "July 15, 2024",
        finalPaymentDue: "August 18, 2024",
        paymentStatus: "deposit_paid",
      },
      paymentHistory: [
        {
          id: 1,
          date: "July 15, 2024",
          amount: 300,
          type: "Deposit",
          method: "Credit Card",
          status: "completed",
        },
        {
          id: 2,
          date: "August 18, 2024",
          amount: 500,
          type: "Final Payment",
          method: "Pending",
          status: "pending",
        },
      ],
    },
    {
      id: 2,
      brideName: "Emily Rodriguez",
      brideEmail: "emily.rodriguez@email.com",
      bridePhone: "(555) 456-7890",
      brideAddress: "789 Maple Drive, Riverside, CA 92501",
      groomName: "James Miller",
      groomEmail: "james.miller@email.com",
      groomPhone: "(555) 567-8901",
      groomAddress: "321 Pine Avenue, Riverside, CA 92501",
      address: "789 Maple Drive, Riverside, CA 92501",
      emergencyContact: "Maria Rodriguez (555) 678-9012",
      specialRequests: "Outdoor ceremony, live music",
      isActive: true,
      colors: getCoupleColors(2),
      weddingDetails: {
        venueName: "Riverside Estate",
        venueAddress: "456 River Road, Riverside, CA 92501",
        weddingDate: "2024-09-15",
        startTime: "17:00",
        endTime: "19:00",
        expectedGuests: "100",
        officiantNotes: "",
      },
      paymentInfo: {
        totalAmount: 1200,
        depositPaid: 600,
        balance: 600,
        depositDate: "June 20, 2024",
        finalPaymentDue: "September 8, 2024",
        paymentStatus: "deposit_paid",
      },
      paymentHistory: [
        {
          id: 1,
          date: "June 20, 2024",
          amount: 600,
          type: "Deposit",
          method: "Check",
          status: "completed",
        },
        {
          id: 2,
          date: "September 8, 2024",
          amount: 600,
          type: "Final Payment",
          method: "Pending",
          status: "pending",
        },
      ],
    },
  ]);

  const [activeCoupleIndex, setActiveCoupleIndex] = useState(0);
  const [showSwitchCeremonyDialog, setShowSwitchCeremonyDialog] =
    useState(false);
  const [showArchivedCeremoniesDialog, setShowArchivedCeremoniesDialog] =
    useState(false);
  const [showDashboardDialog, setShowDashboardDialog] = useState(false);

  // Form states for Add New Ceremony
  const [newCeremony, setNewCeremony] = useState({
    ceremonyName: "",
    ceremonyDate: "",
    ceremonyTime: "",
    venueName: "",
    venueAddress: "",
    expectedGuests: "",
    brideName: "",
    brideEmail: "",
    bridePhone: "",
    brideAddress: "",
    groomName: "",
    groomEmail: "",
    groomPhone: "",
    groomAddress: "",
    totalAmount: "",
    depositAmount: "",
    finalPaymentDate: "",
    notes: "",
  });

  // Form states for Edit Couple Info - loaded from active couple
  const [editCoupleInfo, setEditCoupleInfo] = useState(
    allCouples[activeCoupleIndex]
  );

  // Persistent storage for wedding details per couple
  const [savedWeddingDetails, setSavedWeddingDetails] = useState<
    Record<string, any>
  >({
    "Sarah Johnson & David Chen": {
      venueName: "Sunset Gardens",
      venueAddress: "123 Rose Avenue, Garden City, CA 90210",
      weddingDate: "2024-08-25",
      startTime: "16:00",
      endTime: "18:00",
      expectedGuests: "75",
    },
  });

  // Get current couple identifier
  const currentCoupleId = `${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}`;

  // Form states for Edit Wedding Details - loads from saved data
  const [editWeddingDetails, setEditWeddingDetails] = useState(
    allCouples[activeCoupleIndex].weddingDetails || {
      venueName: "",
      venueAddress: "",
      weddingDate: "",
      startTime: "",
      endTime: "",
      expectedGuests: "",
      officiantNotes: "",
    }
  );

  // AI Script Builder states
  const [aiChatMessages, setAiChatMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! I'm Mr. Script, your personal wedding ceremony script creator. I specialize in crafting beautiful, meaningful ceremonies tailored to Sarah Johnson & David Chen. What type of ceremony are you looking to create today?",
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScripts, setGeneratedScripts] = useState([
    {
      id: 1,
      title: "Traditional Ceremony Script - Sarah & David",
      content:
        "SAMPLE GENERATED SCRIPT:\n\nDearly beloved, we are gathered here today to witness and celebrate the union of Sarah Johnson and David Chen in marriage...",
      createdDate: "Aug 10, 2024",
      type: "Traditional",
      status: "completed",
    },
  ]);
  const [scriptBuilderTab, setScriptBuilderTab] = useState("mr-script");
  const [scriptMode, setScriptMode] = useState<"guided" | "expert" | null>(
    null
  );

  // AI Chatbot states for Guided Mode
  const [showGuidedChatbot, setShowGuidedChatbot] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<Record<string, string>>(
    {}
  );
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [ceremonyProfile, setCeremonyProfile] = useState<CeremonyProfile>({
    ceremonyType: "",
    duration: "",
    tone: "",
    specialRequests: [],
    couplePreferences: {},
  });
  const [messages, setMessages] = useState<any[]>([]);

  // Couple-Officiant messaging state (separate from Mr. Script AI chat)
  const [coupleMessages, setCoupleMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Guided Mode ceremony configuration
  const [selectedCeremonyStyle, setSelectedCeremonyStyle] = useState("");
  const [selectedCeremonyLength, setSelectedCeremonyLength] = useState("");
  const [selectedUnityCeremony, setSelectedUnityCeremony] = useState("");
  const [selectedVowsType, setSelectedVowsType] = useState("");
  const [selectedReadingStyle, setSelectedReadingStyle] = useState("");

  // Questionnaire responses for personalized script generation
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<string, string>>({});
  const [currentQuestionnaireIndex, setCurrentQuestionnaireIndex] = useState(0);
  const [questionnaireStarted, setQuestionnaireStarted] = useState(false);

  // Generated script tracking
  const [hasGeneratedScript, setHasGeneratedScript] = useState(false);
  const [generatedScriptContent, setGeneratedScriptContent] = useState("");
  const [scriptSegments, setScriptSegments] = useState<string[]>([]);

  // Segment regeneration state
  const [regeneratingSegment, setRegeneratingSegment] = useState<number | null>(null);
  const [segmentInstructions, setSegmentInstructions] = useState("");
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);

  // Refinement mode state
  const [isRefineMode, setIsRefineMode] = useState(false);
  const [refineQuestionIndex, setRefineQuestionIndex] = useState(0);
  const [refineResponses, setRefineResponses] = useState<Record<string, string>>({});
  const [isRefining, setIsRefining] = useState(false);

  // Progressive button unlock tracking
  const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState(0);
  const [refineCompleted, setRefineCompleted] = useState(false);
  const [hasExecutedQuickGenerate, setHasExecutedQuickGenerate] = useState(false);

  // Follow-up question tracking
  const [pendingFollowUp, setPendingFollowUp] = useState<{
    originalOption: string;
    questionId: string;
    questionIndex: number;
    followUp: FollowUpQuestion;
  } | null>(null);

  // Chat scroll ref
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatMessagesRef.current?.scrollTo({
      top: chatMessagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, isTyping]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Log saved ceremonies for debugging
  useEffect(() => {
    if (savedCeremonies.length > 0) {
      console.log("📋 Saved Ceremonies:", savedCeremonies);
    }
  }, [savedCeremonies]);

  // Script Management States
  const [showScriptEditorDialog, setShowScriptEditorDialog] = useState(false);
  const [showScriptViewerDialog, setShowScriptViewerDialog] = useState(false);
  const [showShareScriptDialog, setShowShareScriptDialog] = useState(false);
  const [editingScript, setEditingScript] = useState<any>(null);
  const [viewingScript, setViewingScript] = useState<any>(null);
  const [sharingScript, setSharingScript] = useState<any>(null);
  const [scriptContent, setScriptContent] = useState("");
  const [editorFontSize, setEditorFontSize] = useState(16);
  const editorRef = useRef<HTMLDivElement>(null);
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);
  const [shareScriptForm, setShareScriptForm] = useState({
    to: "both",
    customEmail: "",
    subject: "",
    body: "",
    includeNotes: true,
  });
  const [selectedItemsToShare, setSelectedItemsToShare] = useState<{
    scripts: number[];
    files: number[];
  }>({
    scripts: [],
    files: [],
  });

  // Mock data for existing features

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Load global documents from dashboard on mount
  // useEffect(() => {
  //   const globalDocs = localStorage.getItem("officiantDocuments")
  //   if (globalDocs) {
  //     try {
  //       const parsedDocs = JSON.parse(globalDocs)
  //       // Transform to file format and add to files
  //       const transformedDocs = parsedDocs.map((doc: { id: string; name: string; size: string; type: string; updated: string }) => ({
  //         id: parseInt(doc.id) || Math.random() * 10000,
  //         name: doc.name,
  //         size: doc.size,
  //         uploadedBy: "Pastor Michael (Dashboard)",
  //         date: doc.updated,
  //         type: doc.type.toLowerCase() === "pdf" ? "application/pdf" : "application/octet-stream",
  //         url: "/api/placeholder/file"
  //       }))
  //       setFiles(prev => {
  //         // Merge with existing files, avoiding duplicates
  //         const existingNames = new Set(prev.map(f => f.name))
  //         const newDocs = transformedDocs.filter((doc: { name: string }) => !existingNames.has(doc.name))
  //         return [...prev, ...newDocs]
  //       })
  //     } catch (e) {
  //       console.error("Failed to load global documents:", e)
  //     }
  //   }
  // }, [])

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  // Calendar events data
  const calendarEvents = {
    "2024-08-15": {
      events: [
        {
          id: 1,
          time: "2:00 PM",
          title: "Pre-marriage Consultation",
          type: "meeting",
          location: "Pastor Michael's Office",
          attendees: ["Sarah Johnson", "David Chen"],
        },
      ],
    },
    "2024-08-20": {
      events: [
        {
          id: 2,
          time: "3:00 PM",
          title: "Ceremony Planning Review",
          type: "meeting",
          location: "Video Call",
          attendees: ["Sarah Johnson", "David Chen"],
        },
      ],
    },
    "2024-08-22": {
      events: [
        {
          id: 3,
          time: "11:00 AM",
          title: "Final venue walkthrough",
          type: "task",
          location: "Sunset Gardens",
          attendees: ["Pastor Michael"],
        },
        {
          id: 4,
          time: "2:00 PM",
          title: "Marriage license review",
          type: "task",
          location: "City Hall",
          attendees: ["Pastor Michael"],
        },
      ],
    },
    "2024-08-24": {
      events: [
        {
          id: 5,
          time: "6:00 PM",
          title: "Wedding Rehearsal",
          type: "rehearsal",
          location: "Sunset Gardens",
          attendees: ["Wedding Party", "Pastor Michael"],
        },
      ],
    },
    "2024-08-25": {
      events: [
        {
          id: 6,
          time: "3:00 PM",
          title: "Setup and preparation",
          type: "preparation",
          location: "Sunset Gardens",
          attendees: ["Pastor Michael"],
        },
        {
          id: 7,
          time: "4:00 PM",
          title: "Wedding Ceremony",
          type: "ceremony",
          location: "Sunset Gardens",
          attendees: ["75 guests"],
        },
      ],
    },
    "2024-08-26": {
      events: [
        {
          id: 8,
          time: "10:00 AM",
          title: "Follow-up call",
          type: "follow-up",
          location: "Phone",
          attendees: ["Sarah Johnson", "David Chen"],
        },
      ],
    },
  };

  const getSelectedDateDetails = () => {
    if (!selectedDate) return null;
    const dateKey = selectedDate.toISOString().split("T")[0];
    return (calendarEvents as any)[dateKey] || null;
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return "🤝";
      case "task":
        return "✅";
      case "rehearsal":
        return "🎭";
      case "ceremony":
        return "💒";
      case "preparation":
        return "⚙️";
      case "follow-up":
        return "📞";
      default:
        return "📅";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "task":
        return "bg-green-100 text-green-800 border-green-200";
      case "rehearsal":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "ceremony":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "preparation":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "follow-up":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const [contracts, setContracts] = useState<Contract[]>([]);

  // AI Script Builder Functions
  const handleAiMessage = () => {
    if (!aiInput.trim()) return;

    // Add user message
    const userMessage = {
      id: aiChatMessages.length + 1,
      role: "user",
      content: aiInput,
      timestamp: new Date().toLocaleTimeString(),
    };

    setAiChatMessages((prev) => [...prev, userMessage]);
    setAiInput("");

    // Generate AI response
    setIsGeneratingScript(true);
    setTimeout(() => {
      const aiResponse = generateAiResponse(aiInput, userResponses);
      const assistantMessage = {
        id: aiChatMessages.length + 2,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString(),
      };
      setAiChatMessages((prev) => [...prev, assistantMessage]);
      setIsGeneratingScript(false);
    }, 2000);
  };

  const generateAiResponse = (
    userInput: string,
    previousResponses: Record<string, string>
  ) => {
    const lowerInput = userInput.toLowerCase();

    if (
      lowerInput.includes("traditional") ||
      lowerInput.includes("religious")
    ) {
      return "Perfect! I'll help you create a traditional religious ceremony script. Here are some questions to personalize it:\n\n1. What religious tradition should we follow?\n2. Are there specific readings or prayers you'd like included?\n3. Will there be any cultural elements to incorporate?\n\nWould you like me to generate a traditional script template to start with?";
    }

    if (lowerInput.includes("modern") || lowerInput.includes("contemporary")) {
      return "Great choice! Modern ceremonies offer wonderful flexibility. Let me know:\n\n1. Do you prefer a spiritual but non-religious approach?\n2. Are there personal vows being exchanged?\n3. Any unity ceremonies (sand, candle, etc.)?\n\nShould I create a contemporary script outline for Sarah and David?";
    }

    if (
      lowerInput.includes("generate") ||
      lowerInput.includes("create") ||
      lowerInput.includes("yes")
    ) {
      return "Excellent! I'm generating a personalized ceremony script for Sarah Johnson & David Chen. This will include:\n\n• Processional guidance\n• Opening words\n• Exchange of vows section\n• Ring ceremony\n• Unity ceremony (optional)\n• Pronouncement and kiss\n• Recessional\n\nThe script is being created and will be saved to your files. Would you like me to customize any specific sections?";
    }

    if (lowerInput.includes("vows") || lowerInput.includes("rings")) {
      return "For the vow exchange, I can provide:\n\n• Traditional vows template\n• Guide for personal vow writing\n• Sample vow examples\n• Ring exchange wording\n\nWould you like me to create a complete vows section for their ceremony?";
    }

    return "I understand! Let me help you with that. I can assist with:\n\n• Creating ceremony scripts from scratch\n• Customizing existing templates\n• Adding personal touches and stories\n• Incorporating special readings or music\n• Adjusting tone and style\n\nWhat specific aspect of the ceremony script would you like to work on first?";
  };

  const handleGenerateScript = (scriptType: string) => {
    setIsGeneratingScript(true);

    setTimeout(() => {
      const newScript = {
        id: generatedScripts.length + 1,
        title: `${scriptType} Ceremony Script - Sarah & David`,
        content: generateScriptContent(scriptType),
        createdDate: new Date().toLocaleDateString(),
        type: scriptType,
        status: "completed",
      };

      setGeneratedScripts((prev) => [...prev, newScript]);

      // Add to files as well
      const scriptFile: UploadedFile = {
        id: `script_${newScript.id}_${Date.now()}`,
        file: new File([newScript.content], `${newScript.title}.txt`, {
          type: "text/plain",
        }),
        name: `${newScript.title}.txt`,
        size: newScript.content.length,
        type: "text/plain",
        url: "#",
        uploadProgress: 100,
        status: "completed",
      };

      setUploadedFiles((prev) => [...prev, scriptFile]);
      setIsGeneratingScript(false);

      const confirmationMessage = {
        id: aiChatMessages.length + 1,
        role: "assistant",
        content: `Perfect! I've generated a ${scriptType.toLowerCase()} ceremony script for Sarah & David. The script is now open in the Script Editor tab where you can customize it. - Mr. Script`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setAiChatMessages((prev) => [...prev, confirmationMessage]);

      // Auto-open new Script Editor with generated content
      setEditingScript(newScript);
      const cleanContent = newScript.content;
      if (onScriptUploaded) {
        onScriptUploaded(cleanContent, `${newScript.title}.txt`);
      }
    }, 3000);
  };

  const generateScriptContent = (scriptType: string) => {
    const couple = `${editCoupleInfo.brideName} and ${editCoupleInfo.groomName}`;
    const venue = editWeddingDetails.venueName;
    const date = new Date(editWeddingDetails.weddingDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    return `${scriptType.toUpperCase()} WEDDING CEREMONY SCRIPT
Generated by Mr. Script for ${couple}
${venue} - ${date}

PROCESSIONAL
[Music begins as wedding party enters]

OPENING WORDS
"Dearly beloved, we are gathered here today at ${venue} to celebrate the union of ${couple} in marriage. On this beautiful ${date}, we witness not just the joining of two hearts, but the creation of a new family built on love, trust, and commitment.

${editCoupleInfo.brideName} and ${editCoupleInfo.groomName
      }, you have chosen to share your lives together, and we are honored to be part of this special moment."

DECLARATION OF INTENT
"${editCoupleInfo.brideName}, do you take ${editCoupleInfo.groomName
      } to be your lawfully wedded husband, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?"

"${editCoupleInfo.groomName}, do you take ${editCoupleInfo.brideName
      } to be your lawfully wedded wife, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?"

EXCHANGE OF VOWS
[Personal vows to be exchanged]

RING CEREMONY
"These rings serve as a symbol of your unending love and commitment. As you place them on each other's hands, remember that love is not just a feeling, but a choice you make every day."

PRONOUNCEMENT
"By the power vested in me, and in the presence of these witnesses, I now pronounce you husband and wife. You may kiss!"

RECESSIONAL
[Couple exits as music plays]

---
This script has been customized for your ceremony by Mr. Script. Feel free to modify any sections to better reflect your style and preferences.

Best regards,
Mr. Script - Your Personal Wedding Script Creator`;
  };
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleModeSelect = (mode: "guided" | "expert") => {
    setScriptMode(mode);

    // Initialize chatbot for guided mode
    if (mode === "guided") {
      setShowGuidedChatbot(true);
      initializeChatbot();
    } else {
      setShowGuidedChatbot(false);
    }
  };

  // AI Chatbot Handler Functions
  const initializeChatbot = () => {
    // Start with empty chat - no automatic welcome message
    setChatMessages([]);
    setCurrentQuestionIndex(0);
    setUserResponses({});

    // No automatic questions - wait for user to interact via Quick Setup
  };

  const askNextQuestion = (questionIndex: number) => {
    if (questionIndex >= GUIDED_QUESTIONS.length) {
      // All questions completed
      generateFinalRecommendation();
      return;
    }

    const question = GUIDED_QUESTIONS[questionIndex];

    // Skip if already answered
    if (userResponses[question.id]) {
      askNextQuestion(questionIndex + 1);
      return;
    }

    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = generateAIResponse(question, userResponses);
      const questionMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
        questionId: question.id,
      };

      setChatMessages((prev) => [...prev, questionMessage]);
      setIsTyping(false);
    }, 1000);
  };

  // Optimized chat submit - accepts message as parameter to work with memoized input
  const handleChatSubmit = useCallback((inputMessage: string) => {
    const message = inputMessage.trim();
    if (!message) return;

    const lowerInput = message.toLowerCase();

    // If questionnaire is active, handle the answer
    if (questionnaireStarted && currentQuestionnaireIndex < CEREMONY_QUESTIONNAIRE.length) {
      const answer = lowerInput === "skip" ? "" : message;
      handleQuestionnaireAnswer(answer);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);

    // Check for script generation commands (check FIRST before other patterns)
    const isGenerateCommand = /generate|create|make|build|start|begin|lets go|let's go|ready to|go ahead/i.test(lowerInput) &&
                              /script|ceremony|now|it|this/i.test(lowerInput);
    const isSimpleYes = /^(yes|yep|yeah|sure|ok|okay|go|do it|proceed|absolutely|definitely|please do)$/i.test(lowerInput.trim());

    if (isGenerateCommand || isSimpleYes) {
      // Check if we have enough info to generate (ceremony style and length selected)
      if (!selectedCeremonyStyle || !selectedCeremonyLength) {
        const needMoreInfoMessage: ChatMessage = {
          id: `ai-info-${Date.now()}`,
          type: "ai",
          content: `I'd love to generate your script! But first, please select a **Ceremony Style** and **Ceremony Length** from the Quick Setup section above. Once those are set, I can create your personalized ceremony script.`,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, needMoreInfoMessage]);
        return;
      }

      // Add acknowledgment before generating
      const acknowledgmentMessage: ChatMessage = {
        id: `ai-ack-${Date.now()}`,
        type: "ai",
        content: `Got it! I'm generating your ceremony script now...`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, acknowledgmentMessage]);
      generateAndSaveScript();
      return;
    }

    // Check for refine/customize commands
    const isRefineCommand = /refine|customize|modify|change|edit|update|adjust/i.test(lowerInput) &&
                            /script|ceremony|it|this/i.test(lowerInput);
    if (isRefineCommand && hasGeneratedScript) {
      const acknowledgmentMessage: ChatMessage = {
        id: `ai-ack-${Date.now()}`,
        type: "ai",
        content: `Great! Let's refine your ceremony script. I'll ask you a few questions to customize it further...`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, acknowledgmentMessage]);
      startRefineScript();
      return;
    }

    // Check for modification/addition requests (custom content to add)
    const isCustomRequest = /add|include|honor|mention|remember|incorporate|want|would like|can you|could you/i.test(lowerInput) &&
                            !/generate|create|make|build|script now/i.test(lowerInput); // Exclude if it's a generate command

    if (isCustomRequest) {
      // Save as a custom request
      setUserResponses((prev) => {
        const existingRequests = prev["custom_requests"] || "";
        const separator = existingRequests ? "; " : "";
        return {
          ...prev,
          ["custom_requests"]: existingRequests + separator + message,
        };
      });
      setQuestionsAnsweredCount((prev) => prev + 1);

      // Acknowledge the custom request
      const acknowledgmentMessage: ChatMessage = {
        id: `ai-ack-${Date.now()}`,
        type: "ai",
        content: `Absolutely! I've noted your request: "${message}"\n\nI'll make sure to include this in your ceremony script. Is there anything else you'd like to add?`,
        timestamp: new Date(),
      };
      setTimeout(() => {
        setChatMessages((prev) => [...prev, acknowledgmentMessage]);
      }, 300);

      // If script is already generated, also try to modify it
      if (hasGeneratedScript) {
        handleScriptModification(message);
      }
      return;
    }

    // Save answer to current guided question and increment count
    const currentQuestion = GUIDED_QUESTIONS[currentQuestionIndex];
    if (currentQuestion) {
      setUserResponses((prev) => ({
        ...prev,
        [currentQuestion.id]: message,
      }));
      setQuestionsAnsweredCount((prev) => prev + 1);

      // Add acknowledgment for guided question answers
      const acknowledgmentMessage: ChatMessage = {
        id: `ai-ack-${Date.now()}`,
        type: "ai",
        content: `Thanks for sharing! I'll use that in your ceremony script.`,
        timestamp: new Date(),
      };
      setTimeout(() => {
        setChatMessages((prev) => [...prev, acknowledgmentMessage]);
      }, 200);

      // Ask next question with slight delay for UX
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        askNextQuestion(currentQuestionIndex + 1);
      }, 700);
      return;
    }

    // Catch-all: Acknowledge any other free-form input
    setUserResponses((prev) => {
      const existingNotes = prev["additional_notes"] || "";
      const separator = existingNotes ? "; " : "";
      return {
        ...prev,
        ["additional_notes"]: existingNotes + separator + message,
      };
    });
    setQuestionsAnsweredCount((prev) => prev + 1);

    const acknowledgmentMessage: ChatMessage = {
      id: `ai-ack-${Date.now()}`,
      type: "ai",
      content: `Thank you for sharing! I've noted: "${message}"\n\nThis will be considered when creating your ceremony script. Feel free to share any other details or select options from the Quick Setup above to continue.`,
      timestamp: new Date(),
    };
    setTimeout(() => {
      setChatMessages((prev) => [...prev, acknowledgmentMessage]);
    }, 300);
  }, [questionnaireStarted, currentQuestionnaireIndex, hasGeneratedScript, currentQuestionIndex]);

  const handleQuickResponse = (response: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: response,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);

    // If script is already generated, treat as modification request
    if (hasGeneratedScript) {
      handleScriptModification(response);
      return;
    }

    // Check if this response needs a follow-up question
    const followUp = FOLLOW_UP_QUESTIONS[response];
    if (followUp) {
      // Save the original response
      const currentQuestion = GUIDED_QUESTIONS[currentQuestionIndex];
      if (currentQuestion) {
        setUserResponses((prev) => ({
          ...prev,
          [currentQuestion.id]: response,
        }));
        setQuestionsAnsweredCount((prev) => prev + 1);
      }

      // Set pending follow-up
      setPendingFollowUp({
        originalOption: response,
        questionId: currentQuestion?.id || "",
        questionIndex: currentQuestionIndex,
        followUp: followUp,
      });

      // Show follow-up question
      const followUpMessage: ChatMessage = {
        id: `ai-followup-${Date.now()}`,
        type: "ai",
        content: `Great choice! "${response}" is a wonderful option.\n\n📝 **${followUp.prompt}**${followUp.allowCustomInput ? "\n\n_You can select an option or type your own response._" : ""}`,
        timestamp: new Date(),
        isFollowUpQuestion: true,
        followUpData: {
          options: followUp.options || [],
          allowCustomInput: followUp.allowCustomInput || false,
          originalOption: response,
        },
      };
      setTimeout(() => {
        setChatMessages((prev) => [...prev, followUpMessage]);
      }, 300);
      return;
    }

    // Add acknowledgment from chatbot (for options without follow-ups)
    const acknowledgmentMessage: ChatMessage = {
      id: `ai-ack-${Date.now()}`,
      type: "ai",
      content: `Great choice! "${response}" will be incorporated into your ceremony script.`,
      timestamp: new Date(),
    };
    setTimeout(() => {
      setChatMessages((prev) => [...prev, acknowledgmentMessage]);
    }, 200);

    // Save answer and increment question count
    const currentQuestion = GUIDED_QUESTIONS[currentQuestionIndex];
    if (currentQuestion) {
      setUserResponses((prev) => ({
        ...prev,
        [currentQuestion.id]: response,
      }));
      setQuestionsAnsweredCount((prev) => prev + 1);
    }

    // Ask next question
    setTimeout(() => {
      setCurrentQuestionIndex((prev) => prev + 1);
      askNextQuestion(currentQuestionIndex + 1);
    }, 700);
  };

  // Handle follow-up question responses
  const handleFollowUpResponse = (response: string) => {
    const userMessage: ChatMessage = {
      id: `user-followup-${Date.now()}`,
      type: "user",
      content: response,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    if (pendingFollowUp) {
      // Check if this is a refinement follow-up or guided question follow-up
      const isRefineFollowUp = pendingFollowUp.questionId.startsWith("refine-") || isRefineMode;

      if (isRefineFollowUp) {
        // Save to refine responses
        setRefineResponses((prev) => ({
          ...prev,
          [`${pendingFollowUp.questionId}_detail`]: response,
        }));
      } else {
        // Save to user responses
        setUserResponses((prev) => ({
          ...prev,
          [`${pendingFollowUp.questionId}_detail`]: response,
        }));
      }
      setQuestionsAnsweredCount((prev) => prev + 1);

      // Acknowledge the follow-up
      const ackMessage: ChatMessage = {
        id: `ai-followup-ack-${Date.now()}`,
        type: "ai",
        content: `Perfect! I'll include ${pendingFollowUp.originalOption} with "${response}" in your ceremony script.`,
        timestamp: new Date(),
      };
      setTimeout(() => {
        setChatMessages((prev) => [...prev, ackMessage]);
      }, 200);

      const savedQuestionIndex = pendingFollowUp.questionIndex;

      // Clear pending follow-up
      setPendingFollowUp(null);

      // Move to next question based on context
      setTimeout(() => {
        if (isRefineFollowUp) {
          // Continue with refinement questions
          const newResponses = { ...refineResponses };
          const applicableQuestions = REFINEMENT_QUESTIONS.filter((q) => {
            if (!q.dependsOn) return true;
            const dependsOnValue = newResponses[q.dependsOn.questionId];
            return q.dependsOn.values.includes(dependsOnValue);
          });
          const nextIndex = savedQuestionIndex + 1;
          if (nextIndex >= applicableQuestions.length) {
            finishRefinement();
          } else {
            askNextRefineQuestion(nextIndex);
          }
        } else {
          // Continue with guided questions
          setCurrentQuestionIndex((prev) => prev + 1);
          askNextQuestion(currentQuestionIndex + 1);
        }
      }, 700);
    }
  };
  const generateFinalRecommendation = () => {
    setIsTyping(true);

    setTimeout(() => {
      const recommendation = generateRecommendation(userResponses);
      const recommendationMessage: ChatMessage = {
        id: `ai-final-${Date.now()}`,
        type: "ai",
        content: recommendation,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, recommendationMessage]);
      setIsTyping(false);
      // Note: The recommendation message already asks if the user wants to generate a script
      // We wait for user input - no automatic "Perfect!" message
    }, 1500);
  };

  const generateAndSaveScript = async () => {
    setIsTyping(true);

    // Show "generating" message with segment info
    const generatingMessage: ChatMessage = {
      id: `ai-generating-${Date.now()}`,
      type: "ai",
      content: `⏳ **Generating your COMPLETE ceremony script...**

I'm crafting a detailed ${selectedCeremonyLength || "20-30 minute"} ceremony script for ${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}.

📝 **Building your script in 5 detailed segments:**
1. Opening & Welcome
2. Declarations & Readings
3. Vows & Promises
4. Unity Ceremony & Rings
5. Closing & Pronouncement

This ensures MAXIMUM detail in each section. Please wait 30-60 seconds while I craft each part of your ceremony...`,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, generatingMessage]);

    try {
      // Get reading text if a reading style was selected
      let readingText = "";
      if (selectedReadingStyle && selectedReadingStyle !== "none") {
        const reading = getRandomReading(selectedReadingStyle);
        if (reading) {
          readingText = `${reading.title} by ${reading.author}: ${reading.text}`;
        }
      }

      // Call the ChatGPT API
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brideName: editCoupleInfo.brideName || "Sarah",
          groomName: editCoupleInfo.groomName || "David",
          venue: editWeddingDetails.venueName || "Wedding Venue",
          weddingDate: editWeddingDetails.weddingDate || "",
          ceremonyStyle: userResponses["ceremony-type"] || selectedCeremonyStyle || "Traditional",
          ceremonyLength: userResponses["ceremony-duration"] || selectedCeremonyLength || "20-30 minutes",
          ceremonyTone: userResponses["ceremony-tone"] || "Warm and Personal",
          unityCeremony: userResponses["special-elements"] || selectedUnityCeremony || "None",
          vowsType: userResponses["vows-type"] || selectedVowsType || "Traditional Vows",
          readingStyle: selectedReadingStyle || "none",
          readingText: readingText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate script");
      }

      const data = await response.json();
      const generatedScript = data.script;
      const segments = data.segments || [];

      // Save the script content and segments
      setGeneratedScriptContent(generatedScript);
      setScriptSegments(segments);
      setHasGeneratedScript(true);
      setHasExecutedQuickGenerate(true);

      // Send success message
      const scriptGeneratedMessage: ChatMessage = {
        id: `ai-script-generated-${Date.now()}`,
        type: "ai",
        content: `🎉 **Your COMPLETE ceremony script is ready!**

I've created a detailed, professional ${userResponses["ceremony-type"] || selectedCeremonyStyle || "Traditional"} ceremony script for ${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}.

**📜 Your script includes ALL 5 ceremony segments:**

**Part 1: Opening & Welcome**
✅ Processional instructions
✅ Warm welcome to guests
✅ Reflection on love and marriage

**Part 2: Declarations & Readings**
✅ Address to the couple
${selectedReadingStyle && selectedReadingStyle !== "none" ? `✅ ${selectedReadingStyle} reading` : ""}
✅ Declaration of Intent ("I do")

**Part 3: Vows & Promises**
✅ ${userResponses["vows-type"] || selectedVowsType || "Traditional"} vows (complete)

**Part 4: Unity & Rings**
${(userResponses["special-elements"] || selectedUnityCeremony) && (userResponses["special-elements"] || selectedUnityCeremony) !== "None"
            ? `✅ ${userResponses["special-elements"] || selectedUnityCeremony} ceremony`
            : ""}
✅ Ring exchange with full wording

**Part 5: Closing & Pronouncement**
✅ Blessing and closing words
✅ Official pronouncement
✅ First kiss & presentation

**Target Duration:** ${selectedCeremonyLength || "20-30 minutes"}

Click **"Generate Final Script"** to open your complete script in the editor!

💡 Want to add more? Click **"Refine Script"** to add unity ceremonies, religious elements, or other customizations.`,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, scriptGeneratedMessage]);
    } catch (error) {
      console.error("Error generating script:", error);

      // Fallback to static template if API fails
      const completeScript = generateCompleteScript(
        userResponses,
        editCoupleInfo,
        editWeddingDetails
      );
      setGeneratedScriptContent(completeScript);
      setHasGeneratedScript(true);
      setHasExecutedQuickGenerate(true); // Also set this so Refine button can unlock

      const errorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        type: "ai",
        content: `⚠️ **Script generated with fallback template**

I encountered an issue connecting to the AI service, so I've created your script using our standard template. The script is still complete and customized for ${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}.

Click "Generate Final Script" to view and edit your ceremony.

💡 **To unlock Refine Script:** Answer ${Math.max(0, 5 - questionsAnsweredCount)} more questions using the suggestion buttons or by typing responses.`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Segment names for display
  const SEGMENT_NAMES = [
    "Opening & Welcome",
    "Declarations & Readings",
    "Vows & Promises",
    "Unity & Rings",
    "Closing & Pronouncement"
  ];

  // Open segment regeneration dialog
  const openSegmentRegenerationDialog = (segmentIndex: number) => {
    setSelectedSegmentIndex(segmentIndex);
    setSegmentInstructions("");
    setShowSegmentDialog(true);
  };

  // Regenerate a single segment
  const regenerateSingleSegment = async () => {
    if (selectedSegmentIndex === null || scriptSegments.length === 0) return;

    setShowSegmentDialog(false);
    setRegeneratingSegment(selectedSegmentIndex);

    // Show progress message in chat
    const regeneratingMessage: ChatMessage = {
      id: `ai-regen-segment-${Date.now()}`,
      type: "ai",
      content: `🔄 **Regenerating Part ${selectedSegmentIndex + 1}: ${SEGMENT_NAMES[selectedSegmentIndex]}...**

${segmentInstructions ? `Applying your instructions: "${segmentInstructions}"` : "Creating a fresh version of this section."}

This will take about 10 seconds...`,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, regeneratingMessage]);

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brideName: editCoupleInfo.brideName || "Sarah",
          groomName: editCoupleInfo.groomName || "David",
          venue: editWeddingDetails.venueName || "Wedding Venue",
          weddingDate: editWeddingDetails.weddingDate || "",
          ceremonyStyle: userResponses["ceremony-type"] || selectedCeremonyStyle || "Traditional",
          ceremonyLength: userResponses["ceremony-duration"] || selectedCeremonyLength || "20-30 minutes",
          ceremonyTone: userResponses["ceremony-tone"] || "Warm and Personal",
          unityCeremony: userResponses["special-elements"] || selectedUnityCeremony || "None",
          vowsType: userResponses["vows-type"] || selectedVowsType || "Traditional Vows",
          readingStyle: selectedReadingStyle || "none",
          // Single segment regeneration params
          regenerateSegmentIndex: selectedSegmentIndex,
          existingSegments: scriptSegments,
          segmentInstructions: segmentInstructions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate segment");
      }

      const data = await response.json();

      // Update the script and segments
      setGeneratedScriptContent(data.script);
      setScriptSegments(data.segments);

      // Success message
      const successMessage: ChatMessage = {
        id: `ai-regen-success-${Date.now()}`,
        type: "ai",
        content: `✅ **Part ${selectedSegmentIndex + 1}: ${SEGMENT_NAMES[selectedSegmentIndex]} has been regenerated!**

${segmentInstructions ? `I applied your instructions: "${segmentInstructions}"` : "I created a fresh version while maintaining continuity with the other sections."}

Click **"Generate Final Script"** to see your updated ceremony!

💡 Want to regenerate another section? You can regenerate any of the 5 parts individually.`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, successMessage]);

    } catch (error) {
      console.error("Error regenerating segment:", error);
      const errorMessage: ChatMessage = {
        id: `ai-regen-error-${Date.now()}`,
        type: "ai",
        content: `⚠️ **Failed to regenerate this segment.**

Please try again or regenerate the full script.`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setRegeneratingSegment(null);
      setSelectedSegmentIndex(null);
      setSegmentInstructions("");
    }
  };

  // Start the Refine Script flow
  const startRefineScript = () => {
    if (!hasGeneratedScript) {
      alert("Please generate a script first before refining it.");
      return;
    }

    setIsRefineMode(true);
    setRefineQuestionIndex(0);
    setRefineResponses({});

    // Send intro message
    const refineIntroMessage: ChatMessage = {
      id: `ai-refine-intro-${Date.now()}`,
      type: "ai",
      content: `✨ **Let's Refine Your Ceremony Script!**

I can help you customize your script further. I'll ask a few questions about what you'd like to add, remove, or change.

Your current script includes:
- **Style:** ${userResponses["ceremony-type"] || selectedCeremonyStyle || "Traditional"}
- **Length:** ${selectedCeremonyLength || "20-30 minutes"}
- **Unity Ceremony:** ${userResponses["special-elements"] || selectedUnityCeremony || "None"}
- **Vows:** ${userResponses["vows-type"] || selectedVowsType || "Traditional"}

Let's make it even more perfect for ${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}!`,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, refineIntroMessage]);

    // Ask first refinement question
    setTimeout(() => askNextRefineQuestion(0), 1000);
  };

  // Ask the next refinement question
  const askNextRefineQuestion = (index: number) => {
    // Filter questions based on dependencies
    const applicableQuestions = REFINEMENT_QUESTIONS.filter((q) => {
      if (!q.dependsOn) return true;
      const dependsOnValue = refineResponses[q.dependsOn.questionId];
      return q.dependsOn.values.includes(dependsOnValue);
    });

    if (index >= applicableQuestions.length) {
      // All refinement questions answered - regenerate script
      finishRefinement();
      return;
    }

    const question = applicableQuestions[index];

    setIsTyping(true);
    setTimeout(() => {
      let questionContent = `📝 **${question.question}**`;
      if (question.aiRecommendation) {
        questionContent += `\n\n💡 ${question.aiRecommendation}`;
      }

      const questionMessage: ChatMessage = {
        id: `ai-refine-q-${index}-${Date.now()}`,
        type: "ai",
        content: questionContent,
        timestamp: new Date(),
        isRefineQuestion: true,
        refineQuestionData: {
          questionId: question.id,
          questionIndex: index,
          options: question.options || [],
          type: question.type === "text" ? "text" : "multiple-choice",
        },
      };

      setChatMessages((prev) => [...prev, questionMessage]);
      setIsTyping(false);
    }, 500);
  };

  // Handle refinement question response
  const handleRefineResponse = (questionId: string, response: string, questionIndex: number) => {
    // Save response and increment question count
    setRefineResponses((prev) => ({ ...prev, [questionId]: response }));
    setQuestionsAnsweredCount((prev) => prev + 1);

    // Add user's response to chat
    const userMessage: ChatMessage = {
      id: `user-refine-${Date.now()}`,
      type: "user",
      content: response,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    // Check if this response needs a follow-up question
    const followUp = FOLLOW_UP_QUESTIONS[response];
    const isSkipResponse = response.includes("Skip") || response.includes("No Additional") || response.includes("Keep As Is") || response.includes("Keep Current") || response.includes("No Changes") || response.includes("Not Needed");

    if (followUp && !isSkipResponse) {
      // Set pending follow-up for refinement
      setPendingFollowUp({
        originalOption: response,
        questionId: questionId,
        questionIndex: questionIndex,
        followUp: followUp,
      });

      // Show follow-up question
      const followUpMessage: ChatMessage = {
        id: `ai-refine-followup-${Date.now()}`,
        type: "ai",
        content: `Great choice! "${response}" is a wonderful addition.\n\n📝 **${followUp.prompt}**${followUp.allowCustomInput ? "\n\n_You can select an option or type your own response._" : ""}`,
        timestamp: new Date(),
        isFollowUpQuestion: true,
        followUpData: {
          options: followUp.options || [],
          allowCustomInput: followUp.allowCustomInput || false,
          originalOption: response,
        },
      };
      setTimeout(() => {
        setChatMessages((prev) => [...prev, followUpMessage]);
      }, 300);
      return;
    }

    // Add acknowledgment from chatbot
    const acknowledgmentMessage: ChatMessage = {
      id: `ai-ack-${Date.now()}`,
      type: "ai",
      content: isSkipResponse
        ? `Got it! Moving on to the next question.`
        : `Perfect! I'll include "${response}" in your ceremony script.`,
      timestamp: new Date(),
    };
    setTimeout(() => {
      setChatMessages((prev) => [...prev, acknowledgmentMessage]);
    }, 300);

    // Move to next question
    setTimeout(() => {
      // Recalculate applicable questions with new responses
      const newResponses = { ...refineResponses, [questionId]: response };
      const applicableQuestions = REFINEMENT_QUESTIONS.filter((q) => {
        if (!q.dependsOn) return true;
        const dependsOnValue = newResponses[q.dependsOn.questionId];
        return q.dependsOn.values.includes(dependsOnValue);
      });

      const nextIndex = questionIndex + 1;
      if (nextIndex >= applicableQuestions.length) {
        finishRefinement();
      } else {
        askNextRefineQuestion(nextIndex);
      }
    }, 500);
  };

  // Finish refinement and regenerate script
  const finishRefinement = async () => {
    setIsRefining(true);
    setIsTyping(true);

    // Show generating message
    const generatingMessage: ChatMessage = {
      id: `ai-refine-generating-${Date.now()}`,
      type: "ai",
      content: `⏳ **Updating your ceremony script with refinements...**

I'm incorporating your requested changes:
${refineResponses["refine-add-elements"] && refineResponses["refine-add-elements"] !== "No additions needed" ? `➕ Adding: ${refineResponses["refine-add-elements"]}` : ""}
${refineResponses["refine-unity-type"] && refineResponses["refine-unity-type"] !== "Skip this" ? `🕯️ Unity Ceremony: ${refineResponses["refine-unity-type"]}` : ""}
${refineResponses["refine-religious-type"] && refineResponses["refine-religious-type"] !== "Skip this" ? `✝️ Religious Elements: ${refineResponses["refine-religious-type"]}` : ""}
${refineResponses["refine-remove-elements"] && refineResponses["refine-remove-elements"] !== "No changes needed" ? `➖ Adjusting: ${refineResponses["refine-remove-elements"]}` : ""}
${refineResponses["refine-tone-adjust"] && refineResponses["refine-tone-adjust"] !== "Keep current tone" ? `🎭 Tone: ${refineResponses["refine-tone-adjust"]}` : ""}
${refineResponses["refine-custom-request"] ? `📝 Custom: ${refineResponses["refine-custom-request"]}` : ""}

Please wait while I refine your script...`,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, generatingMessage]);

    try {
      // Build refinement prompt additions
      let refinementInstructions = "\n\n**REFINEMENT REQUESTS:**\n";

      if (refineResponses["refine-add-elements"] && refineResponses["refine-add-elements"] !== "No additions needed") {
        refinementInstructions += `- ADD: ${refineResponses["refine-add-elements"]}\n`;
      }
      if (refineResponses["refine-unity-type"] && refineResponses["refine-unity-type"] !== "Skip this") {
        refinementInstructions += `- ADD Unity Ceremony: ${refineResponses["refine-unity-type"]} with full script and instructions\n`;
      }
      if (refineResponses["refine-religious-type"] && refineResponses["refine-religious-type"] !== "Skip this") {
        refinementInstructions += `- ADD Religious Elements: ${refineResponses["refine-religious-type"]}\n`;
      }
      if (refineResponses["refine-cultural"]) {
        refinementInstructions += `- ADD Cultural Traditions: ${refineResponses["refine-cultural"]}\n`;
      }
      if (refineResponses["refine-remove-elements"] && refineResponses["refine-remove-elements"] !== "No changes needed") {
        refinementInstructions += `- MODIFY: ${refineResponses["refine-remove-elements"]}\n`;
      }
      if (refineResponses["refine-tone-adjust"] && refineResponses["refine-tone-adjust"] !== "Keep current tone") {
        refinementInstructions += `- ADJUST TONE: ${refineResponses["refine-tone-adjust"]}\n`;
      }
      if (refineResponses["refine-custom-request"]) {
        refinementInstructions += `- CUSTOM REQUEST: ${refineResponses["refine-custom-request"]}\n`;
      }

      // Get reading text if selected
      let readingText = "";
      if (selectedReadingStyle && selectedReadingStyle !== "none") {
        const reading = getRandomReading(selectedReadingStyle);
        if (reading) {
          readingText = `${reading.title} by ${reading.author}: ${reading.text}`;
        }
      }

      // Call API with refinement instructions
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brideName: editCoupleInfo.brideName || "Sarah",
          groomName: editCoupleInfo.groomName || "David",
          venue: editWeddingDetails.venueName || "Wedding Venue",
          weddingDate: editWeddingDetails.weddingDate || "",
          ceremonyStyle: userResponses["ceremony-type"] || selectedCeremonyStyle || "Traditional",
          ceremonyLength: userResponses["ceremony-duration"] || selectedCeremonyLength || "20-30 minutes",
          ceremonyTone: refineResponses["refine-tone-adjust"] || userResponses["ceremony-tone"] || "Warm and Personal",
          unityCeremony: refineResponses["refine-unity-type"] || userResponses["special-elements"] || selectedUnityCeremony || "None",
          vowsType: userResponses["vows-type"] || selectedVowsType || "Traditional Vows",
          readingStyle: selectedReadingStyle || "none",
          readingText: readingText,
          refinementInstructions: refinementInstructions,
          additionalUnity: refineResponses["refine-unity-type"],
          religiousElements: refineResponses["refine-religious-type"],
          culturalTraditions: refineResponses["refine-cultural"],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refine script");
      }

      const data = await response.json();
      const refinedScript = data.script;

      // Save the refined script
      setGeneratedScriptContent(refinedScript);

      // Success message
      const successMessage: ChatMessage = {
        id: `ai-refine-success-${Date.now()}`,
        type: "ai",
        content: `🎉 **Your script has been refined!**

I've updated your ceremony script with all your requested changes:
${refineResponses["refine-add-elements"] && refineResponses["refine-add-elements"] !== "No additions needed" ? `✅ Added: ${refineResponses["refine-add-elements"]}` : ""}
${refineResponses["refine-unity-type"] && refineResponses["refine-unity-type"] !== "Skip this" ? `✅ ${refineResponses["refine-unity-type"]} ceremony included` : ""}
${refineResponses["refine-religious-type"] && refineResponses["refine-religious-type"] !== "Skip this" ? `✅ ${refineResponses["refine-religious-type"]} elements added` : ""}
${refineResponses["refine-remove-elements"] && refineResponses["refine-remove-elements"] !== "No changes needed" ? `✅ Adjusted: ${refineResponses["refine-remove-elements"]}` : ""}
${refineResponses["refine-tone-adjust"] && refineResponses["refine-tone-adjust"] !== "Keep current tone" ? `✅ Tone adjusted: ${refineResponses["refine-tone-adjust"]}` : ""}

Click **"Generate Final Script"** to view your updated ceremony in the editor!

💡 **Want more changes?** Click "Refine Script" again to make additional adjustments.`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, successMessage]);

    } catch (error) {
      console.error("Error refining script:", error);
      const errorMessage: ChatMessage = {
        id: `ai-refine-error-${Date.now()}`,
        type: "ai",
        content: `⚠️ **I encountered an issue refining your script.**

Don't worry - your original script is still saved. You can:
1. Click "Generate Final Script" to view and manually edit your current script
2. Try "Refine Script" again to retry the refinements

I apologize for the inconvenience!`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsRefining(false);
      setIsRefineMode(false);
      setIsTyping(false);
      setRefineCompleted(true);
    }
  };

  // Ask the next questionnaire question
  const askNextQuestionnaireQuestion = (index: number) => {
    if (index >= CEREMONY_QUESTIONNAIRE.length) {
      // All questions answered - ready to generate
      const completionMessage: ChatMessage = {
        id: `ai-complete-${Date.now()}`,
        type: "ai",
        content: `🎉 **Wonderful! I have all the details I need!**

Thank you for sharing your story with me. I now have everything to create a truly personalized ceremony script for you.

**Quick Summary:**
- **Couple:** ${questionnaireResponses["bride-name"] || editCoupleInfo.brideName} & ${questionnaireResponses["groom-name"] || editCoupleInfo.groomName}
- **Date:** ${questionnaireResponses["ceremony-date"] || "TBD"}
- **Venue:** ${questionnaireResponses["ceremony-location"] || "TBD"}
- **Style:** ${selectedCeremonyStyle || "Traditional"}
- **Duration:** ${selectedCeremonyLength || "20-30 minutes"}

Click **"Generate Final Script"** below and I'll create your complete, personalized ceremony script!`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, completionMessage]);
      return;
    }

    const question = CEREMONY_QUESTIONNAIRE[index];
    const category = QUESTIONNAIRE_CATEGORIES.find(c => c.id === question.category);

    setIsTyping(true);
    setTimeout(() => {
      let questionText = `${category?.icon || "📝"} **${question.question}**`;
      if (question.followUp) {
        questionText += `\n\n_${question.followUp}_`;
      }
      if (question.type === "select" && question.options) {
        questionText += `\n\nOptions: ${question.options.join(", ")}`;
      }

      const questionMessage: ChatMessage = {
        id: `ai-q-${Date.now()}`,
        type: "ai",
        content: questionText,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, questionMessage]);
      setIsTyping(false);
    }, 500);
  };

  // Handle questionnaire answer and move to next question
  const handleQuestionnaireAnswer = (answer: string) => {
    const currentQuestion = CEREMONY_QUESTIONNAIRE[currentQuestionnaireIndex];

    // Save the answer and increment question count
    setQuestionnaireResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
    setQuestionsAnsweredCount((prev) => prev + 1);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: answer,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    // Add acknowledgment from chatbot
    const isSkipped = answer.toLowerCase() === "skip" || answer.trim() === "";
    const acknowledgmentMessage: ChatMessage = {
      id: `ai-ack-${Date.now()}`,
      type: "ai",
      content: isSkipped
        ? `No problem, we'll skip that one. Let's continue!`
        : `Thank you for sharing! I'll incorporate that into your ceremony script.`,
      timestamp: new Date(),
    };
    setTimeout(() => {
      setChatMessages((prev) => [...prev, acknowledgmentMessage]);
    }, 200);

    // Move to next question
    const nextIndex = currentQuestionnaireIndex + 1;
    setCurrentQuestionnaireIndex(nextIndex);

    // Ask next question after a short delay (increased to account for acknowledgment)
    setTimeout(() => {
      askNextQuestionnaireQuestion(nextIndex);
    }, 600);
  };

  // Start the questionnaire flow
  const startQuestionnaire = () => {
    setQuestionnaireStarted(true);
    setCurrentQuestionnaireIndex(0);

    const introMessage: ChatMessage = {
      id: `ai-intro-${Date.now()}`,
      type: "ai",
      content: `👋 **Hi! I'm Mr. Script, your personal ceremony writer.**

I'm going to ask you some questions to learn about your love story and ceremony preferences. The more details you share, the more personalized your script will be!

Let's start with the basics and work our way to the good stuff - your love story! 💕

*You can type your answers below, or if you need to skip a question, just type "skip".*`,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, introMessage]);

    // Ask first question after intro
    setTimeout(() => {
      askNextQuestionnaireQuestion(0);
    }, 1000);
  };

  const resetChatbot = () => {
    setChatMessages([]);
    setCurrentQuestionIndex(0);
    setUserResponses({});
    setIsTyping(false);
    setHasGeneratedScript(false);
    setGeneratedScriptContent("");
    // Reset questionnaire state
    setQuestionnaireResponses({});
    setCurrentQuestionnaireIndex(0);
    setQuestionnaireStarted(false);
    // Reset refinement state
    setIsRefineMode(false);
    setRefineQuestionIndex(0);
    setRefineResponses({});
    // Reset progressive unlock state
    setQuestionsAnsweredCount(0);
    setRefineCompleted(false);
    setHasExecutedQuickGenerate(false);
    // Reset follow-up state
    setPendingFollowUp(null);
    initializeChatbot();
  };

  // Handle ceremony style and length generation request
  const handleGenerateRequest = () => {
    if (!selectedCeremonyStyle || !selectedCeremonyLength) {
      alert(
        "Please select both ceremony style and duration to generate a script request for Mr. Script"
      );
      return;
    }

    // Pre-populate responses based on Quick Setup selections
    const quickSetupResponses: Record<string, string> = {};

    if (selectedCeremonyStyle) {
      quickSetupResponses["ceremony-type"] = selectedCeremonyStyle;
    }

    if (selectedCeremonyLength) {
      quickSetupResponses["ceremony-duration"] = selectedCeremonyLength;
    }

    if (selectedUnityCeremony && selectedUnityCeremony !== "None") {
      quickSetupResponses["special-elements"] = selectedUnityCeremony;
    } else if (selectedUnityCeremony === "None") {
      quickSetupResponses["special-elements"] = "None";
    }

    if (selectedVowsType) {
      // Map the vows selection to match the guided question options
      if (selectedVowsType === "Traditional") {
        quickSetupResponses["vows-type"] = "Traditional Vows";
      } else if (selectedVowsType === "Personal") {
        quickSetupResponses["vows-type"] = "Personal Written Vows";
      } else if (selectedVowsType === "Personal and Modern") {
        quickSetupResponses["vows-type"] = "Traditional + Personal Vows";
      } else {
        quickSetupResponses["vows-type"] = selectedVowsType;
      }
    }

    // Set the responses immediately
    setUserResponses(quickSetupResponses);

    // Build description with all selections
    let ceremonyDescription = `${selectedCeremonyStyle} ceremony script that's ${selectedCeremonyLength} long`;

    if (selectedUnityCeremony && selectedUnityCeremony !== "None") {
      ceremonyDescription += ` with a ${selectedUnityCeremony} unity ceremony`;
    }

    if (selectedVowsType) {
      ceremonyDescription += ` featuring ${selectedVowsType} vows`;
    }

    // Add the request as a user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: `Generate a ${ceremonyDescription}`,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);

    // Generate AI response that acknowledges the provided information
    setTimeout(() => {
      let aiResponse = `Perfect! I have all the key details from your Quick Setup:

✅ **Ceremony Style**: ${selectedCeremonyStyle}
✅ **Duration**: ${selectedCeremonyLength}
✅ **Unity Ceremony**: ${selectedUnityCeremony || "None selected"}
✅ **Vows**: ${selectedVowsType || "Not specified"}

Based on these selections, I'll create a beautiful ceremony for ${editCoupleInfo.brideName
        } & ${editCoupleInfo.groomName
        }. Let me focus on the remaining details to perfect your script:`;

      // Add specific recommendations based on style
      if (selectedCeremonyStyle === "Traditional") {
        aiResponse += `\n\nFor your traditional ceremony, I'll include classic elements like formal processional music, traditional ring exchange, and time-honored language that creates a dignified atmosphere.`;
      } else if (selectedCeremonyStyle === "Modern") {
        aiResponse += `\n\nFor your modern ceremony, I'll incorporate contemporary elements with personalized touches, flexible structure, and current language that reflects today's relationships.`;
      } else if (selectedCeremonyStyle === "Religious") {
        aiResponse += `\n\nFor your religious ceremony, I'll include appropriate blessings, scripture readings, and faith-based elements that honor your spiritual traditions.`;
      }

      // Check if we need to ask about ceremony tone (since it's not covered in Quick Setup)
      const stillNeedTone = !quickSetupResponses["ceremony-tone"];

      if (stillNeedTone) {
        aiResponse += `\n\nTo complete your ceremony script, I just need to know: What tone would you like for the ceremony? Would you prefer it to be Formal and Traditional, Warm and Personal, Light and Joyful, Intimate and Romantic, or Fun and Casual?`;

        // Set up to ask only the remaining question
        setCurrentQuestionIndex(2); // ceremony-tone is index 2
      } else {
        aiResponse += `\n\nI have everything I need! I'll now generate your complete ceremony script.`;
        setCurrentQuestionIndex(GUIDED_QUESTIONS.length); // Skip all questions

        // Automatically generate the script since we have all the info
        setTimeout(() => {
          generateAndSaveScript();
        }, 2000);
      }

      const responseMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, responseMessage]);
    }, 1000);
  };

  // Text Editor Helper Functions
  const insertTextAtCursor = (before: string, after: string) => {
    const editorElement = editorRef.current;
    if (!editorElement) return;

    // Save cursor position
    saveCursorPosition();

    // Focus the editor
    editorElement.focus();

    // Get current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      // Create the new content
      const textNode = document.createTextNode(before + selectedText + after);

      // Replace the selection
      range.deleteContents();
      range.insertNode(textNode);

      // Position cursor after the inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Update content
    setTimeout(() => {
      setScriptContent(editorElement.innerHTML);
    }, 10);
  };

  const applyFormatting = (command: string, value?: string) => {
    const editorElement =
      editorRef.current || document.getElementById("script-editor");
    if (editorElement && editorElement.contentEditable === "true") {
      // Save cursor position before formatting
      saveCursorPosition();

      // Focus the editor first to ensure we have an active selection
      editorElement.focus();

      // Apply the formatting command
      const success = document.execCommand(command, false, value);

      // Update content after formatting
      setTimeout(() => {
        setScriptContent(editorElement.innerHTML);
        restoreCursorPosition();
      }, 10);

      return success;
    }
    return false;
  };

  const applyTextColor = (color: string) => {
    const editorElement =
      editorRef.current || document.getElementById("script-editor");
    if (!editorElement) return;

    // Save cursor position before applying color
    saveCursorPosition();

    // Focus the editor first
    editorElement.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
      // No text selected, apply color for future typing
      document.execCommand("foreColor", false, color);
    } else {
      // Text is selected, apply color to selection
      const selectedText = range.extractContents();
      const span = document.createElement("span");
      span.style.color = color;
      span.appendChild(selectedText);
      range.insertNode(span);

      // Clear selection and update content
      selection.removeAllRanges();
    }

    // Update content and restore cursor position
    setTimeout(() => {
      setScriptContent(editorElement.innerHTML);
      restoreCursorPosition();
    }, 10);
  };

  const increaseFontSize = () => {
    if (editorFontSize < 24) {
      setEditorFontSize((prev) => prev + 2);
    }
  };

  const decreaseFontSize = () => {
    if (editorFontSize > 12) {
      setEditorFontSize((prev) => prev - 2);
    }
  };

  const autoSave = () => {
    if (editingScript) {
      // Get the current content from the editor element to ensure we have the latest formatted content
      const editorElement =
        editorRef.current ||
        (document.getElementById("script-editor") as HTMLDivElement);
      let currentContent = scriptContent;

      if (editorElement) {
        currentContent = editorElement.innerHTML;
        setScriptContent(currentContent); // Update state with current editor content
      }

      if (currentContent.trim()) {
        const timestamp = new Date().toLocaleTimeString();
        // Auto-save with formatting preserved

        localStorage.setItem(`script_${editingScript.id}`, currentContent);
        localStorage.setItem(
          `script_${editingScript.id}_autosave_time`,
          timestamp
        );

        console.log(
          `Auto-saved "${editingScript.title}" with formatting at ${timestamp}`
        );
        alert(
          `💾 Auto-saved "${editingScript.title}" with formatting at ${timestamp}`
        );
      } else {
        alert("Nothing to auto-save - script is empty!");
      }
    } else {
      alert("No script selected for auto-save!");
    }
  };

  // Cursor position management
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    const editorElement = editorRef.current;

    if (selection && selection.rangeCount > 0 && editorElement) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorElement);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const start = preCaretRange.toString().length;

      const endRange = range.cloneRange();
      endRange.selectNodeContents(editorElement);
      endRange.setEnd(range.endContainer, range.endOffset);
      const end = endRange.toString().length;

      cursorPositionRef.current = { start, end };
    }
  };

  const restoreCursorPosition = () => {
    if (!cursorPositionRef.current || !editorRef.current) return;

    const { start, end } = cursorPositionRef.current;
    const editorElement = editorRef.current;

    try {
      const walker = document.createTreeWalker(
        editorElement,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentPos = 0;
      let startNode: Node | null = null;
      let endNode: Node | null = null;
      let startOffset = 0;
      let endOffset = 0;

      let node = walker.nextNode();
      while (node) {
        const textLength = node.textContent?.length || 0;

        if (!startNode && currentPos + textLength >= start) {
          startNode = node;
          startOffset = start - currentPos;
        }

        if (!endNode && currentPos + textLength >= end) {
          endNode = node;
          endOffset = end - currentPos;
          break;
        }

        currentPos += textLength;
        node = walker.nextNode();
      }

      if (startNode && endNode) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(
          startNode,
          Math.min(startOffset, startNode.textContent?.length || 0)
        );
        range.setEnd(
          endNode,
          Math.min(endOffset, endNode.textContent?.length || 0)
        );

        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    } catch (error) {
      console.log("Could not restore cursor position:", error);
    }
  };

  // Script Management Functions
  const handleEditScript = (script: any) => {
    setEditingScript(script);

    // Check for auto-saved content first, then backup, then original content
    const autoSavedContent = localStorage.getItem(`script_${script.id}`);
    const backupContent = localStorage.getItem(`script_${script.id}_backup`);
    let content = autoSavedContent || backupContent || script.content;

    // Preserve content exactly as saved - no processing to maintain formatting
    // Only convert plain text line breaks if the content has NO HTML tags at all
    if (
      typeof content === "string" &&
      !content.includes("<") &&
      !content.includes(">") &&
      content.includes("\n")
    ) {
      content = content.replace(/\n/g, "<br>");
    }

    // Ensure content is a string
    if (!content || typeof content !== "string") {
      content = "";
    }

    setScriptContent(content);
    setEditorFontSize(16); // Reset font size

    // Show notification and debug info
    console.log("handleEditScript - Loading content for:", script.title);
    console.log("Content sources:", {
      autoSaved: !!autoSavedContent,
      backup: !!backupContent,
      original: !!script.content,
      finalContent:
        content?.substring(0, 100) + (content?.length > 100 ? "..." : ""),
    });

    if (autoSavedContent) {
      console.log("Loading auto-saved content for script:", script.title);
    } else if (backupContent) {
      console.log("Loading backup content for script:", script.title);
    }

    // Open new Script Editor with script content
    const cleanContent = script.content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<p>/gi, "")
      .replace(/<[^>]*>/g, "");
    if (onScriptUploaded) {
      onScriptUploaded(cleanContent, `${script.title}.txt`);
    }
  };

  const handleViewScript = (script: any) => {
    setViewingScript(script);
    setShowScriptViewerDialog(true);
  };

  const handleDownloadScript = (script: any) => {
    // Create a clean text version of the script content
    const cleanContent = script.content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<p>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    // Create the full script with header
    const scriptText = `${script.title}\n${"-".repeat(
      script.title.length
    )}\n\nStyle: ${script.type}\nCreated: ${script.createdDate || script.lastModified
      }\n\n${cleanContent}`;

    // Create a blob and download
    const blob = new Blob([scriptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Downloaded script:", script.title);
  };

  const handleRecordPayment = async () => {
    try {
      const amount = parseFloat(newPayment.amount);

      if (!amount || amount <= 0) {
        alert("Please enter a valid payment amount");
        return;
      }

      if (amount > paymentInfo.balance) {
        alert(
          `Payment amount (${amount}) cannot exceed balance due (${paymentInfo.balance})`
        );
        return;
      }
      const activeCouple = allCouples?.[activeCoupleIndex];
      if (!activeCouple) {
        alert(
          "❌ No active couple selected. Please select a couple before recording payment."
        );
        return;
      }

      // 🧾 Build payment record
      const payment = {
        couple_id: activeCouple?.id, // make sure activeCouple is defined
        user_id: user?.id,
        invoice_number: `INV-${Date.now()}`,
        amount: amount,
        status: amount === paymentInfo.balance ? "paid" : "pending",
        due_date: null,
        paid_date: new Date().toISOString(),
        payment_method: newPayment.method,
        notes: newPayment.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("📝 Recording payment:", payment);

      // ✅ Insert payment into Supabase
      const { data, error } = await supabase
        .from("payments")
        .insert(payment)
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to save payment:", error);
        alert(
          "❌ Failed to save payment. Check Supabase permissions or table schema."
        );
        return;
      }

      console.log("✅ Supabase response:", data);

      // ✅ Update local state
      const paymentRecord = {
        id: paymentHistory.length + 1,
        date: new Date(payment.paid_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        amount: amount,
        type:
          amount === paymentInfo.balance ? "Final Payment" : "Partial Payment",
        method: newPayment.method,
        status: "completed",
        notes: newPayment.notes,
      };

      const newDepositPaid = paymentInfo.depositPaid + amount;
      const newBalance = paymentInfo.balance - amount;
      let finalUpdatedHistory: any[] = [];

      setAllCouples((prevCouples) => {
        const newCouples = [...prevCouples];
        const currentCouple = newCouples[activeCoupleIndex];
        if (currentCouple) {
          let updatedHistory = currentCouple.paymentHistory || [];

          if (newBalance === 0) {
            updatedHistory = updatedHistory.map((p) =>
              p.status === "pending"
                ? {
                  ...p,
                  status: "completed",
                  date: paymentRecord.date,
                  method: paymentRecord.method,
                }
                : p
            );
          } else {
            const pendingIndex = updatedHistory.findIndex(
              (p) => p.status === "pending" && p.amount === amount
            );

            if (pendingIndex !== -1) {
              updatedHistory = updatedHistory.map((p, idx) =>
                idx === pendingIndex
                  ? {
                    ...p,
                    status: "completed",
                    date: paymentRecord.date,
                    method: paymentRecord.method,
                  }
                  : p
              );
            } else {
              updatedHistory = [...updatedHistory, paymentRecord];
            }
          }

          currentCouple.paymentHistory = updatedHistory;
          finalUpdatedHistory = updatedHistory;

          currentCouple.paymentInfo = {
            ...currentCouple.paymentInfo,
            depositPaid: newDepositPaid,
            balance: newBalance,
            paymentStatus:
              newBalance === 0
                ? "paid_in_full"
                : currentCouple.paymentInfo.paymentStatus,
          };
        }
        return newCouples;
      });

      setPaymentHistory(finalUpdatedHistory);

      // Reset form
      setNewPayment({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        method: "Credit Card",
        notes: "",
      });
      setShowRecordPaymentDialog(false);

      // ✅ Success message
      if (newBalance === 0) {
        alert(
          "✅ Payment recorded successfully! Ceremony is now PAID IN FULL! 🎉"
        );
      } else {
        alert(
          `✅ Payment of ${amount} recorded successfully!\n\nRemaining balance: ${newBalance}`
        );
      }
    } catch (err) {
      console.error("❌ Payment submission error:", err);
      alert("❌ Something went wrong while saving payment.");
    }
  };

  // COMMENTED OUT - Upload Script functionality removed temporarily
  // const handleUploadScript = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0]
  //   if (!file) return
  //   ... functionality preserved for potential future use
  // }

  const handleCreateNewScript = () => {
    // Create a new script object with placeholder data
    const newScript = {
      id: Date.now(), // Simple ID generation
      title: `New Script Draft ${new Date().toLocaleDateString()}`,
      content: "", // Start with empty content
      lastModified: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      status: "Draft",
      type: "Traditional",
      estimatedTime: "15-20 min",
    };

    // Set this as the editing script
    setEditingScript(newScript);
    setScriptContent(""); // Start with empty content
    setEditorFontSize(16);

    console.log("Creating new script:", newScript.title);

    // Open the script editor dialog
    setShowScriptEditorDialog(true);
  };

  const handleShareScript = (script: any) => {
    setSharingScript(script);
    // Pre-select the script that was clicked
    setSelectedItemsToShare({
      scripts: [script.id],
      files: [],
    });
    setShareScriptForm({
      to: "both",
      customEmail: "",
      subject: `Wedding Script: ${script.title}`,
      body: `Dear ${(editCoupleInfo.brideName || "").split(" ")[0]} and ${(editCoupleInfo.groomName || "").split(" ")[0]
        },

I've prepared your ceremony script "${script.title
        }" for your review. Please take a look and let me know if you have any questions or would like any changes.

This script has been personalized for your wedding on ${new Date(
          editWeddingDetails.weddingDate
        ).toLocaleDateString()} at ${editWeddingDetails.venueName}.

Looking forward to your feedback!

Best regards,
Pastor Michael Adams`,
      includeNotes: true,
    });
    setShowShareScriptDialog(true);
  };

  const handleSaveScript = () => {
    if (editingScript) {
      // Check if this is a new script or existing script (before any updates)
      const isNewScript = !coupleScripts.find(
        (script) => script.id === editingScript.id
      );

      // Get the current content from the editor element to ensure we have the latest formatted content
      const editorElement =
        editorRef.current ||
        (document.getElementById("script-editor") as HTMLDivElement);
      let currentContent = scriptContent;

      console.log("Save Script Debug:", {
        isNewScript,
        editingScriptId: editingScript.id,
        existingScripts: coupleScripts.map((s) => s.id),
        editorFound: !!editorElement,
      });

      if (editorElement) {
        currentContent = editorElement.innerHTML;
        console.log("Content from editor element:", {
          length: currentContent.length,
          preview: currentContent.substring(0, 100) + "...",
          isEmpty: currentContent.trim() === "",
        });
        setScriptContent(currentContent); // Update state with current editor content
      } else {
        console.error("Editor element not found during save!");
      }

      // Keep HTML formatting when saving to preserve bold, italic, colors, etc.
      const plainTextContent = currentContent
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();

      console.log("Save validation:", {
        htmlLength: currentContent.length,
        plainTextLength: plainTextContent.length,
        preview: plainTextContent.substring(0, 50) + "...",
      });

      // Character validation
      const MIN_CHARACTERS = 50;
      const MAX_CHARACTERS = 7000;

      if (plainTextContent.length < MIN_CHARACTERS) {
        alert(
          `❌ Script must be at least ${MIN_CHARACTERS} characters long.\n\nCurrent length: ${plainTextContent.length} characters\nPlease add more content before saving.`
        );
        return;
      }

      if (plainTextContent.length > MAX_CHARACTERS) {
        alert(
          `❌ Script cannot exceed ${MAX_CHARACTERS} characters.\n\nCurrent length: ${plainTextContent.length} characters\nPlease reduce the content before saving.`
        );
        return;
      }

      // In a real app, this would save to the backend
      console.log("Saving script with preserved formatting:", {
        id: editingScript.id,
        title: editingScript.title,
        content: currentContent,
        lastModified: new Date().toLocaleDateString(),
      });

      // Get the current date for last modified
      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      // Check if this is a new script or existing script
      const existingScript = coupleScripts.find(
        (script) => script.id === editingScript.id
      );

      if (existingScript) {
        // Update existing script
        setCoupleScripts((prevScripts) =>
          prevScripts.map((script) =>
            script.id === editingScript.id
              ? {
                ...script,
                content: currentContent, // Save with exact HTML formatting preserved
                lastModified: currentDate,
                status: "Latest Draft", // Update status when saved
              }
              : script
          )
        );
        console.log("Updated existing script:", editingScript.title);
      } else {
        // Add new script to the array
        const newScript = {
          ...editingScript,
          content: currentContent,
          lastModified: currentDate,
          status: "Latest Draft",
        };

        setCoupleScripts((prevScripts) => [newScript, ...prevScripts]);
        console.log("Added new script:", editingScript.title);
      }

      // Also save to localStorage as backup with exact content
      localStorage.setItem(`script_${editingScript.id}_backup`, currentContent);
      localStorage.setItem(
        `script_${editingScript.id}_saved_date`,
        currentDate
      );

      // Clear auto-saved content since we've saved it properly
      localStorage.removeItem(`script_${editingScript.id}`);

      console.log("Script saved successfully with formatting preserved:", {
        id: editingScript.id,
        title: editingScript.title,
        contentLength: plainTextContent.length,
        lastModified: currentDate,
        htmlPreview: currentContent.substring(0, 100) + "...",
      });

      const actionText = isNewScript ? "created" : "saved";
      alert(
        `✅ Script "${editingScript.title}" ${actionText} successfully!\n\nSaved on: ${currentDate}\nContent: ${plainTextContent.length} characters\nFormatting preserved!`
      );
      setShowScriptEditorDialog(false);
      setEditingScript(null);
      setScriptContent("");
      setEditorFontSize(16);
    }
  };
  const fetchCoupleScripts = async () => {
    if (!currentCoupleId) return; // ensure couple is selected
    console.log(currentCoupleId);
    setLoadingCoupleScripts(true);
    try {
      const { data, error } = await supabase
        .from("user_files") // or "scripts" if that’s your actual table
        .select("*")
        .eq("couple_id", currentCoupleId)
        .order("created_at", { ascending: false });

      if (error) {
        return;
      }

      const mapped = data.map((s) => ({
        id: s.id,
        title: s.name || "Untitled Script",
        author: s.user_id,
        type: s.type || "document",
        size: s.size ? `${(s.size / 1024).toFixed(1)} KB` : "0 KB",
        url: s.url,
        published: s.published || false,
        created_at: s.created_at
          ? new Date(s.created_at).toLocaleString()
          : "Unknown date",
      }));

      setCoupleScripts(mapped);
    } catch (err) {
      console.error("⚠️ Unexpected error fetching couple scripts:", err);
    } finally {
      setLoadingCoupleScripts(false);
    }
  };

  // ✅ Fetch when couple changes
  useEffect(() => {
    fetchCoupleScripts();
  }, [currentCoupleId]);

  const handleDeleteCoupleScript = async (scriptId: number) => {
    if (!confirm("Delete this couple’s script?")) return;

    try {
      const { error } = await supabase
        .from("user_files")
        .delete()
        .eq("id", scriptId)
        .eq("couple_id", currentCoupleId);

      if (error) throw error;

      setCoupleScripts((prev) => prev.filter((s) => s.id !== scriptId));
      alert("✅ Script deleted successfully.");
    } catch (err) {
      console.error("❌ Error deleting couple script:", err);
    }
  };

  const handleSendScript = () => {
    // Validate that at least one item is selected
    if (
      selectedItemsToShare.scripts.length === 0 &&
      selectedItemsToShare.files.length === 0
    ) {
      alert("Please select at least one script or file to share.");
      return;
    }

    const recipient =
      shareScriptForm.to === "both"
        ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
        : shareScriptForm.to === "bride"
          ? editCoupleInfo.brideEmail
          : shareScriptForm.to === "groom"
            ? editCoupleInfo.groomEmail
            : shareScriptForm.customEmail;

    if (!recipient.trim()) {
      alert("Please select a recipient or enter an email address.");
      return;
    }

    if (!shareScriptForm.subject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    if (!shareScriptForm.body.trim()) {
      alert("Please enter a message body.");
      return;
    }

    // Collect all selected scripts (both saved and generated)
    const allScripts = [...coupleScripts, ...generatedScripts];
    const selectedScripts = allScripts.filter((script) =>
      selectedItemsToShare.scripts.includes(script.id)
    );

    // Collect selected files
    const selectedFiles = files.filter((file) =>
      selectedItemsToShare.files.includes(file.id)
    );

    // Create attachments for scripts
    const scriptAttachments: UploadedFile[] = selectedScripts.map((script) => ({
      id: `script_${script.id}_${Date.now()}`,
      file: new File([script.content], `${script.title}.txt`, {
        type: "text/plain",
      }),
      name: `${script.title}.txt`,
      size: script.content.length,
      type: "text/plain",
      url: "#",
      uploadProgress: 100,
      status: "completed" as const,
    }));

    // Convert selected files to UploadedFile format
    const fileAttachments: UploadedFile[] = selectedFiles.map((file) => ({
      id: `file_${file.id}_${Date.now()}`,
      file: new File([], file.name, { type: file.type }),
      name: file.name,
      size: 0, // Will be displayed as file.size string
      type: file.type,
      url: file.url || "#",
      uploadProgress: 100,
      status: "completed" as const,
    }));

    // Combine script attachments with selected files
    const allAttachments = [...scriptAttachments, ...fileAttachments];

    // Build message details
    const scriptsList = selectedScripts
      .map((s) => `• ${s.title} (${s.type})`)
      .join("\n");
    const filesList = selectedFiles
      .map((f) => `• ${f.name} (${f.size})`)
      .join("\n");

    let itemsDescription = "";
    if (selectedScripts.length > 0) {
      itemsDescription += `📜 Scripts (${selectedScripts.length}):\n${scriptsList}\n\n`;
    }
    if (selectedFiles.length > 0) {
      itemsDescription += `📎 Files (${selectedFiles.length}):\n${filesList}\n\n`;
    }

    // Add to messaging platform
    setMessageAttachments(allAttachments);
    setNewMessage(`📦 Wedding Documents Shared
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👰🤵 For: ${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}
📧 Sent to: ${recipient}

${itemsDescription}
${shareScriptForm.body}`);
    setShowAttachments(true);

    // Auto-send the message
    setTimeout(() => {
      handleSendMessage();
    }, 100);

    // Close dialog and reset form
    setShowShareScriptDialog(false);
    setSharingScript(null);
    setSelectedItemsToShare({ scripts: [], files: [] });
    setShareScriptForm({
      to: "both",
      customEmail: "",
      subject: "",
      body: "",
      includeNotes: true,
    });

    const totalItems = selectedScripts.length + selectedFiles.length;
    console.log(`Shared ${totalItems} item(s) to: ${recipient}`);
    alert(`Successfully shared ${totalItems} item(s) with ${recipient}!`);
  };

  const handleContractAction = async (contractId: number, action: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    switch (action) {
      case "view":
        if (contract.file_url) window.open(contract.file_url, "_blank");
        break;

      case "delete":
        if (!confirm("Are you sure you want to delete this contract?")) return;
        const { error } = await supabase
          .from("contracts")
          .delete()
          .eq("id", contractId);
        console.log(contractId);

        if (error) {
          console.error("❌ Error deleting contract:", error);
          alert("Failed to delete contract");
        } else {
          setContracts((prev) => prev.filter((c) => c.id !== contractId));
        }
        break;

      case "send":
        alert(`📤 Sending contract "${contract.name}"...`);
        break;
    }
  };

  const fetchContracts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching contracts:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.log("📄 No contracts found for this user");
        setContracts([]);
        return;
      }

      const mapped: Contract[] = data.map((c) => ({
        ...c,
        signedBy: "Client Name", // you can dynamically assign
        signedDate: c.updated_at
          ? new Date(c.updated_at).toLocaleDateString()
          : "",
        sentDate: c.created_at
          ? new Date(c.created_at).toLocaleDateString()
          : "",
        createdDate: c.created_at
          ? new Date(c.created_at).toLocaleDateString()
          : "",
      }));

      setContracts(mapped);
    } catch (err) {
      console.error("⚠️ Unexpected error fetching contracts:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Handle sending contract email
  const handleSendContractEmail = () => {
    if (!sendingContract) return;

    const recipient = emailForm.to || emailForm.customEmail;
    if (!recipient.trim()) {
      alert("Please select a recipient or enter an email address.");
      return;
    }

    if (!emailForm.subject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    if (!emailForm.body.trim()) {
      alert("Please enter a message body.");
      return;
    }

    // Create contract attachment for messaging
    const contractAttachment: UploadedFile = {
      id: `contract_${sendingContract.id}_${Date.now()}`,
      file: new File(["contract content"], sendingContract.name + ".pdf", {
        type: "application/pdf",
      }),
      name: sendingContract.name + ".pdf",
      size: 2048576, // 2MB simulated size
      type: "application/pdf",
      url: "#",
      uploadProgress: 100,
      status: "completed",
    };
    useEffect(() => {
      const fetchMessages = async () => {
        if (!user || !currentCoupleId) return;

        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("couple_id", currentCoupleId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("❌ Error fetching messages:", error);
        } else {
          setAiChatMessages(data || []);
        }
      };

      fetchMessages();
    }, [user, currentCoupleId]);
    // Add to messaging platform
    setMessageAttachments([contractAttachment]);
    setNewMessage(
      `📧 Email sent to: ${recipient}\n📄 Subject: ${emailForm.subject}\n\n${emailForm.body}`
    );
    setShowAttachments(true);

    // Auto-send the message
    setTimeout(() => {
      handleSendMessage();
      // Update contract status to sent
      setContracts((prev) =>
        prev.map((c) =>
          c.id === sendingContract.id
            ? ({
              ...c,
              status: "pending",
              sentDate: new Date().toLocaleDateString(),
            } as any)
            : c
        )
      );
    }, 100);

    // Close dialog and reset form
    setShowSendContractDialog(false);
    setSendingContract(null);
    setEmailForm({
      to: "",
      customEmail: "",
      subject: "",
      body: "",
    });

    console.log(`Contract "${sendingContract.name}" sent to: ${recipient}`);
    alert(
      `Contract "${sendingContract.name}" has been sent successfully to ${recipient}!`
    );
  };

  // Handle opening payment reminder dialog
  // Handle welcome dialog - direct user to profile setup
  const handleWelcomeComplete = () => {
    // Mark as visited so welcome dialog doesn't show again
    localStorage.setItem("hasVisitedOrdainedPro", "true");
    setHasSeenWelcome(true);
    setShowWelcomeDialog(false);

    // Set initial view to profile and open the Officiant Dashboard dialog
    setDashboardInitialView("profile");
    setShowDashboardDialog(true);
  };

  const handleOpenPaymentReminderDialog = () => {
    setPaymentReminderForm({
      to: "both", // Default to both couple members
      customEmail: "",
      subject: "Payment Reminder - Wedding Ceremony Services",
      body: `Dear ${(editCoupleInfo.brideName || "").split(" ")[0]} and ${(editCoupleInfo.groomName || "").split(" ")[0]
        },

I hope this message finds you well and that your wedding planning is going smoothly!

This is a friendly reminder regarding your upcoming payment for our wedding ceremony services.

Payment Details:
• Total Amount: $${paymentInfo.totalAmount}
• Deposit Paid: $${paymentInfo.depositPaid}
• Balance Due: $${paymentInfo.balance}
• Due Date: ${paymentInfo.finalPaymentDue}

Please ensure your final payment is submitted by the due date to confirm all arrangements for your special day.

If you have any questions about the payment or need to discuss payment options, please don't hesitate to reach out to me directly.

Looking forward to officiating your beautiful ceremony!

Warm regards,
Pastor Michael Adams
Licensed Officiant
(555) 987-6543
pastor.michael@ordainedpro.com`,
    });
    setShowSendPaymentReminderDialog(true);
  };

  // Handle sending payment reminder email
  const handleSendPaymentReminderEmail = async () => {
    const recipient =
      paymentReminderForm.to === "both"
        ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
        : paymentReminderForm.to || paymentReminderForm.customEmail;

    if (!recipient.trim()) {
      alert("Please select a recipient or enter an email address.");
      return;
    }

    if (!paymentReminderForm.subject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    if (!paymentReminderForm.body.trim()) {
      alert("Please enter a message body.");
      return;
    }

    // Add to messaging platform
    setNewMessage(
      `💰 Payment Reminder sent to: ${recipient}\n📄 Subject: ${paymentReminderForm.subject}\n\n${paymentReminderForm.body}`
    );

    // Auto-send the message
    setTimeout(() => {
      handleSendMessage();
    }, 100);


    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      console.log("📤 Sending share script request to API:", apiUrl)
      const res = await fetch(`${apiUrl}/api/email/send-payment-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          subject: paymentReminderForm.subject,
          body: paymentReminderForm.body,
          coupleId: editCoupleInfo.id,
        }),
      });

      const data = await res.json();
      console.log("Payment reminder email response:", data);
      if (data.success) {
        alert(`✅ Payment reminder sent to ${recipient}!`);
      } else {
        alert(`❌ Failed to send email: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error sending payment reminder email.");
    }



    // Close dialog and reset form
    setShowSendPaymentReminderDialog(false);
    setPaymentReminderForm({
      to: "",
      customEmail: "",
      subject: "",
      body: "",
    });


    console.log(`Payment reminder sent to: ${recipient}`);
    alert(`Payment reminder has been sent successfully to ${recipient}!`);
  };

  const handleContractUploaded = (
    contractData: Omit<ContractUploadType, "id" | "createdDate">
  ) => {
    // Create new contract with unique ID and creation date
    const newContract = {
      ...contractData,
      id: Math.max(...contracts.map((c) => c.id), 0) + 1,
      createdDate: new Date().toLocaleDateString(),
      status: contractData.status || "draft",
    };

    // Add contract to the list immediately - appears in real time
    setContracts((prev) => [...prev, newContract as any]);

    console.log("New contract uploaded:", newContract);

    // Show success message
    setTimeout(() => {
      alert(
        `Contract "${contractData.name}" uploaded successfully and is now available in Contract Management!`
      );
    }, 100);
  };

  // Get payment info and history from active couple
  const paymentInfo = allCouples[activeCoupleIndex]?.paymentInfo || {
    totalAmount: 800,
    depositPaid: 300,
    balance: 500,
    depositDate: "July 15, 2024",
    finalPaymentDue: "August 18, 2024",
    paymentStatus: "deposit_paid",
  };

  const [paymentHistory, setPaymentHistory] = useState(
    allCouples[activeCoupleIndex]?.paymentHistory || [
      {
        id: 1,
        date: "July 15, 2024",
        amount: 300,
        type: "Deposit",
        method: "Credit Card",
        status: "completed",
      },
      {
        id: 2,
        date: "August 18, 2024",
        amount: 500,
        type: "Final Payment",
        method: "Pending",
        status: "pending",
      },
    ]
  );

  // Sync paymentHistory with active couple when switching
  useEffect(() => {
    if (allCouples[activeCoupleIndex]?.paymentHistory) {
      setPaymentHistory(allCouples[activeCoupleIndex].paymentHistory);
    }
  }, [activeCoupleIndex]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) console.error("Failed to fetch user:", error);
      else setUser(user);
      console.log("Fetched user:", user);
    };
    fetchUser();
  }, []);

  // Helper to update paymentInfo for the active couple
  const setPaymentInfo = (updater: any) => {
    setAllCouples((prevCouples) => {
      const newCouples = [...prevCouples];
      const currentCouple = newCouples[activeCoupleIndex];
      if (currentCouple) {
        currentCouple.paymentInfo =
          typeof updater === "function"
            ? updater(currentCouple.paymentInfo)
            : updater;
      }
      return newCouples;
    });
  };

  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
  const [showPendingPaymentsDialog, setShowPendingPaymentsDialog] =
    useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [dashboardInitialView, setDashboardInitialView] = useState<
    | "dashboard"
    | "ceremonies"
    | "profile"
    | "calendar"
    | "documents"
    | "settings"
  >("dashboard");
  const [newPayment, setNewPayment] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    method: "Credit Card",
    notes: "",
  });
  // const [uploadingScript, setUploadingScript] = useState(false) // Temporarily disabled

  // Script pricing state
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [selectedScriptForPricing, setSelectedScriptForPricing] =
    useState<any>(null);
  const [scriptPriceForm, setScriptPriceForm] = useState({
    price: "",
  });

  // Script publishing state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedScriptForPublish, setSelectedScriptForPublish] =
    useState<any>(null);

  // Sarah & David's Script Drafts State
  const [coupleScripts, setCoupleScripts] = useState<any[]>([]);
  const [loadingCoupleScripts, setLoadingCoupleScripts] = useState(false);

  const [myScripts, setMyScripts] = useState<any[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);

  // Handler to open library script in editor
  const handleEditLibraryScript = (script: any) => {
    setSelectedLibraryScript(script);
    setShowLibraryScriptEditor(true);
  };

  // Handler to open pricing dialog for a script
  const handleSetScriptPrice = async (script) => {
    const price = prompt("Enter price for this script:", script.price || 0);
    if (price === null) return;

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      alert("Invalid price value");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_files")
        .update({ price: parsedPrice })
        .eq("id", script.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setMyScripts((prev) =>
        prev.map((s) => (s.id === script.id ? { ...s, price: parsedPrice } : s))
      );

      alert("✅ Price updated!");
    } catch (err) {
      console.error("❌ Error updating script price:", err);
    }
  };

  // Handler to save script price
  const handleSaveScriptPrice = () => {
    if (!selectedScriptForPricing) return;

    const newPrice = parseFloat(scriptPriceForm.price);
    if (isNaN(newPrice) || newPrice < 0) {
      alert("Please enter a valid price (minimum $0)");
      return;
    }

    // Update the script price in state
    setMyScripts((prevScripts) =>
      prevScripts.map((script) =>
        script.id === selectedScriptForPricing.id
          ? { ...script, price: newPrice }
          : script
      )
    );

    // Close dialog and reset form
    setShowPricingDialog(false);
    setSelectedScriptForPricing(null);
    setScriptPriceForm({ price: "" });

    alert(
      `Price for "${selectedScriptForPricing.title}" has been updated to ${newPrice}`
    );
  };
  const fetchMyScripts = async () => {
    if (!user?.id) return;

    setLoadingScripts(true);
    try {
      const { data, error } = await supabase
        .from("user_files") // or "scripts" if you separated scripts
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching scripts:", error);
        return;
      }

      // 🗂️ Map for display
      const mappedScripts = data.map((s) => ({
        id: s.id,
        title: s.name || "Untitled Script",
        price: s.price || 0,
        earnings: s.earnings || 0,
        rating: s.rating || 0,
        sales: s.sales || 0,
        published: s.published || false,
        status: s.status || "draft",
        url: s.url,
        created_at: s.created_at,
      }));

      setMyScripts(mappedScripts);
    } catch (err) {
      console.error("⚠️ Unexpected error fetching scripts:", err);
    } finally {
      setLoadingScripts(false);
    }
  };

  // Fetch when user logs in
  useEffect(() => {
    fetchMyScripts();
  }, [user]);

  const handleDeleteScript = async (script) => {
    const confirmDelete = confirm(`Delete "${script.title}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("user_files")
        .delete()
        .eq("id", script.id)
        .eq("user_id", user.id); // ✅ ensure ownership

      if (error) {
        console.error("❌ Error deleting script:", error);
        alert("Failed to delete script.");
        return;
      }

      // Remove locally
      setMyScripts((prev) => prev.filter((s) => s.id !== script.id));
      alert("✅ Script deleted successfully.");
    } catch (err) {
      console.error("⚠️ Unexpected error deleting script:", err);
    }
  };

  // Handler to open publish dialog
  const handlePublishScript = async (script) => {
    try {
      const { error } = await supabase
        .from("user_files")
        .update({ published: true })
        .eq("id", script.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setMyScripts((prev) =>
        prev.map((s) => (s.id === script.id ? { ...s, published: true } : s))
      );
    } catch (err) {
      console.error("❌ Error publishing script:", err);
    }
  };

  const handleUnpublishScript = async (script) => {
    try {
      const { error } = await supabase
        .from("user_files")
        .update({ published: false })
        .eq("id", script.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setMyScripts((prev) =>
        prev.map((s) => (s.id === script.id ? { ...s, published: false } : s))
      );
    } catch (err) {
      console.error("❌ Error unpublishing script:", err);
    }
  };

  // Handler to confirm publishing script
  const handleConfirmPublish = () => {
    if (!selectedScriptForPublish) return;

    // Check if script has a price set
    if (
      !selectedScriptForPublish.price ||
      selectedScriptForPublish.price <= 0
    ) {
      alert(
        "Please set a price for this script before publishing to the marketplace."
      );
      setShowPublishDialog(false);
      setSelectedScriptForPublish(null);
      // Open pricing dialog instead
      handleSetScriptPrice(selectedScriptForPublish);
      return;
    }

    // Update the script to mark as published
    setMyScripts((prevScripts) =>
      prevScripts.map((script) =>
        script.id === selectedScriptForPublish.id
          ? { ...script, published: true }
          : script
      )
    );

    // Close dialog and reset
    setShowPublishDialog(false);
    setSelectedScriptForPublish(null);

    alert(
      `"${selectedScriptForPublish.title}" has been published to the marketplace!\n\nOther officiants can now purchase this script for ${selectedScriptForPublish.price}.`
    );
  };

  const popularScripts = [
    {
      id: 1,
      title: "Beach Wedding Ceremony",
      author: "Rev. Sarah M.",
      price: 22,
      rating: 4.9,
      sales: 156,
    },
    {
      id: 2,
      title: "Garden Party Wedding",
      author: "Pastor John D.",
      price: 18,
      rating: 4.8,
      sales: 134,
    },
    {
      id: 3,
      title: "Rustic Barn Wedding",
      author: "Minister Lisa K.",
      price: 24,
      rating: 4.7,
      sales: 98,
    },
  ];

  const handleAddCeremony = async () => {
    if (
      !newCeremony.ceremonyName ||
      !newCeremony.brideName ||
      !newCeremony.groomName
    ) {
      alert("Please fill in Ceremony Name, Bride Name, and Groom Name");
      return;
    }

    if (!user?.id) {
      alert("⚠️ Please sign in to save ceremony.");
      return;
    }

    console.log("Saving ceremony to Supabase:", newCeremony);
    console.log("Saving  user:", user);

    setSaving(true);

    try {
      // 2️⃣ Prepare couple data
      const coupleData = {
        user_id: user.id,
        bride_name: newCeremony.brideName,
        bride_email: newCeremony.brideEmail || null,
        bride_phone: newCeremony.bridePhone || null,
        bride_address: newCeremony.brideAddress || null,
        groom_name: newCeremony.groomName,
        groom_email: newCeremony.groomEmail || null,
        groom_phone: newCeremony.groomPhone || null,
        groom_address: newCeremony.groomAddress || null,
        address: "",
        emergency_contact: "",
        special_requests: newCeremony.notes || null,
        is_active: true,
        colors: JSON.stringify(getCoupleColors(allCouples.length + 1)), // store JSON as string
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 3️⃣ Insert into couples table
      const { data: coupleInsert, error: coupleError } = await supabase
        .from("couples")
        .insert(coupleData)
        .select()
        .single();

      if (coupleError) throw coupleError;
      console.log("✅ Couple saved in Supabase:", coupleInsert);

      // 4️⃣ Prepare ceremony data
      const ceremonyData = {
        couple_id: coupleInsert.id, // link ceremony to newly created couple
        user_id: user.id,
        venue_name: newCeremony.venueName || null,
        venue_address: newCeremony.venueAddress || null,
        wedding_date: newCeremony.ceremonyDate || null,
        start_time: newCeremony.ceremonyTime || null,
        end_time: null, // leave null if unknown
        expected_guests: newCeremony.expectedGuests || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 5️⃣ Insert into ceremonies table
      const { data: ceremonyInsert, error: ceremonyError } = await supabase
        .from("ceremonies")
        .insert(ceremonyData)
        .select()
        .single();

      if (ceremonyError) throw ceremonyError;
      console.log("✅ Ceremony saved in Supabase:", ceremonyInsert);

      // 6️⃣ Update local state for UI
      setAllCouples((prev) => [...prev, coupleInsert]);
      setSavedCeremonies((prev) => [...prev, ceremonyInsert]);
      setActiveCoupleIndex(allCouples.length); // set newly added couple as active
      setNewCeremony({
        ceremonyName: "",
        ceremonyDate: "",
        ceremonyTime: "",
        venueName: "",
        venueAddress: "",
        expectedGuests: "",
        brideName: "",
        brideEmail: "",
        bridePhone: "",
        brideAddress: "",
        groomName: "",
        groomEmail: "",
        groomPhone: "",
        groomAddress: "",
        totalAmount: "",
        depositAmount: "",
        finalPaymentDate: "",
        notes: "",
      });
      setShowAddCeremonyDialog(false);

      alert(
        `Ceremony "${newCeremony.ceremonyName}" for ${newCeremony.brideName} & ${newCeremony.groomName} has been saved successfully!`
      );
    } catch (err) {
      console.error("❌ Error saving ceremony or couple:", err);
      alert("⚠️ Failed to save ceremony. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCoupleInfo = () => {
    // Update the couple info in allCouples array
    const updatedCouples = [...allCouples];
    updatedCouples[activeCoupleIndex] = {
      ...updatedCouples[activeCoupleIndex],
      ...editCoupleInfo,
    };
    setAllCouples(updatedCouples);

    console.log("Updating couple info:", editCoupleInfo);
    setShowEditCoupleDialog(false);

    // Show success message
    alert("Couple information updated successfully!");
  };

  const handleOpenEditWeddingDialog = () => {
    // Load saved data for current couple when opening the form
    const coupleId = `${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}`;
    if (savedWeddingDetails[coupleId]) {
      setEditWeddingDetails(savedWeddingDetails[coupleId]);
      console.log(
        "Loading saved wedding details for:",
        coupleId,
        savedWeddingDetails[coupleId]
      );
    }
    setShowEditWeddingDialog(true);
  };

  const handleEditWeddingDetails = () => {
    const coupleId = `${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}`;

    // Save the updated wedding details for the current couple
    setSavedWeddingDetails((prev) => ({
      ...prev,
      [coupleId]: { ...editWeddingDetails },
    }));

    // Update the wedding details in allCouples array
    const updatedCouples = [...allCouples];
    updatedCouples[activeCoupleIndex].weddingDetails = {
      ...editWeddingDetails,
    };
    setAllCouples(updatedCouples);

    console.log("Saving wedding details for:", coupleId, editWeddingDetails);
    setShowEditWeddingDialog(false);

    // Show success message
    alert(`Wedding details for ${coupleId} saved successfully!`);
  };

  const handleSwitchCouple = (index: number) => {
    // Save current couple's data before switching
    const updatedCouples = [...allCouples];
    updatedCouples[activeCoupleIndex] = {
      ...updatedCouples[activeCoupleIndex],
      ...editCoupleInfo,
      weddingDetails: { ...editWeddingDetails },
    };
    setAllCouples(updatedCouples);

    // Switch to the selected couple
    setActiveCoupleIndex(index);
    const selectedCouple = updatedCouples[index];
    setEditCoupleInfo(selectedCouple);
    setEditWeddingDetails(
      selectedCouple.weddingDetails || {
        venueName: "",
        venueAddress: "",
        weddingDate: "",
        startTime: "",
        endTime: "",
        expectedGuests: "",
      }
    );

    setShowSwitchCeremonyDialog(false);
    console.log(
      "Switched to couple:",
      selectedCouple.brideName,
      "&",
      selectedCouple.groomName
    );
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchUserFiles = async () => {
    if (!user?.id) return;

    try {
      // 1️⃣ Fetch metadata from Supabase table
      const { data, error } = await supabase
        .from("user_files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching files:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.log("📂 No files found for user:", user.id);
        setFiles([]);
        return;
      }

      // 2️⃣ Map data to frontend-friendly format
      const mapped = data.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size ? `${(f.size / 1024).toFixed(1)} KB` : "0 KB",
        url: f.url?.includes("supabase")
          ? f.url
          : supabase.storage
            .from("user-documents")
            .getPublicUrl(`${user.id}/${f.name}`).data.publicUrl,
        uploadedBy: user?.name || "You",
        date: f.created_at
          ? new Date(f.created_at).toLocaleString()
          : "Unknown date",
      }));

      // 3️⃣ Update state
      setFiles(mapped);
      console.log("✅ Files loaded:", mapped);
    } catch (err) {
      console.error("⚠️ Unexpected error fetching files:", err);
    }
  };

  // ✅ Run fetch on user load or change
  useEffect(() => {
    if (user?.id) {
      fetchUserFiles();
    }
  }, [user]);

  const handleAddWeddingEvent = async () => {
    if (!addEventForm.subject || !addEventForm.date || !addEventForm.time) {
      alert("⚠️ Please fill in all required fields (Subject, Date, and Time).");
      return;
    }

    try {
      // ✅ Get the current signed-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("⚠️ You must be signed in to add an event.");
        return;
      }

      // 🧾 Prepare new event data
      const newEvent = {
        user_id: user.id,
        couple_id: editCoupleInfo?.id || null, // optional: link to a couple if available
        subject: addEventForm.subject,
        date: addEventForm.date,
        time: addEventForm.time,
        category: addEventForm.category || "other",
        details: addEventForm.details,
      };

      // 💾 Insert into Supabase
      const { data, error } = await supabase
        .from("wedding_events")
        .insert([newEvent])
        .select("*")
        .single();

      if (error) {
        console.error("❌ Supabase insert error:", error);
        alert(
          "❌ Failed to save event. Please check Supabase table permissions or schema."
        );
        return;
      }

      // ✅ Update local UI immediately
      const savedEvent = {
        ...data,
        location: editWeddingDetails?.venueName || "Unknown Venue",
        title: addEventForm.subject,
        type: addEventForm.category,
      };

      setUpcomingEvents([...upcomingEvents, savedEvent]);

      // 🔄 Reset form
      setAddEventForm({
        subject: "",
        date: "",
        time: "",
        category: "rehearsal",
        details: "",
      });
      setShowAddEventDialog(false);

      alert("✅ Wedding event added successfully!");
    } catch (err) {
      console.error("❌ Unexpected error while adding event:", err);
      alert(
        "❌ Something went wrong while adding the event. Check the console for details."
      );
    }
  };
  const fetchWeddingEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("wedding_events")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) {
        console.error("❌ Error fetching wedding events:", error);
        return;
      }

      setUpcomingEvents(data || []);
    } catch (err) {
      console.error("⚠️ Unexpected error fetching events:", err);
    }
  };

  // ⏳ Fetch events when the component mounts
  useEffect(() => {
    fetchWeddingEvents();
  }, []);

  const handleDeleteWeddingEvent = async (eventId: number) => {
    if (!eventId) return;

    const confirmDelete = confirm(
      "Are you sure you want to delete this wedding event?"
    );
    if (!confirmDelete) return;

    // ⚡ Optimistic UI update
    const previousEvents = upcomingEvents;
    setUpcomingEvents((prev) => prev.filter((event) => event.id !== eventId));

    try {
      const { error } = await supabase
        .from("wedding_events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("❌ Error deleting wedding event:", error);
        alert("❌ Failed to delete event. Please try again.");

        // ⏪ Revert change if DB delete fails
        setUpcomingEvents(previousEvents);
        return;
      }

      console.log(`✅ Wedding event ${eventId} deleted successfully.`);
    } catch (err) {
      console.error("⚠️ Unexpected error deleting event:", err);
      alert("⚠️ Unexpected error occurred while deleting the event.");

      // ⏪ Revert in case of failure
      setUpcomingEvents(previousEvents);
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    if (!meetingId) return;

    const confirmDelete = confirm(
      "Are you sure you want to delete this meeting?"
    );
    if (!confirmDelete) return;

    // ⚡ Instant local update (optimistic UI)
    const previousMeetings = meetings;
    setMeetings((prev) => prev.filter((meeting) => meeting.id !== meetingId));

    try {
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", meetingId);

      if (error) {
        console.error("❌ Error deleting meeting:", error);
        alert("Failed to delete meeting. Please try again.");

        // ⏪ Revert if deletion fails
        setMeetings(previousMeetings);
        return;
      }

      console.log(`✅ Meeting ${meetingId} deleted successfully.`);
    } catch (err) {
      console.error("⚠️ Unexpected error deleting meeting:", err);
      alert("Unexpected error occurred. Please try again.");

      // ⏪ Revert in case of any failure
      setMeetings(previousMeetings);
    }
  };

  const handleEditMeeting = (meeting: any) => {
    setEditMeetingForm({
      id: meeting.id,
      subject: meeting.subject,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      meetingType: meeting.meetingType,
      location: meeting.location,
      body: meeting.body || "",
    });
    setShowEditMeetingDialog(true);
  };

  const handleUpdateMeeting = async () => {
    if (!editMeetingForm.id) {
      console.error("❌ No meeting ID provided for update");
      return;
    }

    try {
      // Optimistic local UI update (instant visual feedback)
      setMeetings((prev) =>
        prev.map((meeting) =>
          meeting.id === editMeetingForm.id
            ? {
              ...meeting,
              title: editMeetingForm.subject,
              date: editMeetingForm.date,
              time: editMeetingForm.time,
              duration: editMeetingForm.duration,
              meetingType: editMeetingForm.meetingType as
                | "in-person"
                | "video"
                | "phone",
              location: editMeetingForm.location,
              notes: editMeetingForm.body,
              updated_at: new Date().toISOString(),
            }
            : meeting
        )
      );

      // Save to Supabase
      const { error } = await supabase
        .from("meetings")
        .update({
          title: editMeetingForm.subject,
          date: editMeetingForm.date,
          time: editMeetingForm.time,
          location: editMeetingForm.location,
          notes: editMeetingForm.body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editMeetingForm.id);

      if (error) {
        console.error("❌ Error updating meeting:", error);
        alert("Failed to update meeting. Please try again.");
        return;
      }

      console.log("✅ Meeting updated successfully in Supabase.");

      // Reset and close dialog
      setShowEditMeetingDialog(false);
      setEditMeetingForm({
        id: 0,
        subject: "",
        date: "",
        time: "",
        duration: 60,
        meetingType: "in-person",
        location: "",
        body: "",
      });

      // Refresh meetings from DB to ensure sync
      fetchMeetings();
    } catch (err) {
      console.error("⚠️ Unexpected error updating meeting:", err);
      alert("Unexpected error occurred. Please try again.");
    }
  };

  const toggleCeremonyStatus = () => {
    const updatedCouples = [...allCouples];
    updatedCouples[activeCoupleIndex] = {
      ...updatedCouples[activeCoupleIndex],
      isActive: !updatedCouples[activeCoupleIndex].isActive,
    };
    console.log(
      "Toggling ceremony status for couple ID:",
      updatedCouples[activeCoupleIndex].id
    );
    setAllCouples(updatedCouples);

    const newStatus = !updatedCouples[activeCoupleIndex].isActive;
    console.log(
      `Ceremony status changed to: ${newStatus ? "Active" : "Deactivated (Archived)"
      }`
    );

    // If deactivating, show message about archived section
    if (!newStatus) {
      alert(
        `This ceremony has been deactivated and moved to the Archived section.\n\nYou can view archived ceremonies from the Scripts tab or by clicking "View Archived Ceremonies".`
      );
    }
  };

  const handleUnarchiveCouple = (coupleId: number) => {
    const updatedCouples = allCouples.map((couple) =>
      couple.id === coupleId ? { ...couple, isActive: true } : couple
    );
    setAllCouples(updatedCouples);
    console.log(`Ceremony unarchived: ID ${coupleId}`);
    alert("Ceremony has been restored and is now active!");
  };

  const handleAddTask = (newTaskData: Omit<Task, "id" | "createdDate">) => {
    const newTask: Task = {
      ...newTaskData,
      id: Math.max(...tasks.map((t) => t.id)) + 1,
      createdDate: new Date().toISOString().split("T")[0],
    };

    setTasks((prev) => [...prev, newTask]);

    // Simulate backend email notification setup
    if (newTaskData.emailReminder) {
      scheduleEmailNotification(newTask);
    }

    console.log("New task added:", newTask);
  };

  const scheduleEmailNotification = (task: Task) => {
    // In a real application, this would make an API call to schedule the email
    const reminderDate = new Date(task.dueDate);
    reminderDate.setDate(reminderDate.getDate() - task.reminderDays);

    console.log(`📧 Email notification scheduled:`);
    console.log(`Task: ${task.task}`);
    console.log(`Reminder Date: ${reminderDate.toDateString()}`);
    console.log(`Due: ${task.dueDate} at ${task.dueTime}`);
    console.log(`Priority: ${task.priority}`);

    // Simulate email content
    const emailContent = generateTaskReminderEmail(task);
    console.log("Email Content:", emailContent);
  };

  const generateTaskReminderEmail = (task: Task) => {
    const priorityEmoji = {
      low: "🟢",
      medium: "🟡",
      high: "🟠",
      urgent: "🔴",
    };

    return {
      to: "pastor.michael@ordainedpro.com",
      subject: `⏰ Task Reminder: ${task.task}`,
      body: `
        Dear Pastor Michael,

        This is a reminder for your upcoming task:

        📋 Task: ${task.task}
        📅 Due Date: ${new Date(task.dueDate).toLocaleDateString()} at ${task.dueTime
        }
        ${priorityEmoji[task.priority]} Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
        }
        📁 Category: ${task.category}

        ${task.details ? `Details: ${task.details}` : ""}

        Don't forget to complete this task on time!

        Best regards,
        OrdainedPro Task Management System
      `,
    };
  };

  // const toggleTaskCompletion = (taskId: number) => {
  //   setTasks((prev) =>
  //     prev.map((task) =>
  //       task.id === taskId ? { ...task, completed: !task.completed } : task
  //     )
  //   );
  // };
  const fetchTasks = async () => {
    if (!user?.id) return;

    setLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id) // ✅ ensures tasks are fetched per logged-in user
        .order("due_date", { ascending: true });

      if (error) {
        console.error("❌ Error fetching tasks:", error);
        return;
      }

      setTasks(data || []);
      console.log("✅ Loaded tasks:", data);
    } catch (err) {
      console.error("⚠️ Unexpected error fetching tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user, currentCoupleId]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "low":
        return "🟢";
      case "medium":
        return "🟡";
      case "high":
        return "🟠";
      case "urgent":
        return "🔴";
      default:
        return "⚪";
    }
  };
  const getFilteredTasks = () => {
    switch (taskFilter) {
      case "pending":
        return tasks.filter((task) => !task.completed);
      case "completed":
        return tasks.filter((task) => task.completed);
      case "high-priority":
        return tasks.filter(
          (task) =>
            (task.priority === "high" || task.priority === "urgent") &&
            !task.completed
        );
      default:
        return tasks;
    }
  };
  const toggleTaskCompletion = async (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, completed: !task.completed };

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: updatedTask.completed })
        .eq("id", taskId);

      if (error) {
        console.error("❌ Error updating task completion:", error);
        // Revert on error
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
      } else {
        console.log("✅ Task updated successfully:", updatedTask);
      }
    } catch (err) {
      console.error("⚠️ Unexpected error updating task:", err);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
    }
  };

  const handleScheduleMeeting = (
    meetingData: Omit<
      Meeting,
      "id" | "createdDate" | "status" | "reminderSent" | "calendarInviteSent"
    >
  ) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: Math.max(...meetings.map((m) => m.id)) + 1,
      createdDate: new Date().toISOString().split("T")[0],
      status: "pending",
      reminderSent: false,
      calendarInviteSent: true,
    };

    setMeetings((prev) => [...prev, newMeeting]);

    // Simulate sending calendar invite and email
    sendMeetingInvitation(newMeeting);

    console.log("New meeting scheduled:", newMeeting);
  };

  const sendMeetingInvitation = (meeting: Meeting) => {
    // In a real application, this would make API calls to:
    // 1. Send calendar invitation
    // 2. Send email notification
    // 3. Set up response tracking

    console.log(`📧 MEETING INVITATION SENT:`);
    console.log(`Meeting: ${meeting.subject}`);
    console.log(`Date: ${meeting.date} at ${meeting.time}`);
    console.log(`Attendees: ${meeting.attendees.join(", ")}`);
    console.log(`Type: ${meeting.meetingType}`);
    console.log(`Status: ${meeting.status}`);
    console.log(`Response Deadline: ${meeting.responseDeadline}`);

    // Simulate email webhook for responses
    simulateEmailResponses(meeting);
  };

  const simulateEmailResponses = (meeting: Meeting) => {
    // Simulate receiving email responses after some time
    setTimeout(() => {
      const responses = ["accepted", "declined", "pending"];
      const randomResponse = responses[
        Math.floor(Math.random() * responses.length)
      ] as "accepted" | "declined" | "pending";

      updateMeetingStatus(meeting.id, randomResponse);

      console.log(`📬 EMAIL RESPONSE RECEIVED:`);
      console.log(`Meeting: ${meeting.subject}`);
      console.log(`Response: ${randomResponse.toUpperCase()}`);
      console.log(`Updated meeting status in portal calendar`);
    }, 5000); // Simulate response after 5 seconds
  };

  const updateMeetingStatus = (
    meetingId: number,
    status: "pending" | "accepted" | "declined" | "confirmed"
  ) => {
    setMeetings((prev) =>
      prev.map((meeting) =>
        meeting.id === meetingId ? { ...meeting, status } : meeting
      )
    );

    // Show notification to user
    const meeting = meetings.find((m) => m.id === meetingId);
    if (meeting) {
      const statusMessages = {
        accepted: "✅ Meeting accepted by couple!",
        declined: "❌ Meeting declined by couple. Please reschedule.",
        confirmed: "🎉 Meeting confirmed!",
        pending: "⏳ Meeting response pending...",
      };

      // In a real app, this would be a toast notification
      setTimeout(() => {
        alert(
          `📅 Meeting Update: ${meeting.subject}\n\n${statusMessages[status]}`
        );
      }, 100);
    }
  };

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "declined":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMeetingStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
      case "accepted":
        return "✅";
      case "pending":
        return "⏳";
      case "declined":
        return "❌";
      default:
        return "📅";
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "💻";
      case "phone":
        return "📞";
      case "in-person":
        return "👥";
      default:
        return "📅";
    }
  };

  const fetchMeetings = async () => {
    if (!user) return;

    setLoadingMeetings(true);
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) {
        console.error("❌ Error fetching meetings:", error);
        setMeetings([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log("📅 No meetings found for user:", user.id);
        setMeetings([]);
        return;
      }

      // 🗓️ Format the data to match frontend fields
      const formatted = data.map((m) => ({
        id: m.id,
        subject: m.title,
        date: m.date,
        time: m.time,
        location: m.location || "TBD",
        body: m.notes || "",
        meetingType: m.location ? "in-person" : "online",
        duration: m.duration || 60,
        status: new Date(m.date) < new Date() ? "completed" : "pending",
        responseDeadline: new Date(m.date).toISOString(),
      }));

      setMeetings(formatted);
    } catch (err) {
      console.error("⚠️ Unexpected error fetching meetings:", err);
    } finally {
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [user]);
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("realtime-meetings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetings",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchMeetings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ========================================
  // COUPLE-OFFICIANT MESSAGING FUNCTIONS
  // ========================================

  // Fetch messages from Supabase
  const fetchCoupleMessages = async () => {
    if (!user) return;

    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Error fetching messages:", error);
        setCoupleMessages([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log("💬 No messages found");
        setCoupleMessages([]);
        return;
      }

      setCoupleMessages(data);
    } catch (err) {
      console.error("⚠️ Unexpected error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Load messages on mount
  useEffect(() => {
    fetchCoupleMessages();
  }, [user]);

  // State for new message notification
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // Real-time message subscription
  useEffect(() => {
    if (!user?.id) return;

    console.log("📡 Setting up real-time subscription for user:", user.id);

    const channel = supabase
      .channel(`messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("📨 New message received in real-time:", payload);

          // Only notify for messages from couples (not ones we sent)
          if (payload.new && payload.new.sender === "couple") {
            setHasNewMessage(true);
            setNewMessageCount((prev) => prev + 1);

            // Play notification sound (optional)
            try {
              const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2XjYB1cX+LnqsAAA==");
              audio.volume = 0.3;
              audio.play().catch(() => {}); // Ignore if can't play
            } catch (e) {}

            // Show browser notification if permitted
            if (Notification.permission === "granted") {
              new Notification("New message from couple!", {
                body: payload.new.content?.substring(0, 100) || "You have a new message",
                icon: "/favicon.ico",
              });
            }
          }

          // Refresh messages
          fetchCoupleMessages();
        }
      )
      .subscribe((status) => {
        console.log("📡 Real-time subscription status:", status);
      });

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      console.log("📡 Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Polling fallback for messages (in case real-time connection fails)
  // This ensures messages are still fetched even without real-time
  useEffect(() => {
    if (!user?.id || !editCoupleInfo.id) return;

    console.log("🔄 Setting up message polling fallback (every 30s)");

    // Poll for new messages every 30 seconds as backup
    const pollInterval = setInterval(() => {
      console.log("🔄 Polling for new messages...");
      fetchCoupleMessages();
    }, 30000); // 30 seconds

    return () => {
      console.log("🔄 Cleaning up message polling");
      clearInterval(pollInterval);
    };
  }, [user?.id, editCoupleInfo.id]);

  // Manual refresh button handler
  const handleRefreshMessages = async () => {
    console.log("🔄 Manual message refresh triggered");
    await fetchCoupleMessages();
  };

  // Send message to couple (with optional email notification)
  const sendCoupleMessage = async (sendEmail: boolean = false) => {
    if (!newMessage.trim()) return;

    // Get ALL valid emails (both bride and groom)
    console.log("🔥 EMAIL FIX v2 - Bride:", editCoupleInfo.brideEmail, "Groom:", editCoupleInfo.groomEmail);
    const allRecipientEmails = [editCoupleInfo.brideEmail, editCoupleInfo.groomEmail].filter(Boolean) as string[];
    const messageContent = newMessage;

    // Data for Supabase (only columns that exist in the table)
    const messageData = {
      user_id: user?.id || "",
      couple_id: editCoupleInfo.id || null,
      sender: "officiant",
      sender_name: officiantProfile.name || user?.name || "Officiant",
      content: messageContent,
      read: false,
      created_at: new Date().toISOString(),
    };

    // Optimistically add to UI
    const tempId = Date.now();
    setCoupleMessages((prev) => [
      ...prev,
      {
        ...messageData,
        id: tempId,
      },
    ]);

    setNewMessage("");

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from("messages")
        .insert([messageData])
        .select();

      if (error) {
        console.error("❌ Error saving message:", error);
        // Revert optimistic update on error
        setCoupleMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

      console.log("✅ Message saved:", data);
      // Send email notification to BOTH bride and groom
      if (sendEmail && allRecipientEmails.length > 0) {
        console.log("📧 Sending email to:", allRecipientEmails);
        for (const email of allRecipientEmails) {
          const emailSent = await sendEmailNotification(
            email,
            `New Message from ${officiantProfile.name || "Your Officiant"}`,
            messageContent
          );
          if (emailSent) {
            console.log("✅ Email notification sent to:", email);
          }
        }
      }
    } catch (err) {
      console.error("⚠️ Unexpected error:", err);
    }
  };

  // Send email notification
  const sendEmailNotification = async (to: string, subject: string, message: string) => {
    setSendingEmail(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          message,
          fromName: officiantProfile.name || "Wedding Officiant",
          coupleName: `${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}`,
          coupleId: editCoupleInfo.id, // Include couple ID for unique reply routing
          officiantId: user?.id, // Include officiant ID for verification
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Email send failed:", error);
        return false;
      }

      console.log("✅ Email sent successfully");
      return true;
    } catch (err) {
      console.error("⚠️ Email error:", err);
      return false;
    } finally {
      setSendingEmail(false);
    }
  };

  // File viewer handler
  const handleViewFile = (file: any) => {
    setViewingFile(file);
    setShowFileViewerDialog(true);
  };

  // Contract viewer content generator
  const getContractViewerContent = (contract: any) => {
    // If contract has a file attachment, show the file
    if (contract.file) {
      const fileType = contract.file.type?.toLowerCase() || "";

      if (fileType.includes("image/")) {
        return (
          <div className="flex justify-center">
            <img
              src={contract.file.url || `/api/placeholder/800/600`}
              alt={contract.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        );
      } else if (fileType.includes("pdf")) {
        return (
          <div className="text-center space-y-4">
            <div className="text-6xl">📄</div>
            <p className="text-gray-600">PDF Contract</p>
            <p className="font-medium">{contract.name}</p>
            <p className="text-sm text-gray-500">
              File type: {contract.file.type}
            </p>
            <Button
              onClick={() => window.open(contract.file.url || "#", "_blank")}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Eye className="w-4 h-4 mr-2" />
              Open PDF in New Tab
            </Button>
          </div>
        );
      } else {
        return (
          <div className="text-center space-y-4">
            <div className="text-6xl">📝</div>
            <p className="text-gray-600">Contract Document</p>
            <p className="font-medium">{contract.name}</p>
            <p className="text-sm text-gray-500">
              File type: {contract.file.type}
            </p>
            <Button
              onClick={() => window.open(contract.file.url || "#", "_blank")}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Contract
            </Button>
          </div>
        );
      }
    } else {
      // If no file, show contract details
      return (
        <div className="text-center space-y-6">
          <div className="text-6xl">📋</div>
          <div>
            <p className="text-gray-600 mb-2">Contract Information</p>
            <p className="font-medium text-xl">{contract.name}</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-4">
              Contract Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-900 capitalize">
                  {contract.type.replace("_", " ")}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <p className="text-gray-900 capitalize">{contract.status}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-900">{contract.createdDate}</p>
              </div>
              {contract.signedDate && (
                <div>
                  <span className="font-medium text-gray-700">Signed:</span>
                  <p className="text-gray-900">{contract.signedDate}</p>
                </div>
              )}
              {contract.signedBy && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Signed by:</span>
                  <p className="text-gray-900">{contract.signedBy}</p>
                </div>
              )}
              {contract.description && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">
                    Description:
                  </span>
                  <p className="text-gray-900">{contract.description}</p>
                </div>
              )}
            </div>
          </div>

          {contract.signature && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-w-md mx-auto">
              <h4 className="font-medium text-green-900 mb-2">
                Digital Signature
              </h4>
              <img
                src={contract.signature}
                alt="Digital Signature"
                className="h-16 border rounded bg-white mx-auto"
                style={{ maxWidth: "200px" }}
              />
              <p className="text-sm text-green-700 mt-2">
                Signed on {contract.signedDate}
              </p>
            </div>
          )}
        </div>
      );
    }
  };

  const getFileViewerContent = (file: any) => {
    const fileType = file.type.toLowerCase();

    if (fileType.includes("image/")) {
      return (
        <div className="flex justify-center">
          <img
            src={file.url || `/api/placeholder/800/600`}
            alt={file.name}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      );
    } else if (fileType.includes("pdf")) {
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">📄</div>
          <p className="text-gray-600">PDF Preview</p>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-500">Size: {file.size}</p>
          <Button
            onClick={() => window.open(file.url || "#", "_blank")}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Eye className="w-4 h-4 mr-2" />
            Open PDF in New Tab
          </Button>
        </div>
      );
    } else if (fileType.includes("text/") || fileType.includes("txt")) {
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">📝</div>
          <p className="text-gray-600">Text Document</p>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-500">Size: {file.size}</p>
          <div className="bg-gray-50 p-4 rounded-lg text-left max-h-96 overflow-y-auto">
            <p className="text-sm text-gray-700">
              Text content preview would appear here...
            </p>
          </div>
        </div>
      );
    } else if (
      fileType.includes("document") ||
      fileType.includes("word") ||
      fileType.includes("doc")
    ) {
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">📝</div>
          <p className="text-gray-600">Word Document</p>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-500">Size: {file.size}</p>
          <Button
            onClick={() => window.open(file.url || "#", "_blank")}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Document
          </Button>
        </div>
      );
    } else {
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">{getFileIcon(file.type)}</div>
          <p className="text-gray-600">File Preview</p>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-400">
            This file type cannot be previewed
          </p>
          <Button
            onClick={() => window.open(file.url || "#", "_blank")}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
        </div>
      );
    }
  };

  // File management handlers
  const handleFilesUploaded = async (files: UploadedFile[]) => {
    const uploaded: UploadedFile[] = [];

    for (const file of files) {
      const fileName = `${user?.id}/${Date.now()}_${file.file?.name || file.name
        }`;
      try {
        // 1️⃣ Upload file to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from("user-documents")
          .upload(fileName, file.file as File, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          continue;
        }

        // 2️⃣ Get public URL
        const { data: urlData } = supabase.storage
          .from("user-documents")
          .getPublicUrl(fileName);

        // 3️⃣ Store metadata in Supabase DB
        const { data: dbData, error: dbError } = await supabase
          .from("user_files")
          .insert({
            user_id: user?.id,
            name: file.file?.name || file.name,
            type: file.file?.type || "unknown",
            size: file.file?.size || 0,
            url: urlData.publicUrl,
          })
          .select();

        if (dbError) console.error("Error saving file metadata:", dbError);

        uploaded.push(file);
      } catch (err) {
        console.error("Unexpected upload error:", err);
      }
    }

    setUploadedFiles((prev) => [...prev, ...uploaded]);

    // Optional: handle script files
    files.forEach(async (file) => {
      const isScript =
        file.name.endsWith(".txt") || file.name.endsWith(".docx");
      if (isScript && onScriptUploaded && file.file) {
        try {
          let content = "";
          if (file.name.endsWith(".docx")) {
            const arrayBuffer = await file.file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            content = result.value;
          } else if (file.name.endsWith(".txt")) {
            content = await file.file.text();
          }

          if (content) onScriptUploaded(content, file.name);
        } catch (err) {
          console.error("Error reading script file:", err);
        }
      }
    });
  };

  // remove file handler
  const handleFileRemoved = async (fileToRemove: UploadedFile) => {
    try {
      // Delete from Supabase Storage
      const filePath = `${user?.id}/${fileToRemove.name}`;
      const { error } = await supabase.storage
        .from("user-documents")
        .remove([filePath]);
      if (error) console.error("Error deleting file from storage:", error);

      // Delete from DB
      await supabase.from("user_files").delete().eq("url", fileToRemove.url);

      // Update state
      setUploadedFiles((prev) => prev.filter((f) => f !== fileToRemove));
    } catch (err) {
      console.error("Error removing file:", err);
    }
  };

  const handleMessageAttachmentsUploaded = (uploadedFiles: UploadedFile[]) => {
    setMessageAttachments((prev) => [...prev, ...uploadedFiles]);
    setShowAttachments(true);
  };

  const handleMessageAttachmentRemoved = (fileId: string) => {
    setMessageAttachments((prev) => prev.filter((f) => f.id !== fileId));
    if (messageAttachments.length <= 1) {
      setShowAttachments(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType.startsWith("audio/")) return "🎵";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("document") || fileType.includes("word")) return "📝";
    if (fileType.includes("spreadsheet") || fileType.includes("excel"))
      return "📊";
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return "📋";
    if (fileType.includes("zip") || fileType.includes("archive")) return "🗜️";
    return "📁";
  };



  const handleSendMessage = async () => {
    // Use the proper couple messaging function
    await sendCoupleMessage(false); // Set to true to also send email
  };

  // Handle opening invoice generation dialog
  const handleOpenInvoiceDialog = () => {
    // Generate invoice number with ceremony-specific format
    const invoiceNumber = `WED-${new Date().getFullYear()}-${String(
      Date.now()
    ).slice(-3)}`;
    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from today

    setInvoiceForm((prev) => ({
      ...prev,
      invoiceNumber,
      invoiceDate: today,
      dueDate: dueDate.toISOString().split("T")[0],
      coupleName: `${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}`,
      weddingDate: editWeddingDetails.weddingDate,
      venue: editWeddingDetails.venueName,
      depositPaid: paymentInfo.depositPaid,
      balanceDue: paymentInfo.balance,
    }));

    setShowGenerateInvoiceDialog(true);
  };

  // Calculate invoice totals
  const calculateInvoiceTotals = () => {
    const subtotal = invoiceForm.items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const taxAmount = subtotal * (invoiceForm.taxRate / 100);
    const total = subtotal + taxAmount;

    setInvoiceForm((prev) => ({
      ...prev,
      subtotal,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    }));
  };

  // Generate invoice email content
  const generateInvoiceContent = () => {
    return `Dear ${(editCoupleInfo.brideName || "").split(" ")[0]} and ${(editCoupleInfo.groomName || "").split(" ")[0]
      },

Congratulations on your upcoming wedding! Please find your ceremony services invoice attached.

═══════════════════════════════════════
🎊 WEDDING CEREMONY INVOICE 🎊
FROM: ${officiantProfile.businessName || "Grace Wedding Ceremonies"}
${officiantProfile.phone ? `📞 ${officiantProfile.phone}` : ""}
${officiantProfile.website ? `🌐 ${officiantProfile.website}` : ""}
═══════════════════════════════════════

COUPLE: ${invoiceForm.coupleName}
WEDDING DATE: ${new Date(invoiceForm.weddingDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
VENUE: ${invoiceForm.venue}

INVOICE DETAILS:
• Invoice #: ${invoiceForm.invoiceNumber}
• Invoice Date: ${new Date(invoiceForm.invoiceDate).toLocaleDateString()}
• Due Date: ${new Date(invoiceForm.dueDate).toLocaleDateString()}

SERVICES PROVIDED:
${invoiceForm.items
        .map(
          (item) =>
            `• ${item.service}
  Description: ${item.description}
  Category: ${item.category || "Wedding Services"}
  Rate: ${item.quantity}x ${item.rate} = ${item.quantity * item.rate}`
        )
        .join("\n\n")}

PAYMENT SUMMARY:
• Subtotal: ${invoiceForm.subtotal}
${invoiceForm.taxRate > 0
        ? `• Tax (${invoiceForm.taxRate}%): ${invoiceForm.taxAmount}`
        : ""
      }
• Deposit Previously Paid: -${invoiceForm.depositPaid}
• Balance Due: ${invoiceForm.balanceDue}
• TOTAL INVOICE AMOUNT: ${invoiceForm.total}

PAYMENT METHODS ACCEPTED:
${invoiceForm.paymentMethods}

${invoiceForm.bankDetails
        ? `BANKING INFORMATION:\n${invoiceForm.bankDetails}\n`
        : ""
      }

TERMS & CONDITIONS:
${invoiceForm.terms}

ADDITIONAL NOTES:
${invoiceForm.notes}

We're honored to be part of your special day and look forward to creating a beautiful ceremony that reflects your love story!

Blessings,
${officiantProfile.fullName || "Pastor Michael Adams"}
${officiantProfile.businessName || "Grace Wedding Ceremonies"}
${officiantProfile.phone ? `📞 ${officiantProfile.phone}` : ""}
${officiantProfile.email ? `📧 ${officiantProfile.email}` : ""}
${officiantProfile.website ? `🌐 ${officiantProfile.website}` : ""}
Licensed Wedding Officiant
📞 (555) 987-6543
📧 pastor.michael@ordainedpro.com
🌐 www.ordainedpro.com

═══════════════════════════════════════`;
  };

  // Handle invoice generation and sending

  const handleGenerateAndSendInvoice = async () => {
    try {
      if (!invoiceForm.invoiceNumber.trim()) {
        alert("Please enter an invoice number.");
        return;
      }

      if (!invoiceForm.invoiceDate) {
        alert("Please select an invoice date.");
        return;
      }

      if (!invoiceForm.dueDate) {
        alert("Please select a due date.");
        return;
      }

      if (invoiceForm.items.some((item) => !item.service.trim())) {
        alert("Please fill in all service names.");
        return;
      }

      // 🧮 Calculate totals
      calculateInvoiceTotals();

      // 🧾 Generate invoice content (HTML or text)
      const invoiceContent = generateInvoiceContent();

      // Determine recipients
      const recipients =
        invoiceForm.emailRecipients === "both"
          ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
          : invoiceForm.emailRecipients === "bride"
            ? editCoupleInfo.brideEmail
            : invoiceForm.emailRecipients === "groom"
              ? editCoupleInfo.groomEmail
              : invoiceForm.emailRecipients;

      // ✅ Create a real PDF Blob (for storage upload)
      const pdfBlob = new Blob([invoiceContent], { type: "application/pdf" });
      const fileName = `${invoiceForm.invoiceNumber}.pdf`;

      // ✅ Upload PDF to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("invoices") // 🔒 make sure this bucket exists
        .upload(`invoices/${fileName}`, pdfBlob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "application/pdf",
        });

      if (uploadError) {
        console.error("❌ Invoice upload failed:", uploadError);
        alert("Failed to upload invoice PDF. Check Supabase Storage.");
        return;
      }

      // ✅ Get public URL for the file
      const { data: publicUrlData } = supabase.storage
        .from("invoices")
        .getPublicUrl(`invoices/${fileName}`);

      const invoiceUrl = publicUrlData.publicUrl;

      // ✅ Store invoice record in Supabase
      const { data: savedInvoice, error: saveError } = await supabase
        .from("invoices")
        .insert({
          couple_id: editCoupleInfo.id,
          user_id: user?.id,
          invoice_number: invoiceForm.invoiceNumber,
          invoice_date: invoiceForm.invoiceDate,
          due_date: invoiceForm.dueDate,
          total: invoiceForm.total,
          deposit_paid: invoiceForm.depositPaid,
          balance_due: invoiceForm.balanceDue,
          payment_methods: invoiceForm.paymentMethods,
          invoice_url: invoiceUrl,
          notes: invoiceForm.notes || null,
        })
        .select()
        .single();

      if (saveError) {
        console.error("❌ Invoice save failed:", saveError);
        alert("Failed to save invoice record to Supabase.");
        return;
      }

      // ✅ Add to local message thread
      const invoiceAttachment = {
        id: `invoice_${invoiceForm.invoiceNumber}_${Date.now()}`,
        file: fileName,
        name: fileName,
        size: pdfBlob.size,
        type: "application/pdf",
        url: invoiceUrl,
        uploadProgress: 100,
        status: "completed",
      };

      setMessageAttachments([invoiceAttachment]);

      setNewMessage(`📧 Wedding Invoice Sent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👰🤵 Couple: ${invoiceForm.coupleName}
📧 Sent to: ${recipients}
🧾 Invoice #: ${invoiceForm.invoiceNumber}
💒 Wedding Date: ${new Date(invoiceForm.weddingDate).toLocaleDateString()}
🏛️ Venue: ${invoiceForm.venue}

💰 FINANCIAL SUMMARY:
• Total Services: ${invoiceForm.total}
• Deposit Paid: ${invoiceForm.depositPaid}
• Balance Due: ${invoiceForm.balanceDue}
📅 Payment Due: ${new Date(invoiceForm.dueDate).toLocaleDateString()}

📋 SERVICES INCLUDED:
${invoiceForm.items
          .map((item) => `• ${item.service} - ${item.quantity * item.rate}`)
          .join("\n")}

💳 Payment Methods: ${invoiceForm.paymentMethods}

🧾 View Invoice: ${invoiceUrl}`);

      setShowAttachments(true);

      // Auto-send the message
      setTimeout(() => handleSendMessage(), 100);

      // ✅ Close the dialog
      setShowGenerateInvoiceDialog(false);

      console.log(
        `✅ Invoice ${invoiceForm.invoiceNumber} generated, saved, and sent to ${recipients}`
      );
      alert(
        `✅ Invoice ${invoiceForm.invoiceNumber} has been generated and sent successfully!`
      );
    } catch (err) {
      console.error("❌ Invoice generation error:", err);
      alert("Something went wrong while generating and sending invoice.");
    }
  };

  // Effect to handle script editor setup and formatting preservation
  useEffect(() => {
    if (showScriptEditorDialog && editingScript) {
      // Use a longer delay to ensure the dialog and editor are fully rendered
      const timeoutId = setTimeout(() => {
        const editorElement =
          editorRef.current ||
          (document.getElementById("script-editor") as HTMLDivElement);

        if (editorElement) {
          // Ensure proper formatting preservation
          editorElement.style.whiteSpace = "pre-wrap";
          editorElement.style.wordWrap = "break-word";

          // Always set the content, whether it's empty or not
          editorElement.innerHTML = scriptContent || "";
          console.log(
            "Editor setup - Content set:",
            scriptContent ? scriptContent.substring(0, 100) + "..." : "EMPTY"
          );

          // Focus the editor
          editorElement.focus();

          // Place cursor at the end of content
          const range = document.createRange();
          const selection = window.getSelection();

          if (editorElement.childNodes.length > 0) {
            const lastNode =
              editorElement.childNodes[editorElement.childNodes.length - 1];
            if (lastNode.nodeType === Node.TEXT_NODE) {
              range.setStart(lastNode, lastNode.textContent?.length || 0);
            } else {
              range.setStartAfter(lastNode);
            }
          } else {
            range.setStart(editorElement, 0);
          }

          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);

          console.log("Script editor fully initialized:", {
            scriptTitle: editingScript.title,
            contentLength: scriptContent?.length || 0,
            editorReady: true,
          });
        }
      }, 320); // Increased delay

      return () => clearTimeout(timeoutId);
    }
  }, [showScriptEditorDialog, editingScript, scriptContent]);

  // Additional effect to ensure content stays synced during editing
  useEffect(() => {
    if (showScriptEditorDialog && scriptContent !== undefined) {
      const editorElement =
        editorRef.current ||
        (document.getElementById("script-editor") as HTMLDivElement);

      if (editorElement && editorElement.innerHTML !== scriptContent) {
        // Only update if the content is actually different to avoid cursor issues
        const currentPlainText = editorElement.innerText || "";
        const statePlainText = scriptContent.replace(/<[^>]*>/g, "") || "";

        if (currentPlainText !== statePlainText) {
          editorElement.innerHTML = scriptContent;
          console.log(
            "Content sync - Updated editor:",
            scriptContent?.substring(0, 50) + "..."
          );
        }
      }
    }
  }, [scriptContent, showScriptEditorDialog]);

  // Handle sending generated script to editor
  const handleSendToEditor = () => {
    if (!hasGeneratedScript || !generatedScriptContent) {
      alert(
        "No script has been generated yet. Please complete the ceremony planning process first."
      );
      return;
    }

    // 🎉 Trigger confetti celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#3b82f6", "#ec4899"],
    });

    // Multiple confetti bursts for extra celebration
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#10b981", "#3b82f6", "#ec4899"],
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#10b981", "#3b82f6", "#ec4899"],
      });
    }, 400);

    // Create a new script object similar to existing scripts
    const newScript = {
      id: Date.now(),
      title: `Generated Ceremony Script - ${selectedCeremonyStyle || "Custom"}`,
      content: generatedScriptContent,
      createdDate: new Date().toLocaleDateString(),
      type: selectedCeremonyStyle || "Custom",
      status: "draft",
    };

    // Set up the editor with the generated content
    setEditingScript(newScript);
    setScriptContent(generatedScriptContent);
    setShowScriptEditorDialog(true);
  };

  // Handle script modification requests
  const handleScriptModification = (request: string) => {
    setIsTyping(true);

    setTimeout(() => {
      // Create modified script based on request
      let updatedScript = generatedScriptContent;
      const lowerRequest = request.toLowerCase();

      // AI response acknowledging the modification
      let modificationResponse = `I'll update your ceremony script based on your request: "${request}"\n\n`;

      // Apply common modifications
      if (lowerRequest.includes("shorter") || lowerRequest.includes("brief")) {
        modificationResponse +=
          "✅ Made the ceremony more concise and streamlined\n";
        updatedScript = updatedScript.replace(/\[.*?\]/g, ""); // Remove bracketed instructions
      } else if (
        lowerRequest.includes("longer") ||
        lowerRequest.includes("more detail")
      ) {
        modificationResponse +=
          "✅ Added more detailed elements and explanations\n";
        updatedScript += `\n\nADDITIONAL ELEMENTS\n[Additional ceremonial elements and personal touches as requested]\n`;
      } else if (
        lowerRequest.includes("personal") ||
        lowerRequest.includes("customize")
      ) {
        modificationResponse += "✅ Added more personalized elements\n";
        updatedScript = updatedScript.replace(
          "EXCHANGE OF VOWS",
          "PERSONALIZED EXCHANGE OF VOWS\n[Customized vows reflecting the couple's unique relationship]"
        );
      } else if (
        lowerRequest.includes("music") ||
        lowerRequest.includes("song")
      ) {
        modificationResponse += "✅ Added music cues and recommendations\n";
        updatedScript = updatedScript.replace(
          "PROCESSIONAL",
          'PROCESSIONAL\n[Suggested music: "Canon in D" or couple\'s chosen processional song]'
        );
      } else if (
        lowerRequest.includes("reading") ||
        lowerRequest.includes("poem")
      ) {
        modificationResponse += "✅ Added reading section\n";
        updatedScript = updatedScript.replace(
          "EXCHANGE OF VOWS",
          "SPECIAL READING\n[Insert chosen reading, poem, or scripture here]\n\nEXCHANGE OF VOWS"
        );
      } else {
        modificationResponse +=
          "✅ Applied your requested changes to the script\n";
        updatedScript += `\n\nCUSTOM MODIFICATION\n[Modified based on request: ${request}]\n`;
      }

      // Update the script content
      setGeneratedScriptContent(updatedScript);

      modificationResponse +=
        "\nYour updated script is ready! The 'Generate Final Script' button will now include these changes.";

      const responseMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: modificationResponse,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, responseMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Enhanced Header with Action Buttons */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  OrdainedPro
                </h1>
                <p className="text-blue-600 font-medium">
                  Communication Portal
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Add New Ceremony Button */}
              <Dialog
                open={showAddCeremonyDialog}
                onOpenChange={setShowAddCeremonyDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    size="default"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 h-10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Ceremony
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Wedding Ceremony</DialogTitle>
                    <DialogDescription>
                      Fill in the details for the new wedding ceremony you'll be
                      officiating.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Ceremony Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-blue-900">
                        Ceremony Details
                      </h3>

                      <div>
                        <Label htmlFor="ceremonyName">Ceremony Name</Label>
                        <Input
                          id="ceremonyName"
                          value={newCeremony.ceremonyName}
                          onChange={(e) =>
                            setNewCeremony({
                              ...newCeremony,
                              ceremonyName: e.target.value,
                            })
                          }
                          placeholder="e.g., Sarah & David's Wedding"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="ceremonyDate">Date</Label>
                          <Input
                            id="ceremonyDate"
                            type="date"
                            value={newCeremony.ceremonyDate}
                            onChange={(e) =>
                              setNewCeremony({
                                ...newCeremony,
                                ceremonyDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ceremonyTime">Time</Label>
                          <Input
                            id="ceremonyTime"
                            type="time"
                            value={newCeremony.ceremonyTime}
                            onChange={(e) =>
                              setNewCeremony({
                                ...newCeremony,
                                ceremonyTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="venueName">Venue Name</Label>
                        <Input
                          id="venueName"
                          value={newCeremony.venueName}
                          onChange={(e) =>
                            setNewCeremony({
                              ...newCeremony,
                              venueName: e.target.value,
                            })
                          }
                          placeholder="e.g., Sunset Gardens"
                        />
                      </div>

                      <div>
                        <Label htmlFor="venueAddress">Venue Address</Label>
                        <Textarea
                          id="venueAddress"
                          value={newCeremony.venueAddress}
                          onChange={(e) =>
                            setNewCeremony({
                              ...newCeremony,
                              venueAddress: e.target.value,
                            })
                          }
                          placeholder="Full venue address"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="expectedGuests">Expected Guests</Label>
                        <Input
                          id="expectedGuests"
                          type="number"
                          value={newCeremony.expectedGuests}
                          onChange={(e) =>
                            setNewCeremony({
                              ...newCeremony,
                              expectedGuests: e.target.value,
                            })
                          }
                          placeholder="Number of guests"
                        />
                      </div>
                    </div>

                    {/* Couple Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-blue-900">
                        Couple Information
                      </h3>

                      {/* Bride Information */}
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <h4 className="font-medium text-pink-900 mb-3">
                          Bride Information
                        </h4>
                        <div className="space-y-3">
                          <Input
                            value={newCeremony.brideName}
                            onChange={(e) =>
                              setNewCeremony({
                                ...newCeremony,
                                brideName: e.target.value,
                              })
                            }
                            placeholder="Bride's full name"
                          />
                          <Input
                            type="email"
                            value={newCeremony.brideEmail}
                            onChange={(e) =>
                              setNewCeremony({
                                ...newCeremony,
                                brideEmail: e.target.value,
                              })
                            }
                            placeholder="Bride's email"
                          />
                          <Input
                            type="tel"
                            value={newCeremony.bridePhone}
                            onChange={(e) =>
                              setNewCeremony({
                                ...newCeremony,
                                bridePhone: e.target.value,
                              })
                            }
                            placeholder="Bride's phone"
                          />
                          <Input
                            value={newCeremony.brideAddress}
                            onChange={(e) =>
                              setNewCeremony({
                                ...newCeremony,
                                brideAddress: e.target.value,
                              })
                            }
                            placeholder="Bride's primary address"
                          />
                        </div>
                      </div>

                      {/* Groom Information */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-3">
                          Groom Information
                        </h4>
                        <div className="space-y-3">
                          <Input
                            value={newCeremony.groomName}
                            onChange={(e) =>
                              setNewCeremony({
                                ...newCeremony,
                                groomName: e.target.value,
                              })
                            }
                            placeholder="Groom's full name"
                          />
                          <Input
                            type="email"
                            value={newCeremony.groomEmail}
                            onChange={(e) =>
                              setNewCeremony({
                                ...newCeremony,
                                groomEmail: e.target.value,
                              })
                            }
                            placeholder="Groom's email"
                          />
                          <Input
                            type="tel"
                            value={newCeremony.groomPhone}
                            onChange={(e) =>
                              setNewCeremony({
                                ...newCeremony,
                                groomPhone: e.target.value,
                              })
                            }
                            placeholder="Groom's phone"
                          />
                          <Input
                            value={newCeremony.groomAddress}
                            onChange={(e) =>
                              setNewCeremony({
                                ...newCeremony,
                                groomAddress: e.target.value,
                              })
                            }
                            placeholder="Groom's primary address"
                          />
                        </div>
                      </div>

                      {/* Payment Information */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-3">
                          Payment Information
                        </h4>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              value={newCeremony.totalAmount}
                              onChange={(e) =>
                                setNewCeremony({
                                  ...newCeremony,
                                  totalAmount: e.target.value,
                                })
                              }
                              placeholder="Total amount ($)"
                            />
                            <Input
                              type="number"
                              value={newCeremony.depositAmount}
                              onChange={(e) =>
                                setNewCeremony({
                                  ...newCeremony,
                                  depositAmount: e.target.value,
                                })
                              }
                              placeholder="Deposit amount ($)"
                            />
                          </div>
                          <div>
                            <Label htmlFor="finalPaymentDate">
                              Final Payment Due Date
                            </Label>
                            <Input
                              id="finalPaymentDate"
                              type="date"
                              value={newCeremony.finalPaymentDate}
                              onChange={(e) =>
                                setNewCeremony({
                                  ...newCeremony,
                                  finalPaymentDate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          value={newCeremony.notes}
                          onChange={(e) =>
                            setNewCeremony({
                              ...newCeremony,
                              notes: e.target.value,
                            })
                          }
                          placeholder="Special requests, preferences, etc."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddCeremonyDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddCeremony}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Create Ceremony
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Switch Ceremony Dialog */}
              <Dialog
                open={showSwitchCeremonyDialog}
                onOpenChange={setShowSwitchCeremonyDialog}
              >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Switch Between Ceremonies</DialogTitle>
                    <DialogDescription>
                      Select a couple to view and manage their ceremony details.
                      Only active ceremonies are shown.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {allCouples.filter((couple) => couple.isActive).length ===
                      0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No active ceremonies found.</p>
                        <p className="text-sm mt-2">
                          Click "Add New Ceremony" to create one, or check the
                          Archived section.
                        </p>
                      </div>
                    ) : (
                      allCouples
                        .filter((couple) => couple.isActive)
                        .map((couple, index) => {
                          const actualIndex = allCouples.findIndex(
                            (c) => c.id === couple.id
                          );
                          return (
                            <Card
                              key={couple.id}
                              className={`cursor-pointer transition-all hover:shadow-lg ${actualIndex === activeCoupleIndex
                                ? "border-blue-500 border-2 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                                }`}
                              onClick={() => handleSwitchCouple(actualIndex)}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    {/* Couple Names */}
                                    <div className="mb-4">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {couple.brideName} & {couple.groomName}
                                      </h3>
                                      {actualIndex === activeCoupleIndex && (
                                        <Badge className="bg-blue-500 text-white">
                                          Currently Active
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Couple Information Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {/* Bride Info */}
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <Avatar
                                            className={`ring-2 ${couple.colors?.brideRing ||
                                              "ring-pink-100"
                                              }`}
                                          >
                                            <AvatarFallback
                                              className={`${couple.colors?.bride ||
                                                "bg-pink-500"
                                                } text-white`}
                                            >
                                              {(couple.brideName || "")
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="font-medium text-gray-900">
                                              {couple.brideName}
                                            </p>
                                            <p
                                              className={`text-xs ${couple.colors?.brideText ||
                                                "text-pink-600"
                                                }`}
                                            >
                                              Bride
                                            </p>
                                          </div>
                                        </div>
                                        <div className="ml-12 text-sm space-y-1">
                                          <div className="flex items-center text-gray-600">
                                            <Mail className="w-3 h-3 mr-2" />
                                            {couple.brideEmail}
                                          </div>
                                          <div className="flex items-center text-gray-600">
                                            <Phone className="w-3 h-3 mr-2" />
                                            {couple.bridePhone}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Groom Info */}
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <Avatar
                                            className={`ring-2 ${couple.colors?.groomRing ||
                                              "ring-blue-100"
                                              }`}
                                          >
                                            <AvatarFallback
                                              className={`${couple.colors?.groom ||
                                                "bg-blue-500"
                                                } text-white`}
                                            >
                                              {couple.groomName
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="font-medium text-gray-900">
                                              {couple.groomName}
                                            </p>
                                            <p
                                              className={`text-xs ${couple.colors?.groomText ||
                                                "text-blue-600"
                                                }`}
                                            >
                                              Groom
                                            </p>
                                          </div>
                                        </div>
                                        <div className="ml-12 text-sm space-y-1">
                                          <div className="flex items-center text-gray-600">
                                            <Mail className="w-3 h-3 mr-2" />
                                            {couple.groomEmail}
                                          </div>
                                          <div className="flex items-center text-gray-600">
                                            <Phone className="w-3 h-3 mr-2" />
                                            {couple.groomPhone}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Wedding Details */}
                                    {couple.weddingDetails && (
                                      <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <p className="font-medium text-gray-700 flex items-center">
                                              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                              Venue
                                            </p>
                                            <p className="text-gray-600 ml-6">
                                              {couple.weddingDetails.venueName}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-700 flex items-center">
                                              <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                                              Date
                                            </p>
                                            <p className="text-gray-600 ml-6">
                                              {couple.weddingDetails.weddingDate
                                                ? new Date(
                                                  couple.weddingDetails.weddingDate
                                                ).toLocaleDateString(
                                                  "en-US",
                                                  {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                  }
                                                )
                                                : "Not set"}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-700 flex items-center">
                                              <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                              Time
                                            </p>
                                            <p className="text-gray-600 ml-6">
                                              {couple.weddingDetails
                                                .startTime || "Not set"}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-700 flex items-center">
                                              <Users className="w-4 h-4 mr-2 text-blue-500" />
                                              Expected Guests
                                            </p>
                                            <p className="text-gray-600 ml-6">
                                              {couple.weddingDetails
                                                .expectedGuests || "Not set"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSwitchCeremonyDialog(false);
                        setShowArchivedCeremoniesDialog(true);
                      }}
                      className="text-gray-600"
                    >
                      View Archived Ceremonies
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSwitchCeremonyDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Archived Ceremonies Dialog */}
              <Dialog
                open={showArchivedCeremoniesDialog}
                onOpenChange={setShowArchivedCeremoniesDialog}
              >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Archived Ceremonies</DialogTitle>
                    <DialogDescription>
                      View and restore deactivated ceremonies. These ceremonies
                      are hidden from the active list.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {allCouples.filter((couple) => !couple.isActive).length ===
                      0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No archived ceremonies found.</p>
                        <p className="text-sm mt-2">
                          Deactivated ceremonies will appear here.
                        </p>
                      </div>
                    ) : (
                      allCouples
                        .filter((couple) => !couple.isActive)
                        .map((couple) => (
                          <Card
                            key={couple.id}
                            className="border-gray-300 bg-gray-50"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {/* Couple Names */}
                                  <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                      {couple.brideName} & {couple.groomName}
                                    </h3>
                                    <Badge className="bg-gray-500 text-white">
                                      Archived
                                    </Badge>
                                  </div>

                                  {/* Couple Information Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Bride Info */}
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Avatar
                                          className={`ring-2 ${couple.colors?.brideRing ||
                                            "ring-pink-100"
                                            }`}
                                        >
                                          <AvatarFallback
                                            className={`${couple.colors?.bride ||
                                              "bg-pink-500"
                                              } text-white`}
                                          >
                                            {(couple.brideName || "")
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-gray-900">
                                            {couple.brideName}
                                          </p>
                                          <p
                                            className={`text-xs ${couple.colors?.brideText ||
                                              "text-pink-600"
                                              }`}
                                          >
                                            Bride
                                          </p>
                                        </div>
                                      </div>
                                      <div className="ml-12 text-sm space-y-1">
                                        <div className="flex items-center text-gray-600">
                                          <Mail className="w-3 h-3 mr-2" />
                                          {couple.brideEmail}
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                          <Phone className="w-3 h-3 mr-2" />
                                          {couple.bridePhone}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Groom Info */}
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Avatar
                                          className={`ring-2 ${couple.colors?.groomRing ||
                                            "ring-blue-100"
                                            }`}
                                        >
                                          <AvatarFallback
                                            className={`${couple.colors?.groom ||
                                              "bg-blue-500"
                                              } text-white`}
                                          >
                                            {(couple.groomName || "")
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-gray-900">
                                            {couple.groomName}
                                          </p>
                                          <p
                                            className={`text-xs ${couple.colors?.groomText ||
                                              "text-blue-600"
                                              }`}
                                          >
                                            Groom
                                          </p>
                                        </div>
                                      </div>
                                      <div className="ml-12 text-sm space-y-1">
                                        <div className="flex items-center text-gray-600">
                                          <Mail className="w-3 h-3 mr-2" />
                                          {couple.groomEmail}
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                          <Phone className="w-3 h-3 mr-2" />
                                          {couple.groomPhone}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Wedding Details */}
                                  {couple.weddingDetails && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="font-medium text-gray-700 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                                            Venue
                                          </p>
                                          <p className="text-gray-600 ml-6">
                                            {couple.weddingDetails.venueName}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-700 flex items-center">
                                            <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
                                            Date
                                          </p>
                                          <p className="text-gray-600 ml-6">
                                            {couple.weddingDetails.weddingDate
                                              ? new Date(
                                                couple.weddingDetails.weddingDate
                                              ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                              })
                                              : "Not set"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Restore Button */}
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <Button
                                      onClick={() =>
                                        handleUnarchiveCouple(couple.id)
                                      }
                                      className="bg-green-500 hover:bg-green-600 text-white"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Restore Ceremony
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowArchivedCeremoniesDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Active Ceremony Status Button */}
              <Button
                size="default"
                onClick={toggleCeremonyStatus}
                className={`px-4 py-2 h-10 text-white transition-all ${allCouples[activeCoupleIndex]?.isActive
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
                  }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${allCouples[activeCoupleIndex]?.isActive
                    ? "bg-white"
                    : "bg-white"
                    }`}
                ></div>
                {allCouples[activeCoupleIndex]?.isActive
                  ? "Active Ceremony"
                  : "Archived Ceremony"}
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
                    <Avatar className="w-12 h-12" key={officiantProfile?.headshot || 'no-headshot'}>
                      <AvatarImage
                        src={officiantProfile?.headshot || ""}
                        alt={officiantProfile?.fullName || "Officiant"}
                        key={officiantProfile?.headshot}
                      />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {officiantProfile?.fullName
                          ? officiantProfile.fullName
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                          : "PM"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {officiantProfile?.fullName || "Pastor Michael Adams"}
                      </p>
                      <p className="text-xs text-gray-500 text-start">
                        Officiant
                      </p>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-4">
                    {/* Profile Info */}
                    <div className="flex items-center space-x-3 pb-3 border-b">
                      <Avatar className="w-12 h-12" key={officiantProfile?.headshot || 'no-headshot'}>
                        <AvatarImage
                          src={officiantProfile?.headshot || ""}
                          alt={officiantProfile?.fullName || "Officiant"}
                          key={officiantProfile?.headshot}
                        />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {officiantProfile?.fullName
                            ? officiantProfile.fullName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                            : "PM"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {officiantProfile?.fullName || "Pastor Michael Adams"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Officiant
                        </p>
                      </div>
                    </div>

                    {/* Subscription Tier */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">
                            Current Plan
                          </p>
                          <p className="font-semibold text-purple-900">
                            Professional
                          </p>
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Pro
                        </Badge>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-blue-50"
                        onClick={() => setShowDashboardDialog(true)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        My Dashboard
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-gray-100"
                        onClick={() => {
                          setDashboardInitialView("settings");
                          setShowDashboardDialog(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Button>
                    </div>

                    {/* Logout Button */}
                    <div className="pt-3 border-t">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          if (confirm("Are you sure you want to logout?")) {
                            // Clear storage immediately (synchronous - instant!)
                            localStorage.clear();
                            sessionStorage.clear();

                            // Sign out from Supabase in background (don't wait)
                            supabase.auth.signOut().catch(err => {
                              console.error("Supabase signout error:", err);
                            });

                            // Redirect immediately - no delays!
                            window.location.href = "https://www.ordainedpro.com";
                          }
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Info Cards with Edit Button */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center text-blue-900">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Wedding Couple
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {/* Switch Ceremony Button */}
                  <Button
                    size="sm"
                    onClick={() => setShowSwitchCeremonyDialog(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1 h-8"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Switch
                  </Button>
                  {/* Edit Couple Info Button */}
                  <Dialog
                    open={showEditCoupleDialog}
                    onOpenChange={setShowEditCoupleDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs px-3 py-1 h-8"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Couple Information (v2)</DialogTitle>
                        <DialogDescription>
                          Update the couple's contact information and
                          preferences.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Bride Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-pink-900">
                            Bride Information
                          </h3>
                          <div>
                            <Label htmlFor="editBrideName">Full Name</Label>
                            <Input
                              id="editBrideName"
                              value={editCoupleInfo.brideName}
                              onChange={(e) =>
                                setEditCoupleInfo({
                                  ...editCoupleInfo,
                                  brideName: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="editBrideEmail">
                              Email
                            </Label>
                            <Input
                              id="editBrideEmail"
                              type="email"
                              value={editCoupleInfo.brideEmail}
                              onChange={(e) =>
                                setEditCoupleInfo({
                                  ...editCoupleInfo,
                                  brideEmail: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="editBridePhone">Phone</Label>
                            <Input
                              id="editBridePhone"
                              type="tel"
                              value={editCoupleInfo.bridePhone}
                              onChange={(e) =>
                                setEditCoupleInfo({
                                  ...editCoupleInfo,
                                  bridePhone: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="editBrideAddress">
                              Primary Address
                            </Label>
                            <Input
                              id="editBrideAddress"
                              value={editCoupleInfo.brideAddress || ""}
                              onChange={(e) =>
                                setEditCoupleInfo({
                                  ...editCoupleInfo,
                                  brideAddress: e.target.value,
                                })
                              }
                              placeholder="Bride's primary address"
                            />
                          </div>
                        </div>

                        {/* Groom Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-blue-900">
                            Groom Information
                          </h3>
                          <div>
                            <Label htmlFor="editGroomName">Full Name</Label>
                            <Input
                              id="editGroomName"
                              value={editCoupleInfo.groomName}
                              onChange={(e) =>
                                setEditCoupleInfo({
                                  ...editCoupleInfo,
                                  groomName: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="editGroomEmail">
                              Email
                            </Label>
                            <Input
                              id="editGroomEmail"
                              type="email"
                              value={editCoupleInfo.groomEmail}
                              onChange={(e) =>
                                setEditCoupleInfo({
                                  ...editCoupleInfo,
                                  groomEmail: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="editGroomPhone">Phone</Label>
                            <Input
                              id="editGroomPhone"
                              type="tel"
                              value={editCoupleInfo.groomPhone}
                              onChange={(e) =>
                                setEditCoupleInfo({
                                  ...editCoupleInfo,
                                  groomPhone: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="editGroomAddress">
                              Primary Address
                            </Label>
                            <Input
                              id="editGroomAddress"
                              value={editCoupleInfo.groomAddress || ""}
                              onChange={(e) =>
                                setEditCoupleInfo({
                                  ...editCoupleInfo,
                                  groomAddress: e.target.value,
                                })
                              }
                              placeholder="Groom's primary address"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="editEmergencyContact">
                            Emergency Contact
                          </Label>
                          <Input
                            id="editEmergencyContact"
                            value={editCoupleInfo.emergencyContact}
                            onChange={(e) =>
                              setEditCoupleInfo({
                                ...editCoupleInfo,
                                emergencyContact: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="editSpecialRequests">
                            Special Requests & Preferences
                          </Label>
                          <Textarea
                            id="editSpecialRequests"
                            value={editCoupleInfo.specialRequests}
                            onChange={(e) =>
                              setEditCoupleInfo({
                                ...editCoupleInfo,
                                specialRequests: e.target.value,
                              })
                            }
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowEditCoupleDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleEditCoupleInfo}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar
                    className={`ring-2 ${allCouples[activeCoupleIndex]?.colors?.brideRing ||
                      "ring-pink-100"
                      }`}
                  >
                    <AvatarImage src="/api/placeholder/40/40" />
                    <AvatarFallback
                      className={`${allCouples[activeCoupleIndex]?.colors?.bride ||
                        "bg-pink-500"
                        } text-white`}
                    >
                      {(editCoupleInfo.brideName || "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {editCoupleInfo.brideName}
                    </p>
                    <p
                      className={`text-sm ${allCouples[activeCoupleIndex]?.colors?.brideText ||
                        "text-pink-600"
                        } font-medium`}
                    >
                      Bride
                    </p>
                  </div>
                </div>
                {editCoupleInfo.brideAddress && (
                  <div className="pl-12 text-sm text-gray-600 flex items-start">
                    <MapPin
                      className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${allCouples[activeCoupleIndex]?.colors?.brideIcon ||
                        "text-pink-500"
                        }`}
                    />
                    <span>{editCoupleInfo.brideAddress}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Avatar
                    className={`ring-2 ${allCouples[activeCoupleIndex]?.colors?.groomRing ||
                      "ring-blue-100"
                      }`}
                  >
                    <AvatarImage src="/api/placeholder/40/40" />
                    <AvatarFallback
                      className={`${allCouples[activeCoupleIndex]?.colors?.groom ||
                        "bg-blue-500"
                        } text-white`}
                    >
                      {(editCoupleInfo.groomName || "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {editCoupleInfo.groomName}
                    </p>
                    <p
                      className={`text-sm ${allCouples[activeCoupleIndex]?.colors?.groomText ||
                        "text-blue-600"
                        } font-medium`}
                    >
                      Groom
                    </p>
                  </div>
                </div>
                {editCoupleInfo.groomAddress && (
                  <div className="pl-12 text-sm text-gray-600 flex items-start">
                    <MapPin
                      className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${allCouples[activeCoupleIndex]?.colors?.groomIcon ||
                        "text-blue-500"
                        }`}
                    />
                    <span>{editCoupleInfo.groomAddress}</span>
                  </div>
                )}
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <Phone className="w-4 h-4 mr-2" />
                    {editCoupleInfo.bridePhone}
                  </div>
                  <div className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <Mail className="w-4 h-4 mr-2" />
                    {editCoupleInfo.brideEmail}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center text-blue-900">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Officiant
                </CardTitle>
                {/* Officiant Dashboard Button */}
                <Button
                  size="sm"
                  onClick={() => setShowDashboardDialog(true)}
                  className="bg-black hover:bg-gray-800 text-white text-xs px-3 py-1 h-8"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Dashboard
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12 ring-2 ring-blue-100">
                    <AvatarImage src="/api/placeholder/48/48" />
                    <AvatarFallback className="bg-blue-500 text-white">
                      PM
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Pastor Michael Adams
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                      Licensed Officiant
                    </p>
                    <div className="flex items-center mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <Badge
                        variant="secondary"
                        className="text-xs ml-1 bg-yellow-50 text-yellow-700"
                      >
                        5 Years Experience
                      </Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <Phone className="w-4 h-4 mr-2" />
                    (555) 987-6543
                  </div>
                  <div className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <Mail className="w-4 h-4 mr-2" />
                    pastor.michael@ordainedpro.com
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center text-blue-900">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Wedding Details
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {/* Ceremony Details Form Button */}
                  <Button
                    size="sm"
                    onClick={() => window.open("/ceremony-details", "_blank")}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 h-8"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Form
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenEditWeddingDialog}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs px-3 py-1 h-8"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">
                    {editWeddingDetails.venueName}
                  </p>
                  <p className="text-gray-600">
                    {editWeddingDetails.venueAddress}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {new Date(
                      editWeddingDetails.weddingDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-gray-600">
                    {new Date(
                      `2024-01-01 ${editWeddingDetails.startTime}`
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    -{" "}
                    {new Date(
                      `2024-01-01 ${editWeddingDetails.endTime}`
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Expected Guests</p>
                  <p className="text-gray-600">
                    {editWeddingDetails.expectedGuests} people
                  </p>
                </div>
                {editWeddingDetails.officiantNotes && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      Officiant Notes
                    </p>
                    <p className="text-gray-600 whitespace-pre-wrap text-xs bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      {editWeddingDetails.officiantNotes}
                    </p>
                  </div>
                )}
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 w-fit shadow-md">
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.ceil(
                    (new Date(editWeddingDetails.weddingDate).getTime() -
                      new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                  )}{" "}
                  days until wedding
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs Navigation with all sections */}
        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:grid-cols-8 bg-white shadow-sm border border-blue-100">
            <TabsTrigger
              value="messages"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white relative"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Messages</span>
              {hasNewMessage && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {newMessageCount > 9 ? "9+" : newMessageCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              <span>Files</span>
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Tasks</span>
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Schedule</span>
            </TabsTrigger>
            <TabsTrigger
              value="contracts"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <FileSignature className="w-4 h-4" />
              <span>Contracts</span>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <DollarSign className="w-4 h-4" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger
              value="buildscript"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <Edit className="w-4 h-4" />
              <span>Build Script</span>
            </TabsTrigger>
            <TabsTrigger
              value="marketplace"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Scripts</span>
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-blue-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Messages with {editCoupleInfo.brideName} & {editCoupleInfo.groomName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {hasNewMessage && (
                          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {newMessageCount} new
                          </span>
                        )}
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          Auto-refresh: 30s
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            fetchCoupleMessages();
                            setHasNewMessage(false);
                            setNewMessageCount(0);
                          }}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Communicate directly with your couple. Messages are saved and can trigger email notifications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-gray-500">Loading messages...</span>
                      </div>
                    ) : coupleMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-2">No messages yet</p>
                        <p className="text-sm text-gray-400">Start a conversation with your couple below</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                        {coupleMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex space-x-3 ${message.sender === "officiant"
                              ? "justify-end"
                              : "justify-start"
                              }`}
                          >
                            {message.sender !== "officiant" && (
                              <Avatar className="ring-2 ring-pink-100">
                                <AvatarFallback className="bg-pink-500 text-white">
                                  {(editCoupleInfo.brideName?.[0] || "C")}
                                  {(editCoupleInfo.groomName?.[0] || "")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`flex-1 max-w-xs lg:max-w-md ${message.sender === "officiant" ? "order-first" : ""
                                }`}
                            >
                              <div
                                className={`p-4 rounded-xl shadow-sm ${message.sender === "officiant"
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto"
                                  : "bg-white border border-gray-200 text-gray-900"
                                  }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {message.content}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 mt-2 flex items-center">
                                <span className="font-medium">
                                  {message.sender === "officiant"
                                    ? (officiantProfile.name || "You")
                                    : (message.sender_name || "Couple")}
                                </span>
                                <span className="mx-1">•</span>
                                <span>
                                  {new Date(message.created_at).toLocaleString()}
                                </span>
                                {message.sender === "officiant" && message.email_sent && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <span className="text-green-600">Email sent</span>
                                  </>
                                )}
                              </p>
                            </div>
                            {message.sender === "officiant" && (
                              <Avatar className="ring-2 ring-blue-100">
                                <AvatarImage src={officiantProfile.headshot} />
                                <AvatarFallback className="bg-blue-500 text-white">
                                  {officiantProfile.name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("") || "ME"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Attachments Display */}
                    {messageAttachments.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                          Attachments ({messageAttachments.length})
                        </h4>
                        <div className="space-y-2">
                          {messageAttachments.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-2 bg-white rounded text-sm border border-blue-100"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {getFileIcon(file.type)}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleMessageAttachmentRemoved(file.id)
                                }
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Type your message to the couple..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && sendCoupleMessage(true)
                          }
                          className="flex-1 border-blue-200 focus:border-blue-500"
                        />
                        <FileUpload
                          mode="compact"
                          onFilesUploaded={handleMessageAttachmentsUploaded}
                          onFileRemoved={handleMessageAttachmentRemoved}
                          maxFiles={3}
                          maxFileSize={5}
                          existingFiles={messageAttachments}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          onClick={() => sendCoupleMessage(true)}
                          disabled={(!newMessage.trim() && messageAttachments.length === 0) || sendingEmail}
                        >
                          {sendingEmail ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>
                      {(editCoupleInfo.brideEmail || editCoupleInfo.groomEmail) && (
                        <p className="text-xs text-gray-500 text-center">
                          Email will be sent to:{" "}
                          {editCoupleInfo.brideEmail && editCoupleInfo.groomEmail
                            ? `${editCoupleInfo.brideEmail} & ${editCoupleInfo.groomEmail}`
                            : editCoupleInfo.brideEmail || editCoupleInfo.groomEmail}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-blue-900">
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6">
                    <Button
                      className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        // Reset selections and open dialog
                        setSelectedItemsToShare({ scripts: [], files: [] });
                        setSharingScript(null);
                        setShareScriptForm({
                          to: "both",
                          customEmail: "",
                          subject: "Wedding Documents for Review",
                          body: `Dear ${(editCoupleInfo.brideName || "").split(" ")[0]
                            } and ${(editCoupleInfo.groomName || "").split(" ")[0]
                            },\n\nI'm sharing some documents for your review. Please take a look and let me know if you have any questions or feedback.\n\nBest regards,\nPastor Michael Adams`,
                          includeNotes: true,
                        });
                        setShowShareScriptDialog(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Share Script Draft
                    </Button>
                    <Button
                      className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => setShowScheduleMeetingDialog(true)}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Schedule Meeting
                    </Button>
                    <Button
                      className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => setShowAddTaskDialog(true)}
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>

                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 text-blue-900">
                        Next Meeting
                      </h4>
                      <div className="space-y-2">
                        {meetings
                          .filter(
                            (meeting) => new Date(meeting.date) >= new Date()
                          )
                          .slice(0, 1)
                          .map((meeting) => (
                            <div
                              key={meeting.id}
                              className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-sm border border-blue-100"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-blue-900">
                                  {meeting.subject}
                                </p>
                                <Badge
                                  className={getMeetingStatusColor(
                                    meeting.status
                                  )}
                                >
                                  {getMeetingStatusIcon(meeting.status)}
                                </Badge>
                              </div>
                              <p className="text-blue-700">
                                {new Date(meeting.date).toLocaleDateString()} at{" "}
                                {meeting.time}
                              </p>
                              <p className="text-blue-600 text-xs mt-1">
                                {getMeetingTypeIcon(meeting.meetingType)}{" "}
                                {meeting.meetingType}
                              </p>
                            </div>
                          ))}
                        {meetings.filter(
                          (meeting) => new Date(meeting.date) >= new Date()
                        ).length === 0 && (
                            <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200 text-center">
                              <p className="text-gray-500">
                                No upcoming meetings
                              </p>
                              <Button
                                size="sm"
                                className="mt-2 bg-blue-500 hover:bg-blue-600"
                                onClick={() => setShowScheduleMeetingDialog(true)}
                              >
                                Schedule One
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Other tabs content would go here - files, tasks, calendar, contracts, payments, marketplace */}
          {/* For brevity, I'm including just one more tab as an example */}
          {/* Files Tab */}
          <TabsContent value="files">
            <div className="space-y-6">
              {/* AI Generated Scripts Section */}
              <Card
                className="border-green-100 shadow-md bg-gradient-to-r from-green-50 to-emerald-50"
                key="1"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      <CardTitle className="text-green-900">
                        Mr. Script Generated Wedding Scripts
                      </CardTitle>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {generatedScripts.length} scripts
                    </Badge>
                  </div>
                  <CardDescription className="text-green-700">
                    Custom ceremony scripts created by Mr. Script for Sarah
                    Johnson & David Chen
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  {generatedScripts.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                      <p className="text-green-700 mb-2">
                        No Mr. Script scripts generated yet
                      </p>
                      <p className="text-sm text-green-600">
                        Visit the Build Script tab to create your first ceremony
                        script with Mr. Script
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {generatedScripts.map((script) => (
                        <div
                          key={script.id}
                          className="border border-green-200 rounded-xl p-4 bg-white hover:bg-green-50 transition-colors group"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 mb-1">
                                    {script.title}
                                  </p>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-green-200 text-green-700"
                                    >
                                      {script.type} Style
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-blue-200 text-blue-700"
                                    >
                                      Mr. Script
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    Created: {script.createdDate}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {script.content.length} characters
                                  </p>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-600 hover:bg-green-100"
                                    title="View script"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewScript(script);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-600 hover:bg-blue-100"
                                    title="Edit script"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditScript(script);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-600 hover:bg-gray-100"
                                    title="Download"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadScript(script);
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* File Upload Section */}
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-blue-900">
                    Upload Documents
                  </CardTitle>
                  <CardDescription>
                    Share ceremony scripts, photos, music lists, and other
                    important documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <FileUpload
                    mode="full"
                    onFilesUploaded={handleFilesUploaded}
                    onFileRemoved={handleFileRemoved}
                    maxFiles={10}
                    maxFileSize={25}
                    acceptedFileTypes={[
                      ".pdf",
                      ".doc",
                      ".docx",
                      ".txt",
                      ".jpg",
                      ".jpeg",
                      ".png",
                      ".gif",
                      ".mp3",
                      ".mp4",
                      ".mov",
                      ".zip",
                      ".ppt",
                      ".pptx",
                      ".xls",
                      ".xlsx",
                    ]}
                    existingFiles={uploadedFiles}
                  />
                </CardContent>
              </Card>

              {/* Existing Files */}
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-blue-900">
                        Uploaded Documents
                      </CardTitle>
                      <CardDescription>
                        All ceremony-related files and documents ({files.length}{" "}
                        files)
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-blue-200 text-blue-700"
                    >
                      {files.length} files
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {files.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No files uploaded yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center space-x-3 p-4 border border-blue-100 rounded-xl bg-white hover:bg-blue-50 group"
                        >
                          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {file.size} • {file.uploadedBy}
                            </p>
                            <p className="text-xs text-gray-400">{file.date}</p>
                          </div>
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(file.url, "_blank")}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => handleFileRemoved(file.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-blue-900">
                      Wedding Preparation Checklist
                    </CardTitle>
                    <CardDescription>
                      Track progress and stay organized for the big day
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Select
                      value={taskFilter}
                      onValueChange={(value: string) => setTaskFilter(value)}
                    >
                      <SelectTrigger className="w-48 border-blue-200">
                        <SelectValue placeholder="Filter tasks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="high-priority">
                          High Priority
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={() => setShowAddTaskDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {getFilteredTasks().map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-xl transition-all ${task.completed
                        ? "bg-green-50 border-green-200 shadow-sm"
                        : "bg-white border-blue-100 hover:border-blue-200"
                        }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* ✅ Completion Checkbox */}
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors mt-1 ${task.completed
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 hover:border-blue-400"
                            }`}
                          onClick={() => toggleTaskCompletion(task.id)}
                        >
                          {task.completed && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>

                        {/* ✅ Task Info */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p
                              className={`font-medium ${task.completed
                                ? "text-green-800 line-through"
                                : "text-gray-900"
                                }`}
                            >
                              {task.title}
                            </p>

                            {/* ✅ Task Priority Badge */}
                            <Badge
                              variant="outline"
                              className={`${getPriorityColor(
                                task.priority
                              )} border`}
                            >
                              {getPriorityIcon(task.priority)}{" "}
                              {task.priority?.charAt(0).toUpperCase() +
                                task.priority?.slice(1) || "Medium"}
                            </Badge>
                          </div>

                          {/* ✅ Description */}
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {task.description}
                            </p>
                          )}

                          {/* ✅ Due Date */}
                          {task.due_date && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-3 h-3 mr-1" />
                              Due:{" "}
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* ✅ Empty State */}
                  {getFilteredTasks().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks found for the selected filter.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>{" "}
            */
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <div className="space-y-6">
              {/* Top Section: Meetings, Tasks, and Events */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-blue-100 shadow-md flex flex-col min-h-[350px]">
                  <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50">
                    <CardTitle className="text-blue-900">
                      Scheduled Meetings
                    </CardTitle>
                    <CardDescription>
                      Meetings with calendar invite status tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="space-y-4 flex-1">
                      {meetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="border border-blue-100 rounded-xl p-4 bg-gradient-to-r from-sky-50 to-blue-50"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              {meeting.subject}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <Badge
                                className={getMeetingStatusColor(
                                  meeting.status
                                )}
                              >
                                {getMeetingStatusIcon(meeting.status)}{" "}
                                {meeting.status.charAt(0).toUpperCase() +
                                  meeting.status.slice(1)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-blue-200 text-blue-700"
                              >
                                {new Date(meeting.date).toLocaleDateString()}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditMeeting(meeting)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1"
                                title="Edit meeting"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMeeting(meeting.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                                title="Delete meeting"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-blue-500" />
                              {meeting.time} ({meeting.duration} minutes)
                            </div>
                            <div className="flex items-center">
                              <span className="text-lg mr-1">
                                {getMeetingTypeIcon(meeting.meetingType)}
                              </span>
                              {meeting.meetingType === "in-person"
                                ? meeting.location
                                : meeting.meetingType.charAt(0).toUpperCase() +
                                meeting.meetingType.slice(1)}
                            </div>
                            {meeting.status === "pending" && (
                              <div className="flex items-center text-orange-600">
                                <Bell className="w-4 h-4 mr-2" />
                                Response due:{" "}
                                {new Date(
                                  meeting.responseDeadline
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          {meeting.body && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {meeting.body}
                            </p>
                          )}
                        </div>
                      ))}
                      {meetings.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No meetings scheduled yet</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-auto pt-6">
                      <Button
                        className="w-full bg-blue-500 hover:bg-blue-600"
                        onClick={() => setShowScheduleMeetingDialog(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule New Meeting
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-100 shadow-md flex flex-col min-h-[350px]">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="text-purple-900">
                      Wedding Events
                    </CardTitle>
                    <CardDescription>
                      Rehearsal and ceremony schedule
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="space-y-4 flex-1">
                      {upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="border border-purple-100 rounded-xl p-4 bg-gradient-to-r from-purple-50 to-pink-50"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              {event.subject}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className="border-purple-200 text-purple-700"
                              >
                                {new Date(event.date).toLocaleDateString()}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteWeddingEvent(event.id)
                                }
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-purple-500" />
                              {event.time}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                              {event.location || "No location"}
                            </div>
                          </div>

                          {event.details && (
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <p className="font-medium text-purple-900 mb-2 flex items-center">
                                <FileText className="w-4 h-4 mr-1" /> Additional
                                Details:
                              </p>
                              <p className="text-gray-700 bg-white/50 p-3 rounded border border-purple-100 leading-relaxed">
                                {event.details}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                      {upcomingEvents.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No wedding events scheduled yet</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-auto pt-6">
                      <Button
                        className="w-full bg-purple-500 hover:bg-purple-600"
                        onClick={() => setShowAddEventDialog(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Wedding Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <div>
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-blue-900">
                        Contract Management
                      </CardTitle>
                      <CardDescription>
                        Create, send, and track contracts with your couples
                      </CardDescription>
                    </div>
                    <Button
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={() => setShowContractUploadDialog(true)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Contract
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="border border-blue-100 rounded-xl p-4 bg-white hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${contract.status === "signed"
                                ? "bg-green-100"
                                : contract.status === "pending"
                                  ? "bg-yellow-100"
                                  : "bg-gray-100"
                                }`}
                            >
                              <FileSignature
                                className={`w-6 h-6 ${contract.status === "signed"
                                  ? "text-green-600"
                                  : contract.status === "pending"
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                                  }`}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {contract.name}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <Badge
                                  variant={
                                    contract.status === "signed"
                                      ? "default"
                                      : contract.status === "pending"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className={
                                    contract.status === "signed"
                                      ? "bg-green-100 text-green-800"
                                      : contract.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {contract.status === "signed"
                                    ? "Signed"
                                    : contract.status === "pending"
                                      ? "Pending Signature"
                                      : "Draft"}
                                </Badge>
                                <p className="text-sm text-gray-500">
                                  {contract.status === "signed" &&
                                    `Signed by ${contract.signedBy} on ${contract.signedDate}`}
                                  {contract.status === "pending" &&
                                    `Sent on ${contract.sentDate}`}
                                  {contract.status === "draft" &&
                                    `Created on ${contract.createdDate}`}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() =>
                                handleContractAction(contract.id, "view")
                              }
                              title="View contract"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() =>
                                handleContractAction(contract.id, "delete")
                              }
                              title="Delete contract"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() =>
                                handleContractAction(contract.id, "send")
                              }
                              title="Send contract via messaging"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* Payment Overview */}
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CardTitle className="text-blue-900">
                            Payment Overview
                          </CardTitle>
                          {paymentInfo.balance === 0 && (
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md">
                              <Check className="w-3 h-3 mr-1" />
                              Paid in Full
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInvoiceDialog(true)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Invoice
                          </Button>
                          {paymentInfo.balance > 0 && (
                            <Button
                              size="sm"
                              onClick={() => setShowRecordPaymentDialog(true)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Record Payment
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        Track ceremony payments and outstanding balances
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                Total Amount
                              </p>
                              <p className="text-2xl font-bold text-green-900">
                                ${paymentInfo.totalAmount}
                              </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-800">
                                Deposit Paid
                              </p>
                              <p className="text-2xl font-bold text-blue-900">
                                ${paymentInfo.depositPaid}
                              </p>
                            </div>
                            <CreditCard className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                        <div
                          className={`rounded-xl p-4 border ${paymentInfo.balance > 0
                            ? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
                            : "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p
                                className={`text-sm font-medium ${paymentInfo.balance > 0
                                  ? "text-orange-800"
                                  : "text-green-800"
                                  }`}
                              >
                                Balance Due
                              </p>
                              <p
                                className={`text-2xl font-bold ${paymentInfo.balance > 0
                                  ? "text-orange-900"
                                  : "text-green-900"
                                  }`}
                              >
                                ${paymentInfo.balance}
                              </p>
                            </div>
                            {paymentInfo.balance > 0 ? (
                              <AlertCircle className="w-8 h-8 text-orange-600" />
                            ) : (
                              <Check className="w-8 h-8 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div>
                          <p className="font-semibold text-blue-900">
                            Final Payment Due
                          </p>
                          <p className="text-sm text-blue-700">
                            {paymentInfo.finalPaymentDue}
                          </p>
                        </div>
                        {paymentInfo.balance > 0 && (
                          <Button
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={handleOpenPaymentReminderDialog}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Send Payment Reminder
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment History */}
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-blue-900">
                        Payment History
                      </CardTitle>
                      <CardDescription>
                        Track all payments and transactions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {paymentHistory.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-4 border border-blue-100 rounded-xl bg-white"
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${payment.status === "completed"
                                  ? "bg-green-100"
                                  : "bg-orange-100"
                                  }`}
                              >
                                {payment.status === "completed" ? (
                                  <Receipt className="w-6 h-6 text-green-600" />
                                ) : (
                                  <Clock className="w-6 h-6 text-orange-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {payment.type}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {payment.date} • {payment.method}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ${payment.amount}
                              </p>
                              <Badge
                                variant={
                                  payment.status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  payment.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                                }
                              >
                                {payment.status === "completed"
                                  ? "Completed"
                                  : "Pending"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-blue-900">
                      Payment Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6">
                    <Button
                      className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={handleOpenInvoiceDialog}
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </Button>
                    <Button
                      className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={handleOpenPaymentReminderDialog}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Payment Reminder
                    </Button>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 text-blue-900">
                        Payment Status
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deposit Status:</span>
                          <Badge className="bg-green-100 text-green-800">
                            Paid
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Final Payment:</span>
                          <Badge className="bg-orange-100 text-orange-800">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-blue-900">
                      Earnings Overview
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Your earnings from couple services and marketplace scripts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Year to Date Earnings */}
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Year to Date (YTD)
                            </p>
                            <p className="text-2xl font-bold text-green-900">
                              $
                              {(() => {
                                // Calculate total YTD earnings from ALL couples' completed payments
                                const currentYear = new Date().getFullYear();

                                // Get earnings from completed payments across all couples
                                const coupleEarnings = allCouples
                                  .flatMap(
                                    (couple) => couple.paymentHistory || []
                                  )
                                  .filter((p) => p.status === "completed")
                                  .filter(
                                    (p) =>
                                      new Date(p.date).getFullYear() ===
                                      currentYear
                                  )
                                  .reduce((sum, p) => sum + p.amount, 0);

                                // Get earnings from scripts sold in marketplace
                                const scriptEarnings = myScripts.reduce(
                                  (sum, script) => sum + (script.earnings || 0),
                                  0
                                );

                                return (
                                  coupleEarnings + scriptEarnings
                                ).toLocaleString();
                              })()}
                            </p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-green-200">
                          <div>
                            <p className="text-xs text-green-700">
                              From Couples
                            </p>
                            <p className="text-lg font-semibold text-green-900">
                              $
                              {(() => {
                                const currentYear = new Date().getFullYear();
                                return allCouples
                                  .flatMap(
                                    (couple) => couple.paymentHistory || []
                                  )
                                  .filter((p) => p.status === "completed")
                                  .filter(
                                    (p) =>
                                      new Date(p.date).getFullYear() ===
                                      currentYear
                                  )
                                  .reduce((sum, p) => sum + p.amount, 0)
                                  .toLocaleString();
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-green-700">
                              From Scripts
                            </p>
                            <p className="text-lg font-semibold text-green-900">
                              $
                              {(() => {
                                return myScripts
                                  .reduce(
                                    (sum, script) =>
                                      sum + (script.earnings || 0),
                                    0
                                  )
                                  .toLocaleString();
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Month to Date Earnings */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Month to Date (MTD)
                            </p>
                            <p className="text-2xl font-bold text-blue-900">
                              $
                              {(() => {
                                const currentDate = new Date();
                                const currentMonth = currentDate.getMonth();
                                const currentYear = currentDate.getFullYear();

                                // Count completed payments from current month across all couples
                                const coupleMonthlyEarnings = allCouples
                                  .flatMap(
                                    (couple) => couple.paymentHistory || []
                                  )
                                  .filter((p) => p.status === "completed")
                                  .filter((p) => {
                                    const paymentDate = new Date(p.date);
                                    return (
                                      paymentDate.getMonth() === currentMonth &&
                                      paymentDate.getFullYear() === currentYear
                                    );
                                  })
                                  .reduce((sum, p) => sum + p.amount, 0);

                                return coupleMonthlyEarnings.toLocaleString();
                              })()}
                            </p>
                          </div>
                          <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-blue-200">
                          <div>
                            <p className="text-xs text-blue-700">
                              From Couples
                            </p>
                            <p className="text-lg font-semibold text-blue-900">
                              $
                              {(() => {
                                const currentDate = new Date();
                                const currentMonth = currentDate.getMonth();
                                const currentYear = currentDate.getFullYear();

                                return allCouples
                                  .flatMap(
                                    (couple) => couple.paymentHistory || []
                                  )
                                  .filter((p) => p.status === "completed")
                                  .filter((p) => {
                                    const paymentDate = new Date(p.date);
                                    return (
                                      paymentDate.getMonth() === currentMonth &&
                                      paymentDate.getFullYear() === currentYear
                                    );
                                  })
                                  .reduce((sum, p) => sum + p.amount, 0)
                                  .toLocaleString();
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-700">
                              From Scripts
                            </p>
                            <p className="text-lg font-semibold text-blue-900">
                              $0
                            </p>
                            <p className="text-[10px] text-blue-600 mt-0.5">
                              This month
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                          {new Date().toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Pending Payments */}
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-amber-800">
                              Pending Payments of All Couples
                            </p>
                            <p className="text-2xl font-bold text-amber-900">
                              $
                              {(() => {
                                return allCouples
                                  .flatMap(
                                    (couple) => couple.paymentHistory || []
                                  )
                                  .filter((p) => p.status === "pending")
                                  .reduce((sum, p) => sum + p.amount, 0)
                                  .toLocaleString();
                              })()}
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              {
                                allCouples
                                  .flatMap(
                                    (couple) => couple.paymentHistory || []
                                  )
                                  .filter((p) => p.status === "pending").length
                              }{" "}
                              invoice(s) pending
                            </p>
                          </div>
                          <Clock className="w-8 h-8 text-amber-600" />
                        </div>
                        {/* View Pending Payments Button */}
                        {(() => {
                          const couplesWithPending = allCouples.filter(
                            (couple) => (couple.paymentInfo?.balance || 0) > 0
                          );
                          return (
                            couplesWithPending.length > 0 && (
                              <Button
                                onClick={() =>
                                  setShowPendingPaymentsDialog(true)
                                }
                                className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                                size="sm"
                              >
                                <Receipt className="w-4 h-4 mr-2" />
                                View Pending Payments (
                                {couplesWithPending.length}{" "}
                                {couplesWithPending.length === 1
                                  ? "Couple"
                                  : "Couples"}
                                )
                              </Button>
                            )
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Build Wedding Script Tab */}
          <TabsContent value="buildscript">
            <div className="space-y-6">
              {/* Script Writing Mode Toggle */}
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <CardTitle className="text-white flex items-center">
                    <FileEdit className="w-5 h-5 mr-2" />
                    Script Writing Mode
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Choose your approach to creating the ceremony script
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex space-x-3 mb-6">
                    <Button
                      variant={scriptMode === "guided" ? "default" : "outline"}
                      onClick={() => handleModeSelect("guided")}
                      className={`${scriptMode === "guided"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                    >
                      Guided Mode
                    </Button>
                    <Button
                      variant={scriptMode === "expert" ? "default" : "outline"}
                      onClick={() => handleModeSelect("expert")}
                      className={`${scriptMode === "expert"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border-blue-200 text-blue-700 hover:bg-blue-50"
                        }`}
                    >
                      Freelance / Expert Mode
                    </Button>
                  </div>

                  {/* Mode Descriptions */}
                  {scriptMode === "guided" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-green-900">
                          AI-Guided Script Creation
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetChatbot}
                          className="text-green-700 border-green-300 hover:bg-green-100"
                        >
                          Reset Chat
                        </Button>
                      </div>

                      {/* Progress Bar - Shows Quick Setup OR Questionnaire progress */}
                      {(() => {
                        if (questionnaireStarted) {
                          // Show questionnaire progress
                          const answeredQuestions = Object.keys(questionnaireResponses).length;
                          const totalQuestions = CEREMONY_QUESTIONNAIRE.length;
                          const progressPercent = Math.round((answeredQuestions / totalQuestions) * 100);

                          return (
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-green-900">
                                  📝 Questionnaire Progress
                                </span>
                                <span className="text-sm font-semibold text-green-700">
                                  {answeredQuestions} / {totalQuestions} questions
                                </span>
                              </div>
                              <div className="w-full bg-white rounded-full h-3 border border-green-200 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                  style={{ width: `${progressPercent}%` }}
                                >
                                  {answeredQuestions > 0 && (
                                    <span className="text-xs font-bold text-white drop-shadow">
                                      {progressPercent}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              {answeredQuestions === totalQuestions && (
                                <p className="text-xs text-green-700 mt-2 font-medium flex items-center">
                                  <Check className="w-4 h-4 mr-1" />
                                  All questions answered! Ready to generate your personalized script.
                                </p>
                              )}
                            </div>
                          );
                        }

                        // Show Quick Setup progress
                        const completedSelections = [
                          selectedCeremonyStyle,
                          selectedCeremonyLength,
                          selectedUnityCeremony,
                          selectedVowsType,
                          selectedReadingStyle,
                        ].filter(Boolean).length;
                        const totalSelections = 5;
                        const progressPercent = Math.round((completedSelections / totalSelections) * 100);

                        return (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-900">
                                Quick Setup Progress
                              </span>
                              <span className="text-sm font-semibold text-green-700">
                                {completedSelections} / {totalSelections} selections
                              </span>
                            </div>
                            <div className="w-full bg-white rounded-full h-3 border border-green-200 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                style={{ width: `${progressPercent}%` }}
                              >
                                {completedSelections > 0 && (
                                  <span className="text-xs font-bold text-white drop-shadow">
                                    {progressPercent}%
                                  </span>
                                )}
                              </div>
                            </div>
                            {completedSelections === totalSelections && (
                              <p className="text-xs text-green-700 mt-2 font-medium flex items-center">
                                <Check className="w-4 h-4 mr-1" />
                                Quick Setup complete! Start the questionnaire for a personalized script.
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Ceremony Configuration */}
                      <div className="mb-6 p-4 bg-white border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-3">
                          Quick Setup
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-1">
                              Ceremony Style
                            </label>
                            <select
                              className="w-full p-2 border border-green-200 rounded text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              value={selectedCeremonyStyle}
                              onChange={(e) =>
                                setSelectedCeremonyStyle(e.target.value)
                              }
                            >
                              <option value="">Select a style...</option>
                              <option value="Traditional">Traditional</option>
                              <option value="Modern">Modern</option>
                              <option value="Religious">Religious</option>
                              <option value="Secular">Secular</option>
                              <option value="Interfaith">Interfaith</option>
                              <option value="Custom">Custom</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-1">
                              Ceremony Length
                            </label>
                            <select
                              className="w-full p-2 border border-green-200 rounded text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              value={selectedCeremonyLength}
                              onChange={(e) =>
                                setSelectedCeremonyLength(e.target.value)
                              }
                            >
                              <option value="">Select duration...</option>
                              <option value="15-20 minutes">
                                15-20 minutes
                              </option>
                              <option value="20-30 minutes">
                                20-30 minutes
                              </option>
                              <option value="30-45 minutes">
                                30-45 minutes
                              </option>
                              <option value="45+ minutes">45+ minutes</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-1">
                              Unity Ceremony
                            </label>
                            <select
                              className="w-full p-2 border border-green-200 rounded text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              value={selectedUnityCeremony}
                              onChange={(e) =>
                                setSelectedUnityCeremony(e.target.value)
                              }
                            >
                              <option value="">Select unity ceremony...</option>
                              <option value="None">None</option>
                              <option value="Handfasting">Handfasting</option>
                              <option value="Unity Candle">Unity Candle</option>
                              <option value="Sand Ceremony">
                                Sand Ceremony
                              </option>
                              <option value="Wine/Jar Ceremony">
                                Wine/Jar Ceremony
                              </option>
                              <option value="Unity Painting">
                                Unity Painting
                              </option>
                              <option value="Ring Warming">Ring Warming</option>
                              <option value="Cord of Three Strands">
                                Cord of Three Strands
                              </option>
                              <option value="Tree Planting">
                                Tree Planting
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-1">
                              Vows
                            </label>
                            <select
                              className="w-full p-2 border border-green-200 rounded text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              value={selectedVowsType}
                              onChange={(e) =>
                                setSelectedVowsType(e.target.value)
                              }
                            >
                              <option value="">Select vow style...</option>
                              <option value="Traditional">Traditional</option>
                              <option value="Personal">Personal</option>
                              <option value="Modern">Modern</option>
                              <option value="Personal and Modern">
                                Personal and Modern
                              </option>
                              <option value="Repeating Vows">
                                Repeating Vows
                              </option>
                              <option value="Community Vows">
                                Community Vows
                              </option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-green-900 mb-1">
                              Reading Style (for longer ceremonies)
                            </label>
                            <select
                              className="w-full p-2 border border-green-200 rounded text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              value={selectedReadingStyle}
                              onChange={(e) =>
                                setSelectedReadingStyle(e.target.value)
                              }
                            >
                              {READING_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={handleGenerateRequest}
                            disabled={
                              !selectedCeremonyStyle || !selectedCeremonyLength
                            }
                            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            ⚡ Quick Generate (Basic Script)
                          </Button>

                          <Button
                            onClick={startQuestionnaire}
                            disabled={questionnaireStarted}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            💕 Start Personalized Questionnaire
                          </Button>

                          <p className="text-xs text-gray-500 text-center">
                            Quick Generate uses basic settings. The questionnaire creates a fully personalized script like professional officiants write.
                          </p>
                        </div>

                        {selectedCeremonyStyle && selectedCeremonyLength && (
                          <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-800">
                            <strong>Selected:</strong> {selectedCeremonyStyle}{" "}
                            ceremony, {selectedCeremonyLength} duration
                            {selectedUnityCeremony &&
                              selectedUnityCeremony !== "None" && (
                                <span>
                                  , {selectedUnityCeremony} unity ceremony
                                </span>
                              )}
                            {selectedVowsType && (
                              <span>, {selectedVowsType} vows</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Chatbot Interface */}
                      <div className="bg-white border border-green-200 rounded-lg">
                        {/* Chat Messages */}
                        <div
                          className="h-96 overflow-y-auto p-4 space-y-4"
                          ref={chatMessagesRef}
                        >
                          {chatMessages.map((message, msgIndex) => (
                            <div
                              key={message.id}
                              className={`flex flex-col ${message.type === "user"
                                ? "items-end"
                                : "items-start"
                                }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === "user"
                                  ? "bg-green-600 text-white"
                                  : message.isRefineQuestion
                                    ? "bg-blue-50 text-gray-900 border border-blue-200"
                                    : "bg-gray-100 text-gray-900"
                                  }`}
                              >
                                <div className="whitespace-pre-wrap text-sm">
                                  {message.content}
                                </div>
                                <div
                                  className={`text-xs mt-1 ${message.type === "user"
                                    ? "text-green-100"
                                    : "text-gray-500"
                                    }`}
                                >
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                              {/* Refinement Question Options */}
                              {message.isRefineQuestion &&
                               message.refineQuestionData &&
                               msgIndex === chatMessages.length - 1 &&
                               !isTyping && (
                                <div className="mt-2 flex flex-wrap gap-2 max-w-md">
                                  {message.refineQuestionData.type === "multiple-choice" ? (
                                    message.refineQuestionData.options.map((option) => (
                                      <Button
                                        key={option}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRefineResponse(
                                          message.refineQuestionData!.questionId,
                                          option,
                                          message.refineQuestionData!.questionIndex
                                        )}
                                        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                                      >
                                        {option}
                                      </Button>
                                    ))
                                  ) : (
                                    <div className="w-full">
                                      <Input
                                        placeholder="Type your response..."
                                        className="text-sm border-blue-300"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                            handleRefineResponse(
                                              message.refineQuestionData!.questionId,
                                              e.currentTarget.value.trim(),
                                              message.refineQuestionData!.questionIndex
                                            );
                                            e.currentTarget.value = "";
                                          }
                                        }}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Press Enter to submit</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Follow-up Question Options */}
                              {message.isFollowUpQuestion &&
                               message.followUpData &&
                               msgIndex === chatMessages.length - 1 &&
                               !isTyping && (
                                <div className="mt-2 space-y-2 max-w-md">
                                  {message.followUpData.options.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {message.followUpData.options.map((option) => (
                                        <Button
                                          key={option}
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleFollowUpResponse(option)}
                                          className="text-xs border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400"
                                        >
                                          {option}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                  {message.followUpData.allowCustomInput && (
                                    <div className="w-full">
                                      <Input
                                        placeholder="Or type your own response..."
                                        className="text-sm border-purple-300"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                            handleFollowUpResponse(e.currentTarget.value.trim());
                                            e.currentTarget.value = "";
                                          }
                                        }}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Press Enter to submit your custom response</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Typing Indicator */}
                          {isTyping && (
                            <div className="flex justify-start">
                              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                                <div className="flex items-center space-x-1">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div
                                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                      style={{ animationDelay: "0.1s" }}
                                    ></div>
                                    <div
                                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                      style={{ animationDelay: "0.2s" }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500 ml-2">
                                    Mr. Script is typing...
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Quick Response Options */}
                        {currentQuestionIndex < GUIDED_QUESTIONS.length &&
                          GUIDED_QUESTIONS[currentQuestionIndex]?.type ===
                          "multiple-choice" &&
                          !isTyping && (
                            <div className="border-t border-gray-200 p-3">
                              <div className="flex flex-wrap gap-2">
                                {GUIDED_QUESTIONS[
                                  currentQuestionIndex
                                ].options?.map((option) => (
                                  <Button
                                    key={option}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickResponse(option)}
                                    className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                                  >
                                    {option}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Chat Input - Optimized component for real-time typing */}
                        <div className="border-t border-gray-200 p-3">
                          <ChatInput
                            onSubmit={handleChatSubmit}
                            disabled={isTyping}
                            placeholder="Type your response here..."
                          />

                          {/* Script Generation Action Buttons */}
                          <div className="mt-4 pt-4 border-t-2 border-gray-200">
                            {/* Progress indicator */}
                            <div className="mb-3 text-xs text-gray-500 flex items-center justify-between">
                              <span>Questions answered: {questionsAnsweredCount}</span>
                              {questionsAnsweredCount < 5 && hasExecutedQuickGenerate && (
                                <span className="text-orange-600">Answer {5 - questionsAnsweredCount} more to unlock Refine</span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {/* Generate Initial Script - Green (requires ceremony style & length selection) */}
                              <div className="relative">
                                <Button
                                  onClick={generateAndSaveScript}
                                  disabled={
                                    !selectedCeremonyStyle ||
                                    !selectedCeremonyLength
                                  }
                                  className={`font-medium py-3 flex-col h-auto w-full transition-all duration-300 ${
                                    selectedCeremonyStyle && selectedCeremonyLength
                                      ? "bg-green-600 hover:bg-green-700 text-white"
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                  title={
                                    !selectedCeremonyStyle || !selectedCeremonyLength
                                      ? "Select ceremony style and length in Quick Setup first"
                                      : "Generate your initial ceremony script"
                                  }
                                >
                                  <FileText className="w-5 h-5 mb-1" />
                                  <span className="text-xs">
                                    Generate Initial Script
                                  </span>
                                </Button>
                                <ChevronRight className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-900 z-10" />
                              </div>

                              {/* Refine Script - Blue (requires script generated AND 5 questions answered) */}
                              <div className="relative">
                                <Button
                                  onClick={startRefineScript}
                                  disabled={!hasExecutedQuickGenerate || questionsAnsweredCount < 5 || isRefining}
                                  className={`font-medium py-3 flex-col h-auto w-full transition-all duration-300 ${
                                    hasExecutedQuickGenerate && questionsAnsweredCount >= 5 && !isRefining
                                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                  title={
                                    !hasExecutedQuickGenerate
                                      ? "Generate initial script first"
                                      : questionsAnsweredCount < 5
                                        ? `Answer ${5 - questionsAnsweredCount} more questions to unlock refinement`
                                        : isRefining
                                          ? "Refining in progress..."
                                          : "Add unity ceremonies, religious elements, or customize your script"
                                  }
                                >
                                  <Edit className="w-5 h-5 mb-1" />
                                  <span className="text-xs">
                                    {isRefining ? "Refining..." : "Refine Script"}
                                  </span>
                                </Button>
                                <ChevronRight className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-900 z-10" />
                              </div>

                              {/* Generate Final Script - Pink (requires refine to be completed) */}
                              <Button
                                onClick={handleSendToEditor}
                                disabled={!refineCompleted}
                                className={`font-medium py-3 flex-col h-auto transition-all duration-300 ${
                                  refineCompleted
                                    ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                                title={
                                  !refineCompleted
                                    ? "Complete the Refine Script process first"
                                    : "Generate final script and open in editor"
                                }
                              >
                                <FileEdit className="w-5 h-5 mb-1" />
                                <span className="text-xs">
                                  Generate Final Script
                                </span>
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                              {!selectedCeremonyStyle || !selectedCeremonyLength
                                ? "Step 1: Select ceremony style and length in Quick Setup above"
                                : !hasExecutedQuickGenerate
                                  ? "Step 1: Click Generate Initial Script to create your ceremony"
                                  : questionsAnsweredCount < 5
                                    ? `Step 2: Answer ${5 - questionsAnsweredCount} more questions to unlock Refine Script`
                                    : isRefining
                                      ? "Refining your script with requested changes..."
                                      : isRefineMode
                                        ? "Answer the refinement questions to customize your script"
                                        : !refineCompleted
                                          ? "Step 3: Click Refine Script to customize your ceremony"
                                          : "Step 4: Click Generate Final Script to view and edit your ceremony!"}
                            </p>

                            {/* Segment Regeneration Buttons - Show when script is generated */}
                            {hasGeneratedScript && scriptSegments.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  🔄 Regenerate Individual Sections
                                </p>
                                <p className="text-xs text-gray-500 mb-3">
                                  Click any section to regenerate just that part with custom instructions
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                  {SEGMENT_NAMES.map((name, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openSegmentRegenerationDialog(index)}
                                      disabled={regeneratingSegment !== null}
                                      className={`justify-start text-left h-auto py-2 px-3 ${
                                        regeneratingSegment === index
                                          ? "bg-blue-50 border-blue-300 animate-pulse"
                                          : "hover:bg-gray-50 border-gray-200"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-medium">
                                          {index + 1}
                                        </span>
                                        <span className="text-sm flex-1">{name}</span>
                                        {regeneratingSegment === index ? (
                                          <span className="text-xs text-blue-600">Regenerating...</span>
                                        ) : (
                                          <RefreshCw className="w-4 h-4 text-gray-400" />
                                        )}
                                      </div>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {scriptMode === "expert" && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Freelance / Expert Mode
                      </h3>
                      <p className="text-sm text-blue-800 mb-3">
                        For experienced officiants who have performed weddings
                        before and want full control to customize the ceremony.
                      </p>

                      <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Expert Mode Features:</strong>
                        </p>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1">
                          <li>
                            • Full access to the script editor with advanced
                            formatting
                          </li>
                          <li>
                            • No guided questions - direct script creation
                          </li>
                          <li>• Complete customization freedom</li>
                          <li>• Perfect for experienced officiants</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {!scriptMode && (
                    <div className="text-center p-8 text-gray-500">
                      <p>Please select a script writing mode to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Script Builder Interface - Only show for Expert Mode or when no mode selected */}
              {(scriptMode === "expert" || !scriptMode) && (
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle
                      className={`flex items-center ${!scriptMode ? "text-gray-400" : "text-blue-900"
                        }`}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Mr. Script Builder
                    </CardTitle>
                    <CardDescription
                      className={!scriptMode ? "text-gray-400" : ""}
                    >
                      {!scriptMode
                        ? "Please select a script writing mode above to get started"
                        : "Create personalized ceremony scripts with Mr. Script for Sarah Johnson & David Chen"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent
                    className={`p-0 ${!scriptMode ? "opacity-40 pointer-events-none" : ""
                      }`}
                  >
                    {/* Secondary Tabs for Script Builder */}
                    <Tabs
                      value={scriptBuilderTab}
                      onValueChange={setScriptBuilderTab}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-3 bg-blue-50 border-b border-blue-100">
                        <TabsTrigger
                          value="mr-script"
                          className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                          disabled={!scriptMode}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Mr. Script
                        </TabsTrigger>
                        <TabsTrigger
                          value="templates"
                          className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                          disabled={!scriptMode}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Templates
                        </TabsTrigger>
                        <TabsTrigger
                          value="editor"
                          className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                          disabled={!scriptMode}
                          onClick={() => {
                            if (onScriptUploaded) {
                              onScriptUploaded("", "");
                            }
                          }}
                        >
                          <FileEdit className="w-4 h-4 mr-1" />
                          Script Editor
                        </TabsTrigger>
                      </TabsList>

                      {/* Mr. Script Tab */}
                      <TabsContent value="mr-script" className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Chat Interface */}
                          <div className="lg:col-span-2">
                            <Card className="h-[600px] flex flex-col">
                              <CardHeader className="pb-4">
                                <CardTitle className="text-lg text-gray-900">
                                  Mr. Script
                                </CardTitle>
                                <CardDescription>
                                  Ask me anything about creating your wedding
                                  ceremony script
                                </CardDescription>
                              </CardHeader>

                              {/* Chat Messages */}
                              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                                {aiChatMessages.map((message) => (
                                  <div
                                    key={message.id}
                                    className={`flex ${message.role === "user"
                                      ? "justify-end"
                                      : "justify-start"
                                      }`}
                                  >
                                    <div
                                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${message.role === "user"
                                        ? "bg-blue-500 text-white"
                                        : "bg-white border border-gray-200 text-gray-900"
                                        }`}
                                    >
                                      <div className="whitespace-pre-wrap text-sm">
                                        {message.content}
                                      </div>
                                      <div
                                        className={`text-xs mt-2 ${message.role === "user"
                                          ? "text-blue-100"
                                          : "text-gray-500"
                                          }`}
                                      >
                                        {message.timestamp}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {/* Loading indicator */}
                                {isGeneratingScript && (
                                  <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                                      <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                        <span className="text-sm text-gray-600">
                                          Generating response...
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Chat Input */}
                              <div className="p-4 border-t border-gray-200">
                                <div className="flex space-x-2">
                                  <Input
                                    placeholder="Ask about ceremony scripts, traditions, vows, or anything else..."
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    onKeyPress={(e) =>
                                      e.key === "Enter" && handleAiMessage()
                                    }
                                    className="flex-1"
                                  />
                                  <Button
                                    onClick={handleAiMessage}
                                    disabled={
                                      !aiInput.trim() || isGeneratingScript
                                    }
                                    className="bg-blue-500 hover:bg-blue-600"
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          </div>

                          {/* Quick Actions Sidebar */}
                          <div className="space-y-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg text-gray-900">
                                  Quick Script Generation
                                </CardTitle>
                                <CardDescription>
                                  Generate scripts instantly with one click
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <Button
                                  onClick={() =>
                                    handleGenerateScript("Traditional")
                                  }
                                  disabled={isGeneratingScript}
                                  className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Traditional Ceremony
                                </Button>
                                <Button
                                  onClick={() => handleGenerateScript("Modern")}
                                  disabled={isGeneratingScript}
                                  className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Heart className="w-4 h-4 mr-2" />
                                  Modern Ceremony
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleGenerateScript("Interfaith")
                                  }
                                  disabled={isGeneratingScript}
                                  className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  Interfaith Ceremony
                                </Button>
                                <Button
                                  onClick={() => handleGenerateScript("Beach")}
                                  disabled={isGeneratingScript}
                                  className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <MapPin className="w-4 h-4 mr-2" />
                                  Beach/Outdoor
                                </Button>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg text-gray-900">
                                  Generated Scripts
                                </CardTitle>
                                <CardDescription>
                                  {generatedScripts.length} scripts created
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {generatedScripts.map((script) => (
                                  <div
                                    key={script.id}
                                    className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-900">
                                          {script.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {script.createdDate}
                                        </p>
                                        <Badge
                                          variant="outline"
                                          className="mt-2 text-xs"
                                        >
                                          {script.type}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-blue-600 hover:text-blue-700"
                                          onClick={() =>
                                            handleViewScript(script)
                                          }
                                          title="View script"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-green-600 hover:text-green-700"
                                          onClick={() =>
                                            handleEditScript(script)
                                          }
                                          title="Edit script"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-gray-600 hover:text-gray-700"
                                          onClick={() =>
                                            handleDownloadScript(script)
                                          }
                                          title="Download script"
                                        >
                                          <Download className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg text-gray-900">
                                  Couple Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium">Couple:</span>{" "}
                                  Sarah & David
                                </div>
                                <div>
                                  <span className="font-medium">Venue:</span>{" "}
                                  {editWeddingDetails.venueName}
                                </div>
                                <div>
                                  <span className="font-medium">Date:</span>{" "}
                                  {new Date(
                                    editWeddingDetails.weddingDate
                                  ).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-medium">Guests:</span>{" "}
                                  {editWeddingDetails.expectedGuests} people
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Templates Tab */}
                      <TabsContent value="templates" className="p-6">
                        <div className="text-center py-12">
                          <FileText className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Script Templates
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Browse and customize pre-made ceremony templates
                          </p>
                          <Button
                            variant="outline"
                            className="border-blue-200 text-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Coming Soon
                          </Button>
                        </div>
                      </TabsContent>

                      {/* Script Editor Tab */}
                      <TabsContent value="editor" className="p-6">
                        {editingScript ? (
                          <div className="flex flex-col h-[800px]">
                            {/* Editor Header */}
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {editingScript.title}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Edit and customize your ceremony script
                              </p>
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center space-x-2 p-4 border bg-gray-50 rounded-t-lg flex-wrap gap-2">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="font-bold hover:bg-blue-50"
                                  onClick={() => applyFormatting("bold")}
                                  title="Bold"
                                >
                                  <strong>B</strong>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="italic hover:bg-blue-50"
                                  onClick={() => applyFormatting("italic")}
                                  title="Italic"
                                >
                                  <em>I</em>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="underline hover:bg-blue-50"
                                  onClick={() => applyFormatting("underline")}
                                  title="Underline"
                                >
                                  <u>U</u>
                                </Button>
                              </div>

                              <Separator
                                orientation="vertical"
                                className="h-6"
                              />

                              {/* Color Palette */}
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-600 mr-1">
                                  Colors:
                                </span>
                                {[
                                  "#000000",
                                  "#FF0000",
                                  "#0000FF",
                                  "#008000",
                                  "#800080",
                                  "#FFA500",
                                  "#A52A2A",
                                  "#808080",
                                ].map((color) => (
                                  <button
                                    key={color}
                                    className="w-6 h-6 rounded border border-gray-300 hover:border-gray-500 transition-colors"
                                    style={{ backgroundColor: color }}
                                    onClick={() => applyTextColor(color)}
                                    title={`Apply ${color} color`}
                                  />
                                ))}
                              </div>

                              <Separator
                                orientation="vertical"
                                className="h-6"
                              />

                              <select
                                className="px-2 py-1 border rounded text-sm"
                                onChange={(e) => {
                                  document.execCommand(
                                    "fontSize",
                                    false,
                                    e.target.value
                                  );
                                }}
                              >
                                <option value="3">Normal</option>
                                <option value="1">Small</option>
                                <option value="4">Large</option>
                                <option value="6">Extra Large</option>
                              </select>

                              <Separator
                                orientation="vertical"
                                className="h-6"
                              />

                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    document.execCommand("justifyLeft")
                                  }
                                  title="Align Left"
                                >
                                  ⭲
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    document.execCommand("justifyCenter")
                                  }
                                  title="Center"
                                >
                                  ⭿
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    document.execCommand("justifyRight")
                                  }
                                  title="Align Right"
                                >
                                  ⭾
                                </Button>
                              </div>

                              <Separator
                                orientation="vertical"
                                className="h-6"
                              />

                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    applyFormatting("insertUnorderedList")
                                  }
                                  title="Bullet List"
                                  className="hover:bg-blue-50"
                                >
                                  • List
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    applyFormatting("insertOrderedList")
                                  }
                                  title="Numbered List"
                                  className="hover:bg-blue-50"
                                >
                                  1. List
                                </Button>
                              </div>
                            </div>

                            {/* Editor */}
                            <div className="flex-1 border border-t-0 overflow-y-auto relative">
                              <div
                                ref={editorRef}
                                id="script-editor"
                                contentEditable
                                suppressContentEditableWarning={true}
                                className="w-full h-full min-h-[500px] p-6 focus:outline-none bg-white"
                                style={{
                                  lineHeight: "1.8",
                                  fontSize: `${editorFontSize}px`,
                                  fontFamily: "Georgia, serif",
                                  whiteSpace: "pre-wrap",
                                  wordWrap: "break-word",
                                  overflowWrap: "break-word",
                                }}
                                key={editingScript?.id}
                                dangerouslySetInnerHTML={{
                                  __html: scriptContent || "",
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();

                                    // Insert a line break at the current cursor position
                                    const selection = window.getSelection();
                                    if (selection && selection.rangeCount > 0) {
                                      const range = selection.getRangeAt(0);
                                      range.deleteContents();

                                      const br1 = document.createElement("br");
                                      const br2 = document.createElement("br");

                                      range.insertNode(br1);
                                      range.setStartAfter(br1);
                                      range.insertNode(br2);

                                      range.setStartAfter(br2);
                                      range.collapse(true);
                                      selection.removeAllRanges();
                                      selection.addRange(range);

                                      if (editorRef.current) {
                                        editorRef.current.focus();
                                      }
                                    }
                                  }
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLDivElement;
                                  const newContent = target.innerHTML;

                                  if (newContent !== scriptContent) {
                                    setScriptContent(newContent);
                                  }
                                }}
                                onBlur={(e) => {
                                  const target = e.target as HTMLDivElement;
                                  const newContent = target.innerHTML;
                                  setScriptContent(newContent);

                                  // Auto-save on blur
                                  if (editingScript && newContent.trim()) {
                                    localStorage.setItem(
                                      `script_${editingScript.id}`,
                                      newContent
                                    );
                                    const timestamp =
                                      new Date().toLocaleString();
                                    localStorage.setItem(
                                      `script_${editingScript.id}_autosave_time`,
                                      timestamp
                                    );
                                  }
                                }}
                              />
                              {scriptContent === "" && (
                                <div
                                  className="absolute top-4 left-4 text-gray-400 pointer-events-none p-6"
                                  style={{
                                    fontSize: `${editorFontSize}px`,
                                    fontFamily: "Georgia, serif",
                                  }}
                                >
                                  Start writing your ceremony script here...
                                  <br />
                                  <br />
                                  Use the formatting tools above:
                                  <br />• <strong>Bold</strong>, <em>Italic</em>
                                  , and <u>Underline</u> text
                                  <br />• Color text with the color palette
                                  <br />• Create bullet and numbered lists
                                </div>
                              )}
                            </div>

                            {/* Status Bar */}
                            <div className="px-4 py-2 bg-gray-50 border text-sm text-gray-600 flex justify-between items-center rounded-b-lg">
                              <div>
                                Words:{" "}
                                {
                                  scriptContent
                                    .replace(/<[^>]*>/g, "")
                                    .split(/\s+/)
                                    .filter((word) => word.length > 0).length
                                }{" "}
                                |
                                <span
                                  className={`
                                ${(() => {
                                      const charCount = scriptContent.replace(
                                        /<[^>]*>/g,
                                        ""
                                      ).length;
                                      if (charCount < 50)
                                        return "text-red-600 font-medium";
                                      if (charCount > 6500)
                                        return "text-orange-600 font-medium";
                                      if (charCount > 7000)
                                        return "text-red-600 font-medium";
                                      return "text-gray-600";
                                    })()}
                              `}
                                >
                                  Characters:{" "}
                                  {scriptContent.replace(/<[^>]*>/g, "").length}
                                  /7,000
                                </span>{" "}
                                | Lines:{" "}
                                {scriptContent.split(/<br\s*\/?>/gi).length}
                              </div>
                              <div className="flex items-center space-x-3">
                                <span>Font Size: {editorFontSize}px</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={autoSave}
                                  className="text-xs"
                                >
                                  Auto-save
                                </Button>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center pt-4 mt-4 border-t">
                              <div className="text-sm text-gray-500">
                                <div>
                                  <span className="font-medium">
                                    Last saved:
                                  </span>{" "}
                                  {editingScript?.lastModified || "Never"}
                                </div>
                              </div>
                              <div className="flex space-x-3">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingScript(null);
                                    setScriptContent("");
                                  }}
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  Close Editor
                                </Button>
                                <Button
                                  onClick={handleSaveScript}
                                  className="bg-blue-500 hover:bg-blue-600"
                                  disabled={(() => {
                                    const charCount = scriptContent.replace(
                                      /<[^>]*>/g,
                                      ""
                                    ).length;
                                    return charCount < 50 || charCount > 7000;
                                  })()}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Script
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Edit className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Script Editor
                            </h3>
                            <p className="text-gray-500 mb-4">
                              Generate or upload a script to start editing
                            </p>
                            <Button
                              variant="outline"
                              className="border-blue-200 text-blue-700"
                              onClick={() => {
                                // Open the script editor with the last edited content
                                if (onScriptUploaded) {
                                  const plainTextContent =
                                    scriptContent.replace(/<[^>]*>/g, "") ||
                                    "Start typing your ceremony script here...";
                                  onScriptUploaded(
                                    plainTextContent,
                                    "ceremony-script.txt"
                                  );
                                }
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              View Script Editor
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Script Marketplace Tab */}
          <TabsContent value="marketplace">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* Browse External Marketplace */}
                  <Card className="border-2 border-purple-200 shadow-lg bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
                    <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-purple-900 flex items-center text-xl">
                            <ShoppingCart className="w-6 h-6 mr-3" />
                            Wedding Scripts Marketplace
                          </CardTitle>
                          <CardDescription className="text-purple-700 mt-2">
                            Browse and purchase professional wedding scripts from officiants worldwide
                          </CardDescription>
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <Globe className="w-4 h-4 mr-1" />
                          Live Marketplace
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Premium Scripts</p>
                            <p className="text-sm text-gray-600">Ready-to-use templates</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Expert Authors</p>
                            <p className="text-sm text-gray-600">From experienced officiants</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Download className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Instant Access</p>
                            <p className="text-sm text-gray-600">Download immediately</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-purple-200 mb-6">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Your Published Scripts Appear Automatically
                            </p>
                            <p className="text-xs text-gray-600">
                              When you publish a script below, it instantly appears in the marketplace for all users to browse and purchase. No subscription required to shop!
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                        size="lg"
                        onClick={() => {
                          const marketplaceUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL;
                          if (marketplaceUrl) {
                            window.open(marketplaceUrl, '_blank', 'noopener,noreferrer');
                          } else {
                            alert('Marketplace URL not configured. Please contact support.');
                          }
                        }}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Browse Marketplace
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* My Scripts */}
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-blue-900">
                            My Script Library
                          </CardTitle>
                          <CardDescription>
                            Manage and sell your ceremony scripts to other
                            officiants
                          </CardDescription>
                        </div>
                        <Button
                          className="bg-blue-500 hover:bg-blue-600"
                          onClick={() => setShowUploadScriptDialog(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Upload Script
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {myScripts.map((script) => (
                          <div
                            key={script.id}
                            className="border border-blue-100 rounded-xl p-4 bg-white hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="font-semibold text-gray-900">
                                      {script.title}
                                    </p>
                                    {script.published && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                        <Globe className="w-3 h-3 mr-1" />
                                        Published
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <Badge
                                      variant={
                                        script.status === "active"
                                          ? "default"
                                          : "outline"
                                      }
                                      className={
                                        script.status === "active"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }
                                    >
                                      {script.status === "active"
                                        ? "Active"
                                        : "Draft"}
                                    </Badge>
                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                      <span>{script.rating}</span>
                                      <span>•</span>
                                      <span>{script.sales} sales</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  ${script.price}
                                </p>
                                <p className="text-sm text-green-600">
                                  Earned: ${script.earnings}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-200 text-green-700 hover:bg-green-50"
                                    onClick={() => handleSetScriptPrice(script)}
                                    title="Set price"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() =>
                                      handleEditLibraryScript(script)
                                    }
                                    title="Edit script"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteScript(script)}
                                    title="Delete script"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  {script.published ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-200 text-red-700 hover:bg-red-50"
                                      onClick={() =>
                                        handleUnpublishScript(script)
                                      }
                                      title="Unpublish from marketplace"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                      onClick={() =>
                                        handlePublishScript(script)
                                      }
                                      title="Publish to marketplace"
                                    >
                                      <Globe className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* My Couple's Scripts */}
                  <Card className="border-pink-100 shadow-md bg-gradient-to-r from-pink-50 to-rose-50">
                    <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-pink-900 flex items-center">
                            <Heart className="w-5 h-5 mr-2" />
                            My Couple's Scripts
                          </CardTitle>
                          <CardDescription className="text-pink-700">
                            Script drafts for Sarah Johnson & David Chen's
                            wedding
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-pink-100 text-pink-800 border-pink-200">
                            3 drafts
                          </Badge>
                          <Button
                            className="bg-pink-500 hover:bg-pink-600"
                            onClick={handleCreateNewScript}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            New Script
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Sarah & David Script Drafts */}
                        {coupleScripts.length === 0 ? (
                          <div className="text-center text-gray-500">
                            No scripts found
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {coupleScripts.map((script) => (
                              <div
                                key={script.id}
                                className="flex items-center justify-between p-4 border rounded-xl bg-white hover:bg-blue-50"
                              >
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {script.title}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {script.size}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {script.created_at}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    className="text-blue-600"
                                    onClick={() =>
                                      window.open(script.url, "_blank")
                                    }
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="text-red-600"
                                    onClick={() =>
                                      handleDeleteCoupleScript(script.id)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Browse Scripts */}
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-blue-900">
                            Browse Script Marketplace
                          </CardTitle>
                          <CardDescription>
                            Discover and purchase scripts from other experienced
                            officiants
                          </CardDescription>
                        </div>
                        <Button
                          className="bg-blue-500 hover:bg-blue-600"
                          onClick={() => {
                            // Navigate to marketplace or open marketplace view
                            console.log("Opening Script Marketplace");
                          }}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Script Marketplace
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {popularScripts.map((script) => (
                          <div
                            key={script.id}
                            className="border border-blue-100 rounded-xl p-4 bg-white hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {script.title}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    by {script.author}
                                  </p>
                                  <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    <span>{script.rating}</span>
                                    <span>•</span>
                                    <span>{script.sales} purchases</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  ${script.price}
                                </p>
                                <div className="flex space-x-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Preview
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-blue-500 hover:bg-blue-600"
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-1" />
                                    Buy
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <div className="space-y-6">
                  <Card className="border-blue-100 shadow-md">
                    <CardContent className="space-y-3 p-6">
                      <Button
                        className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => setShowArchivedCeremoniesDialog(true)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Archived Ceremonies
                      </Button>
                      <Button className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                      <Button className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Payout History
                      </Button>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-3 text-blue-900">
                          Popular Categories
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            • Traditional Religious
                          </p>
                          <p className="text-gray-600">
                            • Modern Non-Religious
                          </p>
                          <p className="text-gray-600">
                            • Interfaith Ceremonies
                          </p>
                          <p className="text-gray-600">• Outdoor/Destination</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        onAddTask={handleAddTask}
      />

      {/* Schedule Meeting Dialog */}
      <ScheduleMeetingDialog
        isOpen={showScheduleMeetingDialog}
        onOpenChange={setShowScheduleMeetingDialog}
        onScheduleMeeting={handleScheduleMeeting}
        coupleEmails={[editCoupleInfo.brideEmail, editCoupleInfo.groomEmail]}
        coupleName={`${(editCoupleInfo.brideName || "").split(" ")[0]} & ${(editCoupleInfo.groomName || "").split(" ")[0]
          }`}
      />

      {/* Contract Upload Dialog */}
      <ContractUploadDialog
        isOpen={showContractUploadDialog}
        onOpenChange={setShowContractUploadDialog}
        onContractUploaded={handleContractUploaded}
      />

      {/* Edit Wedding Details Dialog */}
      <Dialog
        open={showEditWeddingDialog}
        onOpenChange={setShowEditWeddingDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Edit Wedding Details
            </DialogTitle>
            <DialogDescription>
              Update the wedding ceremony details including date, time,
              location, and guest count
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Venue Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Venue Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="editVenueName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Venue Name *
                  </Label>
                  <Input
                    id="editVenueName"
                    value={editWeddingDetails.venueName}
                    onChange={(e) =>
                      setEditWeddingDetails({
                        ...editWeddingDetails,
                        venueName: e.target.value,
                      })
                    }
                    placeholder="e.g., Sunset Gardens"
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="editVenueAddress"
                    className="text-sm font-medium text-gray-700"
                  >
                    Venue Address *
                  </Label>
                  <Input
                    id="editVenueAddress"
                    value={editWeddingDetails.venueAddress}
                    onChange={(e) =>
                      setEditWeddingDetails({
                        ...editWeddingDetails,
                        venueAddress: e.target.value,
                      })
                    }
                    placeholder="Full venue address"
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Date & Time
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="editWeddingDate"
                    className="text-sm font-medium text-gray-700"
                  >
                    Wedding Date *
                  </Label>
                  <Input
                    id="editWeddingDate"
                    type="date"
                    value={editWeddingDetails.weddingDate}
                    onChange={(e) =>
                      setEditWeddingDetails({
                        ...editWeddingDetails,
                        weddingDate: e.target.value,
                      })
                    }
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="editStartTime"
                    className="text-sm font-medium text-gray-700"
                  >
                    Start Time *
                  </Label>
                  <Input
                    id="editStartTime"
                    type="time"
                    value={editWeddingDetails.startTime}
                    onChange={(e) =>
                      setEditWeddingDetails({
                        ...editWeddingDetails,
                        startTime: e.target.value,
                      })
                    }
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="editEndTime"
                    className="text-sm font-medium text-gray-700"
                  >
                    End Time *
                  </Label>
                  <Input
                    id="editEndTime"
                    type="time"
                    value={editWeddingDetails.endTime}
                    onChange={(e) =>
                      setEditWeddingDetails({
                        ...editWeddingDetails,
                        endTime: e.target.value,
                      })
                    }
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Guest Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="editExpectedGuests"
                    className="text-sm font-medium text-gray-700"
                  >
                    Expected Number of Guests *
                  </Label>
                  <Input
                    id="editExpectedGuests"
                    type="number"
                    min="1"
                    max="1000"
                    value={editWeddingDetails.expectedGuests}
                    onChange={(e) =>
                      setEditWeddingDetails({
                        ...editWeddingDetails,
                        expectedGuests: e.target.value,
                      })
                    }
                    placeholder="e.g., 75"
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Officiant Notes */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Officiant Notes
              </h4>
              <div>
                <Label
                  htmlFor="officiantNotes"
                  className="text-sm font-medium text-gray-700"
                >
                  Private Notes (Only visible to you)
                </Label>
                <Textarea
                  id="officiantNotes"
                  value={editWeddingDetails.officiantNotes || ""}
                  onChange={(e) =>
                    setEditWeddingDetails({
                      ...editWeddingDetails,
                      officiantNotes: e.target.value,
                    })
                  }
                  placeholder="Add any private notes, reminders, or special considerations for this wedding..."
                  rows={6}
                  className="mt-1 border-blue-200 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These notes are for your reference only and won't be shared
                  with the couple
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Preview</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">
                    {editWeddingDetails.venueName}
                  </span>
                  <p className="text-gray-600">
                    {editWeddingDetails.venueAddress}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    {new Date(
                      editWeddingDetails.weddingDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <p className="text-gray-600">
                    {new Date(
                      `2024-01-01 ${editWeddingDetails.startTime}`
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    -{" "}
                    {new Date(
                      `2024-01-01 ${editWeddingDetails.endTime}`
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
                <p className="text-gray-600">
                  Expected guests: {editWeddingDetails.expectedGuests} people
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowEditWeddingDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditWeddingDetails}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Wedding Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-purple-900 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Add Wedding Event
            </DialogTitle>
            <DialogDescription>
              Create a new wedding event with custom details, date, time and
              category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Subject Field */}
            <div className="space-y-2">
              <Label
                htmlFor="eventSubject"
                className="text-sm font-medium text-gray-700"
              >
                Event Subject *
              </Label>
              <Input
                id="eventSubject"
                value={addEventForm.subject}
                onChange={(e) =>
                  setAddEventForm({ ...addEventForm, subject: e.target.value })
                }
                placeholder="e.g., Wedding Rehearsal, Photo Session, Reception Setup"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="eventDate"
                  className="text-sm font-medium text-gray-700"
                >
                  Date *
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={addEventForm.date}
                  onChange={(e) =>
                    setAddEventForm({ ...addEventForm, date: e.target.value })
                  }
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="eventTime"
                  className="text-sm font-medium text-gray-700"
                >
                  Time *
                </Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={addEventForm.time}
                  onChange={(e) =>
                    setAddEventForm({ ...addEventForm, time: e.target.value })
                  }
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label
                htmlFor="eventCategory"
                className="text-sm font-medium text-gray-700"
              >
                Category
              </Label>
              <Select
                value={addEventForm.category}
                onValueChange={(value) =>
                  setAddEventForm({ ...addEventForm, category: value })
                }
              >
                <SelectTrigger className="border-purple-200 focus:border-purple-500">
                  <SelectValue placeholder="Select event category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rehearsal">Rehearsal</SelectItem>
                  <SelectItem value="ceremony">Ceremony</SelectItem>
                  <SelectItem value="reception">Reception</SelectItem>
                  <SelectItem value="photo-session">Photo Session</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <Label
                htmlFor="eventDetails"
                className="text-sm font-medium text-gray-700"
              >
                Additional Details
              </Label>
              <Textarea
                id="eventDetails"
                value={addEventForm.details}
                onChange={(e) =>
                  setAddEventForm({ ...addEventForm, details: e.target.value })
                }
                placeholder="Add any special instructions, notes, or additional information about this event..."
                className="min-h-[100px] border-purple-200 focus:border-purple-500"
              />
            </div>

            {/* Preview */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3">
                Event Preview
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">
                    {addEventForm.subject || "Event Subject"}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1 text-purple-500" />
                    <span className="text-gray-600">
                      {addEventForm.date
                        ? formatEventDate(addEventForm.date)
                        : "Date not set"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-purple-500" />
                    <span className="text-gray-600">
                      {addEventForm.time || "Time not set"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge
                    variant="outline"
                    className="border-purple-200 text-purple-700"
                  >
                    {addEventForm.category.charAt(0).toUpperCase() +
                      addEventForm.category.slice(1).replace("-", " ")}
                  </Badge>
                </div>
                {addEventForm.details && (
                  <div className="mt-2">
                    <p className="text-gray-600 text-xs">
                      {addEventForm.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAddEventDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddWeddingEvent}
              className="bg-purple-500 hover:bg-purple-600"
              disabled={
                !addEventForm.subject ||
                !addEventForm.date ||
                !addEventForm.time
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog
        open={showEditMeetingDialog}
        onOpenChange={setShowEditMeetingDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Edit Meeting
            </DialogTitle>
            <DialogDescription>
              Update meeting details, time, and preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Subject Field */}
            <div className="space-y-2">
              <Label
                htmlFor="editMeetingSubject"
                className="text-sm font-medium text-gray-700"
              >
                Meeting Subject *
              </Label>
              <Input
                id="editMeetingSubject"
                value={editMeetingForm.subject}
                onChange={(e) =>
                  setEditMeetingForm({
                    ...editMeetingForm,
                    subject: e.target.value,
                  })
                }
                placeholder="e.g., Pre-wedding Consultation, Ceremony Planning"
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="editMeetingDate"
                  className="text-sm font-medium text-gray-700"
                >
                  Date *
                </Label>
                <Input
                  id="editMeetingDate"
                  type="date"
                  value={editMeetingForm.date}
                  onChange={(e) =>
                    setEditMeetingForm({
                      ...editMeetingForm,
                      date: e.target.value,
                    })
                  }
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="editMeetingTime"
                  className="text-sm font-medium text-gray-700"
                >
                  Time *
                </Label>
                <Input
                  id="editMeetingTime"
                  type="time"
                  value={editMeetingForm.time}
                  onChange={(e) =>
                    setEditMeetingForm({
                      ...editMeetingForm,
                      time: e.target.value,
                    })
                  }
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="editMeetingDuration"
                  className="text-sm font-medium text-gray-700"
                >
                  Duration (minutes)
                </Label>
                <Input
                  id="editMeetingDuration"
                  type="number"
                  min="15"
                  max="240"
                  value={editMeetingForm.duration}
                  onChange={(e) =>
                    setEditMeetingForm({
                      ...editMeetingForm,
                      duration: parseInt(e.target.value),
                    })
                  }
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Meeting Type and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="editMeetingType"
                  className="text-sm font-medium text-gray-700"
                >
                  Meeting Type
                </Label>
                <Select
                  value={editMeetingForm.meetingType}
                  onValueChange={(value) =>
                    setEditMeetingForm({
                      ...editMeetingForm,
                      meetingType: value,
                    })
                  }
                >
                  <SelectTrigger className="border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="video-call">Video Call</SelectItem>
                    <SelectItem value="phone-call">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="editMeetingLocation"
                  className="text-sm font-medium text-gray-700"
                >
                  Location {editMeetingForm.meetingType === "in-person" && "*"}
                </Label>
                <Input
                  id="editMeetingLocation"
                  value={editMeetingForm.location}
                  onChange={(e) =>
                    setEditMeetingForm({
                      ...editMeetingForm,
                      location: e.target.value,
                    })
                  }
                  placeholder={
                    editMeetingForm.meetingType === "in-person"
                      ? "e.g., Pastor Office, Coffee Shop"
                      : editMeetingForm.meetingType === "video-call"
                        ? "e.g., Zoom, Google Meet"
                        : "e.g., Phone number"
                  }
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Meeting Details */}
            <div className="space-y-2">
              <Label
                htmlFor="editMeetingBody"
                className="text-sm font-medium text-gray-700"
              >
                Meeting Details
              </Label>
              <Textarea
                id="editMeetingBody"
                value={editMeetingForm.body}
                onChange={(e) =>
                  setEditMeetingForm({
                    ...editMeetingForm,
                    body: e.target.value,
                  })
                }
                placeholder="Add agenda items, topics to discuss, or any special instructions..."
                className="min-h-[100px] border-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Preview */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">
                Meeting Preview
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">
                    {editMeetingForm.subject || "Meeting Subject"}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1 text-blue-500" />
                    <span className="text-gray-600">
                      {editMeetingForm.date || "Date not set"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-blue-500" />
                    <span className="text-gray-600">
                      {editMeetingForm.time || "Time not set"} (
                      {editMeetingForm.duration} min)
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-lg mr-1">
                      {getMeetingTypeIcon(editMeetingForm.meetingType)}
                    </span>
                    <span className="text-gray-600">
                      {editMeetingForm.meetingType.charAt(0).toUpperCase() +
                        editMeetingForm.meetingType.slice(1).replace("-", " ")}
                    </span>
                  </div>
                  {editMeetingForm.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-blue-500" />
                      <span className="text-gray-600">
                        {editMeetingForm.location}
                      </span>
                    </div>
                  )}
                </div>
                {editMeetingForm.body && (
                  <div className="mt-2">
                    <p className="text-gray-600 text-xs">
                      {editMeetingForm.body}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowEditMeetingDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMeeting}
              className="bg-blue-500 hover:bg-blue-600"
              disabled={
                !editMeetingForm.subject ||
                !editMeetingForm.date ||
                !editMeetingForm.time
              }
            >
              <Save className="w-4 h-4 mr-2" />
              Update Meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog */}
      <Dialog
        open={showFileViewerDialog}
        onOpenChange={setShowFileViewerDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              File Viewer
            </DialogTitle>
            <DialogDescription>
              {viewingFile ? `Viewing: ${viewingFile.name}` : "File preview"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {viewingFile && getFileViewerContent(viewingFile)}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              {viewingFile && (
                <>
                  <span className="font-medium">Uploaded by:</span>{" "}
                  {viewingFile.uploadedBy} •
                  <span className="font-medium ml-2">Date:</span>{" "}
                  {viewingFile.date}
                </>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFileViewerDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
              {viewingFile && (
                <Button
                  onClick={() => window.open(viewingFile.url || "#", "_blank")}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Viewer Dialog */}
      <Dialog
        open={showContractViewerDialog}
        onOpenChange={setShowContractViewerDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Contract Viewer
            </DialogTitle>
            <DialogDescription>
              {viewingContract
                ? `Viewing: ${viewingContract.name}`
                : "Contract preview"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {viewingContract && getContractViewerContent(viewingContract)}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              {viewingContract && (
                <div className="flex items-center space-x-4">
                  <span>
                    <span className="font-medium">Status:</span>
                    <Badge
                      className={`ml-1 ${viewingContract.status === "signed"
                        ? "bg-green-100 text-green-800"
                        : viewingContract.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {viewingContract.status.charAt(0).toUpperCase() +
                        viewingContract.status.slice(1)}
                    </Badge>
                  </span>
                  <span>
                    <span className="font-medium">Type:</span>{" "}
                    {viewingContract.type.replace("_", " ")}
                  </span>
                  <span>
                    <span className="font-medium">Created:</span>{" "}
                    {viewingContract.createdDate}
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowContractViewerDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
              {viewingContract && viewingContract.file && (
                <Button
                  onClick={() =>
                    window.open(viewingContract.file.url || "#", "_blank")
                  }
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Contract Email Dialog */}
      <Dialog
        open={showSendContractDialog}
        onOpenChange={setShowSendContractDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-900 flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Send Contract via Email
            </DialogTitle>
            <DialogDescription>
              {sendingContract
                ? `Send "${sendingContract.name}" to recipients`
                : "Send contract to recipients"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Contract Information */}
            {sendingContract && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Contract Attachment
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">
                      {sendingContract.name}
                    </p>
                    <p className="text-sm text-green-700">
                      Type: {sendingContract.type.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Form */}
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="emailTo"
                  className="text-sm font-medium text-gray-700"
                >
                  To: *
                </Label>
                <div className="space-y-2 mt-1">
                  {/* Preset email options */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value={editCoupleInfo.brideEmail}
                        checked={emailForm.to === editCoupleInfo.brideEmail}
                        onChange={(e) =>
                          setEmailForm({
                            ...emailForm,
                            to: e.target.value,
                            customEmail: "",
                          })
                        }
                        className="text-green-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">
                          {editCoupleInfo.brideName}
                        </span>{" "}
                        - {editCoupleInfo.brideEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value={editCoupleInfo.groomEmail}
                        checked={emailForm.to === editCoupleInfo.groomEmail}
                        onChange={(e) =>
                          setEmailForm({
                            ...emailForm,
                            to: e.target.value,
                            customEmail: "",
                          })
                        }
                        className="text-green-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">
                          {editCoupleInfo.groomName}
                        </span>{" "}
                        - {editCoupleInfo.groomEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="both"
                        checked={emailForm.to === "both"}
                        onChange={(e) =>
                          setEmailForm({
                            ...emailForm,
                            to: e.target.value,
                            customEmail: "",
                          })
                        }
                        className="text-green-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Both</span> -{" "}
                        {editCoupleInfo.brideEmail}, {editCoupleInfo.groomEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="custom"
                        checked={emailForm.customEmail !== ""}
                        onChange={(e) =>
                          setEmailForm({
                            ...emailForm,
                            to: "",
                            customEmail: "custom",
                          })
                        }
                        className="text-green-600"
                      />
                      <span className="text-sm font-medium">
                        Other email address:
                      </span>
                    </label>
                  </div>
                  {/* Custom email input */}
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={
                      emailForm.customEmail === "custom"
                        ? ""
                        : emailForm.customEmail
                    }
                    onChange={(e) =>
                      setEmailForm({
                        ...emailForm,
                        to: "",
                        customEmail: e.target.value,
                      })
                    }
                    disabled={
                      emailForm.to !== "" && emailForm.customEmail === ""
                    }
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="emailSubject"
                  className="text-sm font-medium text-gray-700"
                >
                  Subject: *
                </Label>
                <Input
                  id="emailSubject"
                  value={emailForm.subject}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, subject: e.target.value })
                  }
                  placeholder="Email subject"
                  className="mt-1 border-green-200 focus:border-green-500"
                />
              </div>

              <div>
                <Label
                  htmlFor="emailBody"
                  className="text-sm font-medium text-gray-700"
                >
                  Message: *
                </Label>
                <Textarea
                  id="emailBody"
                  value={emailForm.body}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, body: e.target.value })
                  }
                  placeholder="Email message body"
                  rows={6}
                  className="mt-1 border-green-200 focus:border-green-500"
                />
              </div>
            </div>

            {/* Email Preview */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Email Preview</h5>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">To:</span>{" "}
                  {emailForm.to === "both"
                    ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
                    : emailForm.to ||
                    emailForm.customEmail ||
                    "No recipient selected"}
                </p>
                <p>
                  <span className="font-medium">Subject:</span>{" "}
                  {emailForm.subject || "No subject"}
                </p>
                <p>
                  <span className="font-medium">Attachment:</span>{" "}
                  {sendingContract?.name || "No contract"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSendContractDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendContractEmail}
              className="bg-green-500 hover:bg-green-600"
              disabled={
                (!emailForm.to && !emailForm.customEmail) ||
                !emailForm.subject.trim() ||
                !emailForm.body.trim()
              }
            >
              <Send className="w-4 h-4 mr-2" />
              Send Contract
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Payment Reminder Dialog */}
      <Dialog
        open={showSendPaymentReminderDialog}
        onOpenChange={setShowSendPaymentReminderDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-orange-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Send Payment Reminder
            </DialogTitle>
            <DialogDescription>
              {paymentReminderForm.to === "both"
                ? "Send payment reminder to both couple members"
                : "Send payment reminder to selected recipient"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Payment Reminder Form */}
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="paymentReminderTo"
                  className="text-sm font-medium text-gray-700"
                >
                  To: *
                </Label>
                <div className="space-y-2 mt-1">
                  {/* Preset email options */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="both"
                        checked={paymentReminderForm.to === "both"}
                        onChange={(e) =>
                          setPaymentReminderForm({
                            ...paymentReminderForm,
                            to: e.target.value,
                          })
                        }
                        className="text-orange-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Both</span> -{" "}
                        {editCoupleInfo.brideEmail}, {editCoupleInfo.groomEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value={editCoupleInfo.brideEmail}
                        checked={
                          paymentReminderForm.to === editCoupleInfo.brideEmail
                        }
                        onChange={(e) =>
                          setPaymentReminderForm({
                            ...paymentReminderForm,
                            to: e.target.value,
                          })
                        }
                        className="text-orange-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">
                          {editCoupleInfo.brideName}
                        </span>{" "}
                        - {editCoupleInfo.brideEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value={editCoupleInfo.groomEmail}
                        checked={
                          paymentReminderForm.to === editCoupleInfo.groomEmail
                        }
                        onChange={(e) =>
                          setPaymentReminderForm({
                            ...paymentReminderForm,
                            to: e.target.value,
                          })
                        }
                        className="text-orange-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">
                          {editCoupleInfo.groomName}
                        </span>{" "}
                        - {editCoupleInfo.groomEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="custom"
                        checked={paymentReminderForm.customEmail !== ""}
                        onChange={(e) =>
                          setPaymentReminderForm({
                            ...paymentReminderForm,
                            to: "",
                            customEmail: "custom",
                          })
                        }
                        className="text-orange-600"
                      />
                      <span className="text-sm font-medium">
                        Other email address:
                      </span>
                    </label>
                  </div>
                  {/* Custom email input */}
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={
                      paymentReminderForm.customEmail === "custom"
                        ? ""
                        : paymentReminderForm.customEmail
                    }
                    onChange={(e) =>
                      setPaymentReminderForm({
                        ...paymentReminderForm,
                        to: "",
                        customEmail: e.target.value,
                      })
                    }
                    disabled={
                      paymentReminderForm.to !== "" &&
                      paymentReminderForm.customEmail === ""
                    }
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="paymentReminderSubject"
                  className="text-sm font-medium text-gray-700"
                >
                  Subject: *
                </Label>
                <Input
                  id="paymentReminderSubject"
                  value={paymentReminderForm.subject}
                  onChange={(e) =>
                    setPaymentReminderForm({
                      ...paymentReminderForm,
                      subject: e.target.value,
                    })
                  }
                  placeholder="Payment reminder subject"
                  className="mt-1 border-orange-200 focus:border-orange-500"
                />
              </div>

              <div>
                <Label
                  htmlFor="paymentReminderBody"
                  className="text-sm font-medium text-gray-700"
                >
                  Message: *
                </Label>
                <Textarea
                  id="paymentReminderBody"
                  value={paymentReminderForm.body}
                  onChange={(e) =>
                    setPaymentReminderForm({
                      ...paymentReminderForm,
                      body: e.target.value,
                    })
                  }
                  placeholder="Payment reminder message"
                  rows={6}
                  className="mt-1 border-orange-200 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Payment Reminder Preview */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h5 className="font-medium text-orange-900 mb-2">
                Payment Reminder Preview
              </h5>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">To:</span>{" "}
                  {paymentReminderForm.to === "both"
                    ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
                    : paymentReminderForm.to ||
                    paymentReminderForm.customEmail ||
                    "No recipient selected"}
                </p>
                <p>
                  <span className="font-medium">Subject:</span>{" "}
                  {paymentReminderForm.subject || "No subject"}
                </p>
                <p>
                  <span className="font-medium">Payment Details:</span>{" "}
                  {paymentInfo.totalAmount} total, {paymentInfo.depositPaid}{" "}
                  paid, {paymentInfo.balance} due
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSendPaymentReminderDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendPaymentReminderEmail}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={
                (!paymentReminderForm.to && !paymentReminderForm.customEmail) ||
                !paymentReminderForm.subject.trim() ||
                !paymentReminderForm.body.trim()
              }
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Send Payment Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog
        open={showGenerateInvoiceDialog}
        onOpenChange={setShowGenerateInvoiceDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-900 flex items-center">
              <Receipt className="w-5 h-5 mr-2" />
              Generate Wedding Invoice
            </DialogTitle>
            <DialogDescription>
              Create a professional invoice for wedding ceremony services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Wedding & Invoice Header Information */}
            <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 rounded-lg border border-pink-200">
              <h4 className="font-semibold text-pink-900 mb-3 flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                Wedding Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="coupleName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Couple Names
                  </Label>
                  <Input
                    id="coupleName"
                    value={invoiceForm.coupleName}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        coupleName: e.target.value,
                      })
                    }
                    placeholder="e.g., Sarah & David"
                    className="mt-1 border-pink-200 focus:border-pink-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="weddingDate"
                    className="text-sm font-medium text-gray-700"
                  >
                    Wedding Date
                  </Label>
                  <Input
                    id="weddingDate"
                    type="date"
                    value={invoiceForm.weddingDate}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        weddingDate: e.target.value,
                      })
                    }
                    className="mt-1 border-pink-200 focus:border-pink-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label
                    htmlFor="venue"
                    className="text-sm font-medium text-gray-700"
                  >
                    Wedding Venue
                  </Label>
                  <Input
                    id="venue"
                    value={invoiceForm.venue}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, venue: e.target.value })
                    }
                    placeholder="e.g., Sunset Gardens"
                    className="mt-1 border-pink-200 focus:border-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label
                  htmlFor="invoiceNumber"
                  className="text-sm font-medium text-gray-700"
                >
                  Invoice Number *
                </Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) =>
                    setInvoiceForm({
                      ...invoiceForm,
                      invoiceNumber: e.target.value,
                    })
                  }
                  placeholder="e.g., WED-2024-001"
                  className="mt-1 border-green-200 focus:border-green-500"
                />
              </div>
              <div>
                <Label
                  htmlFor="invoiceDate"
                  className="text-sm font-medium text-gray-700"
                >
                  Invoice Date *
                </Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceForm.invoiceDate}
                  onChange={(e) =>
                    setInvoiceForm({
                      ...invoiceForm,
                      invoiceDate: e.target.value,
                    })
                  }
                  className="mt-1 border-green-200 focus:border-green-500"
                />
              </div>
              <div>
                <Label
                  htmlFor="dueDate"
                  className="text-sm font-medium text-gray-700"
                >
                  Due Date *
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
                  }
                  className="mt-1 border-green-200 focus:border-green-500"
                />
              </div>
            </div>

            {/* Email Recipients */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Send Invoice To
              </Label>
              <Select
                value={invoiceForm.emailRecipients}
                onValueChange={(value) =>
                  setInvoiceForm({ ...invoiceForm, emailRecipients: value })
                }
              >
                <SelectTrigger className="border-green-200 focus:border-green-500">
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">
                    Both Bride & Groom ({editCoupleInfo.brideEmail},{" "}
                    {editCoupleInfo.groomEmail})
                  </SelectItem>
                  <SelectItem value="bride">
                    Bride Only ({editCoupleInfo.brideEmail})
                  </SelectItem>
                  <SelectItem value="groom">
                    Groom Only ({editCoupleInfo.groomEmail})
                  </SelectItem>
                  <SelectItem value="custom">Custom Email Address</SelectItem>
                </SelectContent>
              </Select>
              {invoiceForm.emailRecipients === "custom" && (
                <Input
                  placeholder="Enter custom email address"
                  className="mt-2 border-green-200 focus:border-green-500"
                  onChange={(e) =>
                    setInvoiceForm({
                      ...invoiceForm,
                      emailRecipients: e.target.value,
                    })
                  }
                />
              )}
            </div>

            {/* Line Items */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Wedding Services & Items
              </Label>
              <div className="space-y-4">
                {invoiceForm.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 border border-green-100 rounded-lg bg-green-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-3">
                        <Label className="text-xs text-gray-600">
                          Service/Item *
                        </Label>
                        <Input
                          value={item.service}
                          onChange={(e) => {
                            const newItems = invoiceForm.items.map((i, idx) =>
                              idx === index
                                ? { ...i, service: e.target.value }
                                : i
                            );
                            setInvoiceForm({ ...invoiceForm, items: newItems });
                          }}
                          placeholder="e.g., Wedding Ceremony Officiant"
                          className="border-green-200"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-600">
                          Category
                        </Label>
                        <Select
                          value={item.category || ""}
                          onValueChange={(value) => {
                            const newItems = invoiceForm.items.map((i, idx) =>
                              idx === index ? { ...i, category: value } : i
                            );
                            setInvoiceForm({ ...invoiceForm, items: newItems });
                          }}
                        >
                          <SelectTrigger className="border-green-200">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ceremony Services">
                              Ceremony Services
                            </SelectItem>
                            <SelectItem value="Consultation">
                              Consultation
                            </SelectItem>
                            <SelectItem value="Rehearsal">Rehearsal</SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Documentation">
                              Documentation
                            </SelectItem>
                            <SelectItem value="Additional Services">
                              Additional Services
                            </SelectItem>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-xs text-gray-600">
                          Description
                        </Label>
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            const newItems = invoiceForm.items.map((i, idx) =>
                              idx === index
                                ? { ...i, description: e.target.value }
                                : i
                            );
                            setInvoiceForm({ ...invoiceForm, items: newItems });
                          }}
                          placeholder="Detailed description of service"
                          className="border-green-200"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label className="text-xs text-gray-600">Qty</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = invoiceForm.items.map((i, idx) =>
                              idx === index
                                ? {
                                  ...i,
                                  quantity: parseInt(e.target.value) || 1,
                                }
                                : i
                            );
                            setInvoiceForm({ ...invoiceForm, items: newItems });
                          }}
                          className="border-green-200"
                          min="1"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label className="text-xs text-gray-600">
                          Rate ($)
                        </Label>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => {
                            const newItems = invoiceForm.items.map((i, idx) =>
                              idx === index
                                ? {
                                  ...i,
                                  rate: parseFloat(e.target.value) || 0,
                                }
                                : i
                            );
                            setInvoiceForm({ ...invoiceForm, items: newItems });
                          }}
                          className="border-green-200"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (invoiceForm.items.length > 1) {
                              const newItems = invoiceForm.items.filter(
                                (_, idx) => idx !== index
                              );
                              setInvoiceForm({
                                ...invoiceForm,
                                items: newItems,
                              });
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                          disabled={invoiceForm.items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        Amount: ${(item.quantity * item.rate).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newItem = {
                      id: Date.now(),
                      service: "",
                      description: "",
                      category: "Ceremony Services",
                      quantity: 1,
                      rate: 0,
                      amount: 0,
                    };
                    setInvoiceForm({
                      ...invoiceForm,
                      items: [...invoiceForm.items, newItem],
                    });
                  }}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service Item
                </Button>

                {/* Quick Add Common Services */}
                <Select
                  onValueChange={(value) => {
                    const commonServices = {
                      rehearsal: {
                        service: "Rehearsal Coordination",
                        description:
                          "Ceremony rehearsal coordination and direction",
                        category: "Rehearsal",
                        quantity: 1,
                        rate: 150,
                      },
                      consultation: {
                        service: "Pre-Wedding Consultation",
                        description:
                          "Wedding planning consultation and script development",
                        category: "Consultation",
                        quantity: 1,
                        rate: 100,
                      },
                      travel: {
                        service: "Travel Fee",
                        description: "Travel expenses to wedding venue",
                        category: "Travel",
                        quantity: 1,
                        rate: 50,
                      },
                      documentation: {
                        service: "Marriage License Filing",
                        description:
                          "Processing and filing of marriage documentation",
                        category: "Documentation",
                        quantity: 1,
                        rate: 25,
                      },
                    };

                    if (commonServices[value as keyof typeof commonServices]) {
                      const service =
                        commonServices[value as keyof typeof commonServices];
                      const newItem = {
                        id: Date.now(),
                        ...service,
                        amount: service.quantity * service.rate,
                      };
                      setInvoiceForm({
                        ...invoiceForm,
                        items: [...invoiceForm.items, newItem],
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px] border-green-200">
                    <SelectValue placeholder="Quick Add Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rehearsal">
                      + Rehearsal ($150)
                    </SelectItem>
                    <SelectItem value="consultation">
                      + Consultation ($100)
                    </SelectItem>
                    <SelectItem value="travel">+ Travel Fee ($50)</SelectItem>
                    <SelectItem value="documentation">
                      + Documentation ($25)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Payment Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="paymentMethods"
                    className="text-sm font-medium text-gray-700"
                  >
                    Payment Methods Accepted
                  </Label>
                  <Textarea
                    id="paymentMethods"
                    value={invoiceForm.paymentMethods}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        paymentMethods: e.target.value,
                      })
                    }
                    placeholder="e.g., Check, Cash, Venmo, PayPal, Zelle"
                    rows={3}
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <Label
                      htmlFor="taxRate"
                      className="text-sm font-medium text-gray-700"
                    >
                      Tax Rate (%)
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={invoiceForm.taxRate}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          taxRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                      className="mt-1 border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="depositPaid"
                      className="text-sm font-medium text-gray-700"
                    >
                      Deposit Previously Paid ($)
                    </Label>
                    <Input
                      id="depositPaid"
                      type="number"
                      value={invoiceForm.depositPaid}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          depositPaid: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="mt-1 border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Label
                  htmlFor="bankDetails"
                  className="text-sm font-medium text-gray-700"
                >
                  Banking/Transfer Information (Optional)
                </Label>
                <Textarea
                  id="bankDetails"
                  value={invoiceForm.bankDetails}
                  onChange={(e) =>
                    setInvoiceForm({
                      ...invoiceForm,
                      bankDetails: e.target.value,
                    })
                  }
                  placeholder="e.g., Bank transfers available upon request, ACH details provided separately"
                  rows={2}
                  className="mt-1 border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Terms and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium text-gray-700"
                >
                  Terms & Conditions
                </Label>
                <Textarea
                  id="terms"
                  value={invoiceForm.terms}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, terms: e.target.value })
                  }
                  placeholder="Wedding ceremony payment terms"
                  rows={4}
                  className="mt-1 border-green-200 focus:border-green-500"
                />
                <div className="mt-2 text-xs text-gray-500">
                  <details className="cursor-pointer">
                    <summary className="font-medium">Suggested Terms</summary>
                    <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                      • Final payment must be received at least 7 days before
                      ceremony
                      <br />• Cancellation policy: 50% refund if cancelled 30+
                      days prior
                      <br />• Weather contingency plans included
                      <br />• Late payments may incur additional fees
                    </div>
                  </details>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-gray-700"
                >
                  Personal Message & Notes
                </Label>
                <Textarea
                  id="notes"
                  value={invoiceForm.notes}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, notes: e.target.value })
                  }
                  placeholder="Personal message to the couple or special instructions"
                  rows={4}
                  className="mt-1 border-green-200 focus:border-green-500"
                />
                <div className="mt-2 text-xs text-gray-500">
                  Add a personal touch - congratulations, excitement for their
                  day, etc.
                </div>
              </div>
            </div>

            {/* Invoice Preview/Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-4 flex items-center">
                <Receipt className="w-4 h-4 mr-2" />
                Invoice Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Invoice Details */}
                <div className="space-y-3">
                  {invoiceForm.items.map((item, index) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">
                        {item.service || `Item ${index + 1}`}
                      </span>
                      <span className="font-mono">
                        ${(item.quantity * item.rate).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-mono">
                        $
                        {invoiceForm.items
                          .reduce(
                            (sum, item) => sum + item.quantity * item.rate,
                            0
                          )
                          .toFixed(2)}
                      </span>
                    </div>
                    {invoiceForm.taxRate > 0 && (
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="font-medium">
                          Tax ({invoiceForm.taxRate}%):
                        </span>
                        <span className="font-mono">
                          $
                          {(
                            invoiceForm.items.reduce(
                              (sum, item) => sum + item.quantity * item.rate,
                              0
                            ) *
                            (invoiceForm.taxRate / 100)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-medium">Total Invoice:</span>
                      <span className="font-mono font-semibold">
                        $
                        {(
                          invoiceForm.items.reduce(
                            (sum, item) => sum + item.quantity * item.rate,
                            0
                          ) *
                          (1 + invoiceForm.taxRate / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                    {invoiceForm.depositPaid > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-green-600">
                          <span className="font-medium">Deposit Paid:</span>
                          <span className="font-mono">
                            -${invoiceForm.depositPaid.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-blue-900 pt-2 border-t border-blue-200">
                          <span>Balance Due:</span>
                          <span className="font-mono">
                            $
                            {Math.max(
                              0,
                              invoiceForm.items.reduce(
                                (sum, item) => sum + item.quantity * item.rate,
                                0
                              ) *
                              (1 + invoiceForm.taxRate / 100) -
                              invoiceForm.depositPaid
                            ).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Status Indicator */}
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Status:</span>
                  {invoiceForm.depositPaid > 0 ? (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Partial Payment Received
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      Payment Pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowGenerateInvoiceDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateAndSendInvoice}
              className="bg-green-500 hover:bg-green-600"
              disabled={
                !invoiceForm.invoiceNumber ||
                !invoiceForm.invoiceDate ||
                !invoiceForm.dueDate
              }
            >
              <Send className="w-4 h-4 mr-2" />
              Generate & Send Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Script Viewer Dialog */}
      <Dialog
        open={showScriptViewerDialog}
        onOpenChange={setShowScriptViewerDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pink-900 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Script Preview - {viewingScript?.title}
            </DialogTitle>
            <DialogDescription>
              Read-only view of the ceremony script
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {viewingScript && (
              <div className="space-y-4">
                {/* Script Info */}
                <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-pink-900">Type:</span>
                      <p className="text-pink-700">{viewingScript.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-pink-900">Status:</span>
                      <p className="text-pink-700">{viewingScript.status}</p>
                    </div>
                    <div>
                      <span className="font-medium text-pink-900">
                        Last Modified:
                      </span>
                      <p className="text-pink-700">
                        {viewingScript.lastModified}
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <span className="font-medium text-pink-900">
                        Description:
                      </span>
                      <p className="text-pink-700">
                        {viewingScript.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Script Content */}
                <div className="bg-white p-6 border-2 border-gray-200 rounded-lg">
                  <div
                    className="prose prose-lg max-w-none"
                    style={{
                      lineHeight: "1.8",
                      fontSize: "16px",
                      fontFamily: "Georgia, serif",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {viewingScript.content}
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Script Statistics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Word Count:</span>
                      <span className="ml-2">
                        {
                          viewingScript.content
                            .split(/\s+/)
                            .filter((word: string) => word.length > 0).length
                        }
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Characters:</span>
                      <span className="ml-2">
                        {viewingScript.content.length}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Est. Reading Time:</span>
                      <span className="ml-2">
                        {Math.ceil(
                          viewingScript.content
                            .split(/\s+/)
                            .filter((word: string) => word.length > 0).length /
                          150
                        )}{" "}
                        min
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Script for {editCoupleInfo.brideName} & {editCoupleInfo.groomName}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowScriptViewerDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (viewingScript) {
                    setShowScriptViewerDialog(false);
                    handleEditScript(viewingScript);
                  }
                }}
                className="bg-pink-500 hover:bg-pink-600"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Script
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Script Dialog */}
      <Dialog
        open={showShareScriptDialog}
        onOpenChange={setShowShareScriptDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pink-900 flex items-center">
              <Share className="w-5 h-5 mr-2" />
              Share Script with Couple
            </DialogTitle>
            <DialogDescription>
              {sharingScript
                ? `Send "${sharingScript.title}" to the couple for review`
                : "Send script to the couple"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Selection Section */}
            <div className="space-y-4">
              {/* Saved Scripts Section */}
              <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                <h4 className="font-semibold text-pink-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Saved Scripts
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {coupleScripts.length === 0 ? (
                    <p className="text-sm text-pink-600 italic">
                      No saved scripts available
                    </p>
                  ) : (
                    coupleScripts.map((script, index) => (
                      <label
                        key={`${script.id}-${index}`}
                        className="flex items-start space-x-3 p-2 hover:bg-pink-100 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItemsToShare.scripts.includes(
                            script.id
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                scripts: [
                                  ...selectedItemsToShare.scripts,
                                  script.id,
                                ],
                              });
                            } else {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                scripts: selectedItemsToShare.scripts.filter(
                                  (id) => id !== script.id
                                ),
                              });
                            }
                          }}
                          className="mt-1 text-pink-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-pink-900 text-sm">
                            {script.title}
                          </p>
                          <p className="text-xs text-pink-700">
                            {script.type} • {script.status}
                          </p>
                          <p className="text-xs text-pink-600">
                            Last modified: {script.lastModified}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Generated Scripts Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <FileEdit className="w-4 h-4 mr-2" />
                  AI Generated Scripts
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {generatedScripts.length === 0 ? (
                    <p className="text-sm text-blue-600 italic">
                      No generated scripts available
                    </p>
                  ) : (
                    generatedScripts.map((script, index) => (
                      <label
                        key={`${script.id}-${index}`}
                        className="flex items-start space-x-3 p-2 hover:bg-blue-100 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItemsToShare.scripts.includes(
                            script.id
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                scripts: [
                                  ...selectedItemsToShare.scripts,
                                  script.id,
                                ],
                              });
                            } else {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                scripts: selectedItemsToShare.scripts.filter(
                                  (id) => id !== script.id
                                ),
                              });
                            }
                          }}
                          className="mt-1 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-blue-900 text-sm">
                            {script.title}
                          </p>
                          <p className="text-xs text-blue-700">
                            {script.type} • {script.status}
                          </p>
                          <p className="text-xs text-blue-600">
                            Created: {script.createdDate}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Files Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Uploaded Files
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.length === 0 ? (
                    <p className="text-sm text-green-600 italic">
                      No files uploaded
                    </p>
                  ) : (
                    files.map((file, index) => (
                      <label
                        key={`${file.id}-${index}`}
                        className="flex items-start space-x-3 p-2 hover:bg-green-100 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItemsToShare.files.includes(file.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                files: [...selectedItemsToShare.files, file.id],
                              });
                            } else {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                files: selectedItemsToShare.files.filter(
                                  (id) => id !== file.id
                                ),
                              });
                            }
                          }}
                          className="mt-1 text-green-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-green-900 text-sm">
                            {file.name}
                          </p>
                          <p className="text-xs text-green-700">
                            {file.type.split("/").pop()} • {file.size}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Selection Summary */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  Selected: {selectedItemsToShare.scripts.length} script(s),{" "}
                  {selectedItemsToShare.files.length} file(s)
                </p>
              </div>
            </div>

            {/* Share Form */}
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="shareScriptTo"
                  className="text-sm font-medium text-gray-700"
                >
                  Send To: *
                </Label>
                <div className="space-y-2 mt-1">
                  {/* Preset email options */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="both"
                        checked={shareScriptForm.to === "both"}
                        onChange={(e) =>
                          setShareScriptForm({
                            ...shareScriptForm,
                            to: e.target.value,
                            customEmail: "",
                          })
                        }
                        className="text-pink-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Both</span> -{" "}
                        {editCoupleInfo.brideEmail}, {editCoupleInfo.groomEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="bride"
                        checked={shareScriptForm.to === "bride"}
                        onChange={(e) =>
                          setShareScriptForm({
                            ...shareScriptForm,
                            to: e.target.value,
                            customEmail: "",
                          })
                        }
                        className="text-pink-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">
                          {editCoupleInfo.brideName}
                        </span>{" "}
                        - {editCoupleInfo.brideEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="groom"
                        checked={shareScriptForm.to === "groom"}
                        onChange={(e) =>
                          setShareScriptForm({
                            ...shareScriptForm,
                            to: e.target.value,
                            customEmail: "",
                          })
                        }
                        className="text-pink-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">
                          {editCoupleInfo.groomName}
                        </span>{" "}
                        - {editCoupleInfo.groomEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="custom"
                        checked={shareScriptForm.customEmail !== ""}
                        onChange={(e) =>
                          setShareScriptForm({
                            ...shareScriptForm,
                            to: "",
                            customEmail: "custom",
                          })
                        }
                        className="text-pink-600"
                      />
                      <span className="text-sm font-medium">
                        Other email address:
                      </span>
                    </label>
                  </div>
                  {/* Custom email input */}
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={
                      shareScriptForm.customEmail === "custom"
                        ? ""
                        : shareScriptForm.customEmail
                    }
                    onChange={(e) =>
                      setShareScriptForm({
                        ...shareScriptForm,
                        to: "",
                        customEmail: e.target.value,
                      })
                    }
                    disabled={
                      shareScriptForm.to !== "" &&
                      shareScriptForm.customEmail === ""
                    }
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="shareScriptSubject"
                  className="text-sm font-medium text-gray-700"
                >
                  Subject: *
                </Label>
                <Input
                  id="shareScriptSubject"
                  value={shareScriptForm.subject}
                  onChange={(e) =>
                    setShareScriptForm({
                      ...shareScriptForm,
                      subject: e.target.value,
                    })
                  }
                  placeholder="Email subject"
                  className="mt-1 border-pink-200 focus:border-pink-500"
                />
              </div>

              <div>
                <Label
                  htmlFor="shareScriptBody"
                  className="text-sm font-medium text-gray-700"
                >
                  Message: *
                </Label>
                <Textarea
                  id="shareScriptBody"
                  value={shareScriptForm.body}
                  onChange={(e) =>
                    setShareScriptForm({
                      ...shareScriptForm,
                      body: e.target.value,
                    })
                  }
                  placeholder="Personal message to accompany the script"
                  rows={6}
                  className="mt-1 border-pink-200 focus:border-pink-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeNotes"
                  checked={shareScriptForm.includeNotes}
                  onChange={(e) =>
                    setShareScriptForm({
                      ...shareScriptForm,
                      includeNotes: e.target.checked,
                    })
                  }
                  className="text-pink-600"
                />
                <Label htmlFor="includeNotes" className="text-sm text-gray-700">
                  Include script notes and instructions
                </Label>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Share Preview</h5>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">To:</span>{" "}
                  {shareScriptForm.to === "both"
                    ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
                    : shareScriptForm.to === "bride"
                      ? editCoupleInfo.brideEmail
                      : shareScriptForm.to === "groom"
                        ? editCoupleInfo.groomEmail
                        : shareScriptForm.customEmail || "No recipient selected"}
                </p>
                <p>
                  <span className="font-medium">Subject:</span>{" "}
                  {shareScriptForm.subject || "No subject"}
                </p>
                <p>
                  <span className="font-medium">Items:</span>{" "}
                  {selectedItemsToShare.scripts.length +
                    selectedItemsToShare.files.length}{" "}
                  selected
                </p>
                <p>
                  <span className="font-medium">Include Notes:</span>{" "}
                  {shareScriptForm.includeNotes ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowShareScriptDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendScript}
              className="bg-pink-500 hover:bg-pink-600"
              disabled={
                (!shareScriptForm.to && !shareScriptForm.customEmail) ||
                !shareScriptForm.subject.trim() ||
                !shareScriptForm.body.trim() ||
                (selectedItemsToShare.scripts.length === 0 &&
                  selectedItemsToShare.files.length === 0)
              }
            >
              <Send className="w-4 h-4 mr-2" />
              Share Items
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Officiant Dashboard Dialog */}
      <OfficiantDashboardDialog
        open={showDashboardDialog}
        onOpenChange={setShowDashboardDialog}
        couples={allCouples}
        initialView={dashboardInitialView}
        onSelectCouple={(ceremonyId) => {
          // Find the couple by ID and set as active
          const coupleIndex = allCouples.findIndex(
            (c) => c.id.toString() === ceremonyId
          );
          if (coupleIndex !== -1) {
            setActiveCoupleIndex(coupleIndex);
            setEditCoupleInfo(allCouples[coupleIndex]);
            // Load the wedding details for the selected couple
            setEditWeddingDetails(
              allCouples[coupleIndex].weddingDetails || {
                venueName: "",
                venueAddress: "",
                weddingDate: "",
                startTime: "",
                endTime: "",
                expectedGuests: "",
              }
            );
          }
        }}
        onAddCeremony={(newCouple) => {
          // Add new couple to the list
          const newId = Math.max(...allCouples.map((c) => c.id), 0) + 1;
          const coupleWithId = {
            id: newId,
            brideName: newCouple.brideName || "New Partner 1",
            brideEmail: newCouple.brideEmail || "",
            bridePhone: newCouple.bridePhone || "",
            brideAddress: newCouple.brideAddress || "",
            groomName: newCouple.groomName || "New Partner 2",
            groomEmail: newCouple.groomEmail || "",
            groomPhone: newCouple.groomPhone || "",
            groomAddress: newCouple.groomAddress || "",
            address: newCouple.address || "",
            emergencyContact: newCouple.emergencyContact || "",
            specialRequests: newCouple.specialRequests || "",
            isActive: true,
            colors: getCoupleColors(newId), // Assign consistent colors based on ID
            weddingDetails: {
              venueName: newCouple.weddingDetails?.venueName || "",
              venueAddress: newCouple.weddingDetails?.venueAddress || "",
              weddingDate:
                newCouple.weddingDetails?.weddingDate ||
                new Date().toISOString().split("T")[0],
              startTime: newCouple.weddingDetails?.startTime || "12:00",
              endTime: newCouple.weddingDetails?.endTime || "",
              expectedGuests: newCouple.weddingDetails?.expectedGuests || "0",
              officiantNotes: "",
            },
            paymentInfo: {
              totalAmount: 0,
              depositPaid: 0,
              balance: 0,
              depositDate: "",
              finalPaymentDue: "",
              paymentStatus: "unpaid",
            },
            paymentHistory: [],
          };
          const updatedCouples = [...allCouples, coupleWithId];
          setAllCouples(updatedCouples);

          // Set the newly created couple as the active couple
          setActiveCoupleIndex(updatedCouples.length - 1);
          setEditCoupleInfo(coupleWithId);

          // Load the wedding details for the new couple
          setEditWeddingDetails(coupleWithId.weddingDetails);
        }}
      />

      {/* Welcome Dialog - First Time User */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl text-blue-900 mb-2">
              Welcome to OrdainedPro! 🎉
            </DialogTitle>
            <DialogDescription className="text-base">
              Let's get your profile set up so you can start managing your
              ceremonies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg text-blue-900 mb-3">
                Quick Setup Guide
              </h3>
              <p className="text-gray-700 mb-4">
                Before you start managing ceremonies, let's set up your
                professional profile. This will help couples find you and make
                your invoices and communications more professional.
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Set up your profile
                    </p>
                    <p className="text-sm text-gray-600">
                      Add your name, business name, contact info, and
                      professional details
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Add your ceremonies
                    </p>
                    <p className="text-sm text-gray-600">
                      Start adding couples and managing your wedding ceremonies
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Build scripts and manage payments
                    </p>
                    <p className="text-sm text-gray-600">
                      Use our tools to create scripts, send invoices, and track
                      payments
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>
                    Your business name and contact information will appear on
                    all invoices sent to couples, so make sure to complete your
                    profile first.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem("hasVisitedOrdainedPro", "true");
                setShowWelcomeDialog(false);
              }}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleWelcomeComplete}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <User className="w-4 h-4 mr-2" />
              Set Up My Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Payments Dialog */}
      <Dialog
        open={showPendingPaymentsDialog}
        onOpenChange={setShowPendingPaymentsDialog}
      >
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-900">
              Pending Payments Overview
            </DialogTitle>
            <DialogDescription>
              Couples with outstanding balances
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[70vh] py-4">
            {(() => {
              const couplesWithPending = allCouples.filter(
                (couple) => (couple.paymentInfo?.balance || 0) > 0
              );

              if (couplesWithPending.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      All Caught Up!
                    </h3>
                    <p className="text-gray-600">
                      No pending payments at this time.
                    </p>
                  </div>
                );
              }

              return couplesWithPending.map((couple) => {
                const pendingInvoices = (couple.paymentHistory || []).filter(
                  (p) => p.status === "pending"
                );

                return (
                  <Card key={couple.id} className="border-amber-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback
                                className={`text-white font-semibold ${couple.colors?.bride || "bg-pink-500"
                                  }`}
                              >
                                {couple.brideName?.charAt(0) || "B"}
                              </AvatarFallback>
                            </Avatar>
                            <Avatar className="w-10 h-10">
                              <AvatarFallback
                                className={`text-white font-semibold ${couple.colors?.groom || "bg-blue-500"
                                  }`}
                              >
                                {couple.groomName?.charAt(0) || "G"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <CardTitle className="text-lg text-gray-900">
                              {couple.brideName} & {couple.groomName}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              Wedding:{" "}
                              {new Date(
                                couple.weddingDetails?.weddingDate || ""
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-amber-600 text-white">
                          Balance Due: $
                          {couple.paymentInfo?.balance?.toLocaleString() || 0}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Total Amount
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            $
                            {couple.paymentInfo?.totalAmount?.toLocaleString() ||
                              0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Paid</p>
                          <p className="text-lg font-semibold text-green-700">
                            $
                            {couple.paymentInfo?.depositPaid?.toLocaleString() ||
                              0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Balance</p>
                          <p className="text-lg font-semibold text-amber-700">
                            $
                            {couple.paymentInfo?.balance?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>

                      {pendingInvoices.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Pending Invoices:
                          </p>
                          <div className="space-y-2">
                            {pendingInvoices.map((invoice) => (
                              <div
                                key={invoice.id}
                                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <Receipt className="w-5 h-5 text-amber-600" />
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {invoice.type}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      Due: {invoice.date}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-semibold text-amber-900">
                                  ${invoice.amount.toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center space-x-2">
                        <Button
                          onClick={() => {
                            const coupleIndex = allCouples.findIndex(
                              (c) => c.id === couple.id
                            );
                            if (coupleIndex !== -1) {
                              setActiveCoupleIndex(coupleIndex);
                              setEditCoupleInfo(allCouples[coupleIndex]);
                              setEditWeddingDetails(
                                allCouples[coupleIndex].weddingDetails
                              );
                              setShowPendingPaymentsDialog(false);
                              setShowRecordPaymentDialog(true);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Record Payment
                        </Button>
                        <Button
                          onClick={() => {
                            const coupleIndex = allCouples.findIndex(
                              (c) => c.id === couple.id
                            );
                            if (coupleIndex !== -1) {
                              setActiveCoupleIndex(coupleIndex);
                              setEditCoupleInfo(allCouples[coupleIndex]);
                              setEditWeddingDetails(
                                allCouples[coupleIndex].weddingDetails
                              );
                              setShowPendingPaymentsDialog(false);
                              handleOpenPaymentReminderDialog();
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Send Reminder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              Total Outstanding:{" "}
              <span className="font-semibold text-amber-900 text-lg">
                $
                {allCouples
                  .reduce(
                    (sum, couple) => sum + (couple.paymentInfo?.balance || 0),
                    0
                  )
                  .toLocaleString()}
              </span>
            </div>
            <Button
              onClick={() => setShowPendingPaymentsDialog(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Wedding Ceremony Invoice</DialogTitle>
            <DialogDescription>
              Invoice for {editCoupleInfo.brideName} &{" "}
              {editCoupleInfo.groomName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 overflow-y-auto flex-1">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-blue-900">
                    {officiantProfile.businessName ||
                      "Grace Wedding Ceremonies"}
                  </h3>
                  <p className="text-sm text-blue-700">
                    Wedding Officiant Services
                  </p>
                  {officiantProfile.phone && (
                    <p className="text-sm text-gray-600 mt-1">
                      <Phone className="w-3 h-3 inline mr-1" />
                      {officiantProfile.phone}
                    </p>
                  )}
                  {officiantProfile.website && (
                    <p className="text-sm text-blue-600 hover:text-blue-700">
                      <Globe className="w-3 h-3 inline mr-1" />
                      {officiantProfile.website}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Invoice Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Bill To:</p>
                  <p className="font-semibold text-gray-900">
                    {editCoupleInfo.brideName} & {editCoupleInfo.groomName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {editCoupleInfo.brideEmail}
                  </p>
                  <p className="text-sm text-gray-600">
                    {editCoupleInfo.bridePhone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Wedding Date:</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(
                      editWeddingDetails.weddingDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {editWeddingDetails.venueName}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Service
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        Wedding Ceremony Officiant Services
                      </p>
                      <p className="text-sm text-gray-500">
                        Professional officiant services for wedding ceremony
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ${paymentInfo.totalAmount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    ${paymentInfo.totalAmount}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-gray-900 text-lg">
                    ${paymentInfo.totalAmount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Paid to Date:</span>
                  <span className="font-semibold text-green-700">
                    ${paymentInfo.depositPaid}
                  </span>
                </div>
                <div className="flex justify-between text-lg border-t pt-3">
                  <span
                    className={`font-bold ${paymentInfo.balance === 0
                      ? "text-green-600"
                      : "text-orange-600"
                      }`}
                  >
                    {paymentInfo.balance === 0
                      ? "PAID IN FULL"
                      : "Balance Due:"}
                  </span>
                  <span
                    className={`font-bold text-xl ${paymentInfo.balance === 0
                      ? "text-green-700"
                      : "text-orange-700"
                      }`}
                  >
                    ${paymentInfo.balance}
                  </span>
                </div>
                {paymentInfo.balance > 0 && (
                  <div className="flex justify-between text-sm bg-orange-50 p-3 rounded-lg border border-orange-200 mt-3">
                    <span className="text-orange-800">Payment Due Date:</span>
                    <span className="font-semibold text-orange-900">
                      {paymentInfo.finalPaymentDue}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Payment History
              </h4>
              <div className="space-y-2">
                {paymentHistory
                  .filter((p) => p.status === "completed")
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {payment.type}
                        </p>
                        <p className="text-xs text-gray-600">
                          {payment.date} • {payment.method}
                        </p>
                      </div>
                      <p className="font-bold text-green-700">
                        ${payment.amount}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t mt-4 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowInvoiceDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                window.print();
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog
        open={showRecordPaymentDialog}
        onOpenChange={setShowRecordPaymentDialog}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
            <DialogDescription>
              Record a payment received for {editCoupleInfo.brideName} &{" "}
              {editCoupleInfo.groomName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Balance */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-800">
                  Current Balance Due:
                </span>
                <span className="text-2xl font-bold text-orange-900">
                  ${paymentInfo.balance}
                </span>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={paymentInfo.balance}
                    value={newPayment.amount}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, amount: e.target.value })
                    }
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: ${paymentInfo.balance}
                </p>
              </div>

              <div>
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={newPayment.date}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, date: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <select
                  id="paymentMethod"
                  value={newPayment.method}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, method: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Venmo">Venmo</option>
                  <option value="Zelle">Zelle</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                <Textarea
                  id="paymentNotes"
                  value={newPayment.notes}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, notes: e.target.value })
                  }
                  placeholder="Add any notes about this payment..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Preview */}
            {newPayment.amount && parseFloat(newPayment.amount) > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">
                  Payment Preview
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-800">Payment Amount:</span>
                    <span className="font-bold text-green-900">
                      ${parseFloat(newPayment.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-800">New Balance:</span>
                    <span className="font-bold text-green-900">
                      $
                      {(
                        paymentInfo.balance - parseFloat(newPayment.amount)
                      ).toFixed(2)}
                    </span>
                  </div>
                  {paymentInfo.balance - parseFloat(newPayment.amount) ===
                    0 && (
                      <div className="mt-3 p-2 bg-green-100 rounded-lg border border-green-300">
                        <p className="text-center font-bold text-green-800">
                          🎉 This payment will mark the invoice as PAID IN FULL!
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowRecordPaymentDialog(false);
                setNewPayment({
                  amount: "",
                  date: new Date().toISOString().split("T")[0],
                  method: "Credit Card",
                  notes: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={
                !newPayment.amount || parseFloat(newPayment.amount) <= 0
              }
              className="bg-green-500 hover:bg-green-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Script Dialog */}
      <UploadScriptDialog
        open={showUploadScriptDialog}
        onOpenChange={setShowUploadScriptDialog}
        onUploadSuccess={() => {
          // Refresh the script library or show success message
          console.log("Script uploaded successfully");
        }}
      />

      {/* Library Script Editor Dialog */}
      <ScriptEditorDialog
        open={showLibraryScriptEditor}
        onOpenChange={setShowLibraryScriptEditor}
        initialContent={selectedLibraryScript?.content || ""}
        initialFileName={selectedLibraryScript?.title || "script.txt"}
        scriptId={selectedLibraryScript?.id?.toString() || ""}
        scriptTitle={selectedLibraryScript?.title || ""}
        onSaved={(content) => {
          console.log("Library script saved:", content);
          // You can update the script in the library here if needed
        }}
      />

      {/* Script Pricing Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-blue-900">
              Set Script Price
            </DialogTitle>
            <DialogDescription>
              Update the price for "{selectedScriptForPricing?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label
                htmlFor="script-price"
                className="text-base font-semibold mb-3 block"
              >
                Price (USD)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="script-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={scriptPriceForm.price}
                  onChange={(e) =>
                    setScriptPriceForm({ price: e.target.value })
                  }
                  placeholder="25.00"
                  className="pl-10 text-lg"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Set a competitive price for your script. Consider the length,
                quality, and uniqueness of your content.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">
                Pricing Suggestions
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Basic Script:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={() => setScriptPriceForm({ price: "15" })}
                  >
                    $15
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    Standard Script:
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={() => setScriptPriceForm({ price: "25" })}
                  >
                    $25
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Premium Script:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={() => setScriptPriceForm({ price: "35" })}
                  >
                    $35
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold mb-1">Earnings Potential</p>
                  <p>
                    If your script sells {selectedScriptForPricing?.sales || 10}{" "}
                    times at ${scriptPriceForm.price || 0}, you'll earn $
                    {(
                      (parseFloat(scriptPriceForm.price) || 0) *
                      (selectedScriptForPricing?.sales || 10)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowPricingDialog(false);
                setSelectedScriptForPricing(null);
                setScriptPriceForm({ price: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveScriptPrice}
              disabled={
                !scriptPriceForm.price || parseFloat(scriptPriceForm.price) < 0
              }
              className="bg-green-500 hover:bg-green-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Price
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Script Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-purple-900 flex items-center">
              <Globe className="w-6 h-6 mr-2" />
              Publish to Marketplace
            </DialogTitle>
            <DialogDescription>
              Make "{selectedScriptForPublish?.title}" available for purchase
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">
                Script Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Title:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedScriptForPublish?.title}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Price:</span>
                  <span className="font-semibold text-green-700">
                    ${selectedScriptForPublish?.price}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Rating:</span>
                  <span className="font-semibold text-gray-900 flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                    {selectedScriptForPublish?.rating}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Publishing Guidelines</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your script will be visible to all officiants</li>
                    <li>You'll earn revenue from each purchase</li>
                    <li>You can unpublish at any time</li>
                    <li>Ensure your script is polished and professional</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start space-x-2">
                <ShoppingCart className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold mb-1">Earnings Potential</p>
                  <p>
                    Based on similar scripts, you could earn approximately $
                    {((selectedScriptForPublish?.price || 0) * 20).toFixed(0)}-$
                    {((selectedScriptForPublish?.price || 0) * 50).toFixed(
                      0
                    )}{" "}
                    per month
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowPublishDialog(false);
                setSelectedScriptForPublish(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPublish}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Globe className="w-4 h-4 mr-2" />
              Publish to Marketplace
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generated Script Editor Dialog */}
      <ScriptEditorDialog
        open={showScriptEditorDialog}
        onOpenChange={setShowScriptEditorDialog}
        initialContent={editingScript?.content || scriptContent || ""}
        initialFileName={editingScript?.title || "Generated Script.txt"}
        scriptId={editingScript?.id?.toString() || ""}
        scriptTitle={editingScript?.title || "Generated Ceremony Script"}
        onSaved={(content) => {
          console.log("Generated script saved:", content);
          // Update the generated script content
          setGeneratedScriptContent(content);
          setScriptContent(content);
        }}
      />

      {/* Segment Regeneration Dialog */}
      <Dialog open={showSegmentDialog} onOpenChange={setShowSegmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🔄 Regenerate Segment
            </DialogTitle>
            <DialogDescription>
              {selectedSegmentIndex !== null && (
                <span className="font-medium text-blue-600">
                  Part {selectedSegmentIndex + 1}: {SEGMENT_NAMES[selectedSegmentIndex]}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              This will regenerate only this segment while keeping all other parts of your ceremony unchanged.
            </p>
            <div className="space-y-2">
              <Label htmlFor="segment-instructions">
                Special Instructions (optional)
              </Label>
              <Textarea
                id="segment-instructions"
                placeholder="e.g., 'Make it more personal', 'Add humor', 'Include a reference to how they met at the coffee shop', 'Make it shorter'..."
                value={segmentInstructions}
                onChange={(e) => setSegmentInstructions(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500">
                Leave blank for a fresh version, or add instructions for specific changes.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSegmentDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={regenerateSingleSegment}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Regenerate This Segment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
