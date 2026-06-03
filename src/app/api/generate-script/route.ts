import { NextRequest, NextResponse } from "next/server";
import {
  MR_SCRIPT_SERVICES,
  getMrScriptServiceByResponse,
  type MrScriptService,
} from "@/data/mr-script-services";
import {
  formatReadingsForPrompt,
  getReadingRecommendations,
} from "@/data/ceremony-readings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ScriptSegment = {
  id: string;
  name: string;
  sections: string[];
  wordTarget: number;
};

const EULOGY_SCRIPT_SECTIONS = [
  "Opening Acknowledgment",
  "Words of Sympathy",
  "Life Tribute",
  "Personal Stories",
  "Reading or Reflection",
  "Closing Tribute",
];

type ScriptGenerationBody = {
  ceremonyType?: string;
  ceremonyStyle?: string;
  ceremonyLength?: string;
  ceremonyTone?: string;
  officiantStyle?: string;
  brideName?: string;
  groomName?: string;
  subjectName?: string;
  venue?: string;
  weddingDate?: string;
  ceremonyDate?: string;
  userResponses?: Record<string, string>;
  storyNotes?: string;
  coreDetails?: string;
  specialInclusions?: string;
  lovedOneHonorStyle?: string;
  avoidances?: string;
  unityCeremony?: string;
  vowsType?: string;
  readingStyle?: string;
  readingText?: string;
  religiousElements?: string;
  culturalTraditions?: string;
  ceremonyProfileContext?: Record<string, any>;
  refinementInstructions?: string;
  regenerateSegmentIndex?: number;
  existingSegments?: string[];
  segmentInstructions?: string;
  usePremiumModel?: boolean;
};

const TARGET_WORDS_PER_MINUTE = 125;

const DURATION_WORD_TARGETS: Record<string, number> = {
  "5-10 minutes": 1250,
  "10-15 minutes": 1875,
  "15-20 minutes": 2500,
  "20-30 minutes": 3750,
  "25-30 minutes": 3750,
  "30-45 minutes": 5625,
  "45 minutes": 5625,
  "45+ minutes": 5625,
};

const normalize = (value?: string) => (value || "").trim();

const safeList = (items: string[]) => items.filter(Boolean).map((item) => `- ${item}`).join("\n");

const parseDurationUpperMinutes = (duration?: string) => {
  if (!duration) return 30;
  const numbers = duration.match(/\d+/g)?.map(Number) || [];
  if (numbers.length >= 2) return Math.max(...numbers);
  if (numbers.length === 1) return numbers[0];
  return 30;
};

const getTargetWordCount = (duration?: string) => {
  const normalizedDuration = normalize(duration);
  const explicitTarget = DURATION_WORD_TARGETS[normalizedDuration];
  if (explicitTarget) return explicitTarget;

  const minutes = parseDurationUpperMinutes(duration);
  return Math.min(6000, Math.max(650, minutes * TARGET_WORDS_PER_MINUTE));
};

const chunkSections = (sections: string[], chunkCount: number) => {
  const chunks: string[][] = [];
  const safeChunkCount = Math.max(1, Math.min(chunkCount, sections.length || 1));

  for (let i = 0; i < safeChunkCount; i += 1) {
    const start = Math.floor((i * sections.length) / safeChunkCount);
    const end = Math.floor(((i + 1) * sections.length) / safeChunkCount);
    chunks.push(sections.slice(start, end));
  }

  return chunks.map((chunk, index) => (chunk.length ? chunk : [sections[index] || "Ceremony Section"]));
};

const getScriptSectionsForBody = (service: MrScriptService, body?: ScriptGenerationBody) => {
  const selectedType = [
    body?.ceremonyType,
    body?.ceremonyStyle,
    body?.userResponses?.["ceremony-type"],
    body?.coreDetails,
    body?.storyNotes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (service.id === "writing_service" && /\beulogy\b|\bcelebration of life\b|\bmemorial\b|\btribute\b/.test(selectedType)) {
    return EULOGY_SCRIPT_SECTIONS;
  }

  return service.scriptSections.length ? service.scriptSections : ["Opening", "Main Message", "Closing"];
};

const getSegmentCount = (service: MrScriptService, sectionCount: number, duration?: string) => {
  const minutes = parseDurationUpperMinutes(duration);
  if (service.id === "writing_service") return Math.min(4, sectionCount);
  if (minutes <= 10) return Math.min(3, sectionCount);
  if (minutes <= 20) return Math.min(4, sectionCount);
  return Math.min(6, sectionCount);
};

const buildSegments = (service: MrScriptService, duration?: string, body?: ScriptGenerationBody): ScriptSegment[] => {
  const sections = getScriptSectionsForBody(service, body);
  const segmentCount = getSegmentCount(service, sections.length, duration);
  const totalWords = getTargetWordCount(duration);
  const chunks = chunkSections(sections, segmentCount);

  return chunks.map((chunk, index) => ({
    id: `${service.id}-${index + 1}`,
    name: chunk.length === 1 ? chunk[0] : `${chunk[0]} to ${chunk[chunk.length - 1]}`,
    sections: chunk,
    wordTarget: Math.max(280, Math.round(totalWords / chunks.length)),
  }));
};

const getSubjectName = (body: ScriptGenerationBody, service: MrScriptService) => {
  const responses = body.userResponses || {};
  const responseSubject =
    responses["honoree-name"] ||
    responses["loved-one-name"] ||
    responses["child-name"] ||
    responses["core-details"];

  if (body.subjectName) return body.subjectName;
  if (service.id === "wedding" || service.id === "vow_renewal") {
    return [body.brideName, body.groomName].filter(Boolean).join(" & ") || "the couple";
  }
  return responseSubject || [body.brideName, body.groomName].filter(Boolean).join(" & ") || "this ceremony";
};

const getSensitivityInstructions = (service: MrScriptService) => {
  const serviceToneRules = service.toneRules || [];

  if (service.sensitivity === "grief") {
    return [
      "Use a gentle, compassionate, grounded tone.",
      "Offer comfort without sounding salesy, cheerful, or performative.",
      "Do not assume religious beliefs. Include spiritual or religious language only if the details request it.",
      "Use careful language around loss, family grief, remembrance, and legacy.",
      ...serviceToneRules,
    ];
  }

  if (service.sensitivity === "celebratory") {
    return [
      "Use warm, joyful, polished language that still sounds natural when spoken aloud.",
      "Keep the ceremony personal and human, not generic or overly ornate.",
      "Include stage directions only where they help the officiant perform the ceremony.",
      ...serviceToneRules,
    ];
  }

  return [
    "Use a respectful, flexible tone that matches the life moment described by the user.",
    "Do not assume religion, culture, relationship structure, or legal meaning unless provided.",
    "Keep the script useful for an officiant to read aloud.",
    ...serviceToneRules,
  ];
};

const getFaithStyleInstructions = (body: ScriptGenerationBody) => {
  const responses = body.userResponses || {};
  const styleText = [
    body.officiantStyle,
    body.ceremonyTone,
    responses["officiant-style"],
    responses["ceremony-tone"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\bvery\s+religious\b/.test(styleText)) {
    return [
      "The selected officiant style is Very religious.",
      "Use clearly faith-forward language throughout the ceremony, including prayerful cadence, blessings, sacred commitment language, and reverent references to God or faith when appropriate.",
      "Still avoid naming a specific denomination, scripture passage, ritual rule, or closed-tradition practice unless the submitted details provide it.",
      "If the faith tradition is not specified, use broadly inclusive religious language and bracket any tradition-specific details for confirmation.",
    ];
  }

  if (/\breligious\b/.test(styleText) && !/\bnot overly religious\b|\bnon[-\s]?religious\b/.test(styleText)) {
    return [
      "The selected officiant style is Religious.",
      "Include meaningful faith language, blessings, and references to sacred commitment, but keep the ceremony accessible and not sermon-like unless the submitted details ask for that.",
      "Do not invent a denomination, scripture passage, or tradition-specific ritual details unless provided.",
    ];
  }

  if (/\bspiritual but not overly religious\b/.test(styleText)) {
    return [
      "The selected officiant style is Spiritual but not overly religious.",
      "Use gentle spiritual language, gratitude, blessing, and meaning-focused wording without making the ceremony strongly faith-forward.",
      "Avoid denomination-specific wording, scripture, or heavy religious claims unless provided.",
    ];
  }

  return [];
};

const getServiceBoundaries = (service: MrScriptService) => {
  const sharedBoundaries = [
    service.legalStatus === "possibly" || service.legalStatus === "yes"
      ? "Mention legal requirements only generally and remind the officiant to confirm local requirements; do not provide legal advice."
      : "",
    service.religiousOrCultural === "required"
      ? "Religious or cultural wording must be treated as user-provided or family-approved; do not invent sacred authority, exact ritual rules, or closed-tradition language."
      : "Religious or cultural language is optional. Include it only when the submitted details request it.",
    service.virtualAvailable === "depends"
      ? "If this could be virtual, remind the officiant that legal or ceremonial validity may depend on location and ceremony type."
      : "",
    service.canBeWritingOnly && !service.writingOnly
      ? "This service can also be written as a standalone script, insert, speech, or outline if the user asks for writing-only help."
      : "",
    service.officiantRequirements?.length
      ? `Officiant requirements to respect: ${service.officiantRequirements.join(" ")}`
      : "",
  ].filter(Boolean);

  if (service.id === "wedding") {
    return [
      "Wedding-specific language such as vows, rings, declaration of intent, and pronouncement is allowed when appropriate.",
      "Use partner language unless the submitted names or details clearly require different wording.",
      "Mention legal requirements only generally; do not give legal advice.",
      ...sharedBoundaries,
    ];
  }

  if (service.id === "vow_renewal") {
    return [
      "This is a recommitment ceremony, not a new legal marriage ceremony.",
      "Do not include legal pronouncement language.",
      "Renewed vows, optional ring rededication, family recognition, and anniversary reflection are appropriate.",
      ...sharedBoundaries,
    ];
  }

  if (service.id === "writing_service") {
    return [
      "This may be a speech, eulogy, toast, vows, reading, or outline rather than a full ceremony.",
      "Write the requested piece directly and avoid adding unrelated ceremony structure.",
      ...sharedBoundaries,
    ];
  }

  return [
    "Do not include wedding-only language such as marriage pronouncement, ring exchange, vows, bride/groom assumptions, or legal marriage language unless the user explicitly asks for it.",
    "Use the service category and details to choose appropriate ceremony wording.",
    ...sharedBoundaries,
  ];
};

const buildContextBlock = (body: ScriptGenerationBody, service: MrScriptService) => {
  const responses = body.userResponses || {};
  const profileContext = body.ceremonyProfileContext || {};
  const subjectName = getSubjectName(body, service);
  const date = normalize(body.ceremonyDate) || normalize(body.weddingDate) || "date to be confirmed";
  const venue = normalize(body.venue) || "location to be confirmed";
  const targetDuration = body.ceremonyLength || responses["ceremony-duration"] || "20-30 minutes";
  const targetWordCount = getTargetWordCount(targetDuration);
  const intakeResponses =
    Object.entries(responses)
      .filter(([key, value]) => key.startsWith("intake-") && normalize(value))
      .map(([key, value]) => `${key.replace(/^intake-/, "").replace(/-/g, " ")}: ${value}`)
      .join("\n") || "No additional intake details provided yet.";

  const profileFacts = Array.isArray(profileContext.knownFacts)
    ? profileContext.knownFacts.filter(Boolean).map((fact) => `- ${fact}`).join("\n")
    : "";
  const readingRecommendations = getReadingRecommendations({
    ceremonyType: service.id,
    tone: body.ceremonyTone || responses["ceremony-tone"],
    specialInclusions: [
      body.specialInclusions,
      responses["special-inclusions"],
      body.lovedOneHonorStyle,
      responses["loved-one-honor-style"],
      body.unityCeremony,
      responses["special-elements"],
    ].filter(Boolean).join(" "),
    faithPreference: [
      body.religiousElements,
      body.culturalTraditions,
      responses["core-details"],
    ].filter(Boolean).join(" "),
    limit: 4,
  });

  return [
    `Service: ${service.displayName}`,
    `Service category: ${service.category}`,
    service.clientFacingDescription ? `Client-facing service description: ${service.clientFacingDescription}` : "",
    `Legal ceremony status: ${service.legalStatus}`,
    `Grief-related: ${service.griefRelated ? "yes" : "no"}`,
    `Writing-only service: ${service.writingOnly ? "yes" : "no"}`,
    `Religious or cultural elements: ${service.religiousOrCultural || "optional"}`,
    `Virtual availability: ${service.virtualAvailable}`,
    service.defaultDuration ? `Default service duration: ${service.defaultDuration}` : "",
    service.suggestedChecklist?.length ? `Suggested checklist items:\n${safeList(service.suggestedChecklist)}` : "",
    `Subject / people involved: ${subjectName}`,
    profileContext.ceremonyLabel ? `Profile ceremony label: ${profileContext.ceremonyLabel}` : "",
    profileContext.partner1Name ? `Profile partner/contact 1: ${profileContext.partner1Name}` : "",
    profileContext.partner2Name ? `Profile partner/contact 2: ${profileContext.partner2Name}` : "",
    profileContext.honoreeName ? `Profile honoree: ${profileContext.honoreeName}` : "",
    profileContext.childName ? `Profile child: ${profileContext.childName}` : "",
    profileContext.deceasedName ? `Profile deceased/loved one: ${profileContext.deceasedName}` : "",
    profileContext.parentGuardianNames ? `Profile parent/guardian names: ${profileContext.parentGuardianNames}` : "",
    profileContext.primaryContactName ? `Profile primary family contact: ${profileContext.primaryContactName}` : "",
    `Date: ${date}`,
    `Location: ${venue}`,
    `Target length: ${targetDuration}`,
    `Target word count: approximately ${targetWordCount.toLocaleString()} words. Aim for the higher end of the selected ceremony length instead of the shortest acceptable draft.`,
    `Tone: ${body.ceremonyTone || responses["ceremony-tone"] || service.toneOptions[0] || "Warm and natural"}`,
    `Officiant style: ${body.officiantStyle || responses["officiant-style"] || "Warm, natural, and professional"}`,
    `Core details: ${body.coreDetails || responses["core-details"] || "No extra core details provided yet."}`,
    `Story notes: ${body.storyNotes || responses["story-notes"] || "No story notes provided yet."}`,
    `Special inclusions: ${body.specialInclusions || responses["special-inclusions"] || "No special inclusions provided yet."}`,
    `Loved one remembrance preference: ${body.lovedOneHonorStyle || responses["loved-one-honor-style"] || "No remembrance preference provided yet. If loved ones are honored but names are not confirmed, use general inclusive language rather than naming specific people."}`,
    `Service-specific intake:\n${intakeResponses}`,
    `Avoidances: ${body.avoidances || responses["avoidances"] || "No avoidances provided yet."}`,
    `Unity / ritual notes: ${body.unityCeremony || responses["special-elements"] || "None specified"}`,
    `Vow / promise notes: ${body.vowsType || responses["vows-type"] || "None specified"}`,
    `Reading notes: ${body.readingText || body.readingStyle || "None specified"}`,
    `Recommended safe reading library options:\n${formatReadingsForPrompt(readingRecommendations)}`,
    `Religious / cultural notes: ${[body.religiousElements, body.culturalTraditions].filter(Boolean).join("; ") || "None specified"}`,
    profileFacts ? `Known profile facts:\n${profileFacts}` : "",
  ].filter(Boolean).join("\n");
};

const buildSegmentPrompt = (
  segment: ScriptSegment,
  segmentIndex: number,
  segments: ScriptSegment[],
  service: MrScriptService,
  body: ScriptGenerationBody,
  previousContent: string,
  isRefinement: boolean,
  customInstructions?: string
) => {
  const sections = segment.sections.map((section, index) => `${index + 1}. ${section}`).join("\n");
  const context = buildContextBlock(body, service);
  const sensitivity = safeList(getSensitivityInstructions(service));
  const boundaries = safeList(getServiceBoundaries(service));
  const faithStyle = safeList(getFaithStyleInstructions(body));
  const totalTargetWords = segments.reduce((sum, item) => sum + item.wordTarget, 0);

  return `You are Mr. Script, an expert life-ceremony writing assistant for professional officiants.

Write SEGMENT ${segmentIndex + 1} of ${segments.length}: ${segment.name}.

IMPORTANT:
- Write only this segment's sections. Do not write sections assigned to other segments.
- Write in first person as the officiant speaking aloud unless the selected service is writing-only.
- Use natural spoken language, not stiff template language.
- Include concise stage directions in brackets only when useful.
- Target approximately ${segment.wordTarget} words for this segment, contributing to an overall script target near ${totalTargetWords.toLocaleString()} words.
- Prefer a complete ceremony at the higher end of the selected length. Do not shorten unless the user explicitly asks for brief wording.
- Keep names, dates, places, and details exactly as provided when possible.
- If a detail is missing, use a clean bracketed placeholder instead of inventing facts.

SERVICE CONTEXT:
${context}

SENSITIVITY RULES:
${sensitivity}

SERVICE BOUNDARIES:
${boundaries}

FAITH STYLE GUIDANCE:
${faithStyle}

THIS SEGMENT MUST INCLUDE:
${sections}

USEFUL SERVICE QUESTIONS:
Required:
${safeList(service.requiredQuestions)}

Optional:
${safeList(service.optionalQuestions)}

Story prompts:
${safeList(service.storyPrompts)}

${previousContent ? `PREVIOUS SEGMENTS FOR CONTINUITY. Do not repeat them:\n${previousContent.slice(-1800)}\n` : ""}
${isRefinement && body.refinementInstructions ? `REFINEMENT REQUEST:\n${body.refinementInstructions}\n` : ""}
${customInstructions ? `SPECIAL INSTRUCTIONS FOR THIS SEGMENT:\n${customInstructions}\n` : ""}

Now write segment ${segmentIndex + 1}: ${segment.name}.`;
};

const getOpenAIModel = (usePremiumModel?: boolean) => {
  if (usePremiumModel) {
    return process.env.OPENAI_PREMIUM_MODEL || process.env.OPENAI_MODEL || "gpt-5.5";
  }

  return process.env.OPENAI_MODEL || "gpt-5.4-mini";
};

async function callOpenAI(prompt: string, service: MrScriptService, usePremiumModel?: boolean) {
  const model = getOpenAIModel(usePremiumModel);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: [
            "You are Mr. Script, a professional ceremony script writer for officiants.",
            "You write scripts for weddings, vow renewals, memorials, celebration-of-life services, coming-of-age ceremonies, baby blessings, writing-only services, and custom life ceremonies.",
            service.sensitivity === "grief"
              ? "For grief-related work, be gentle, compassionate, restrained, and never assume religious beliefs."
              : "For celebratory work, be warm, polished, personal, and easy to speak aloud.",
            "Do not use emojis. Do not use markdown tables.",
          ].join(" "),
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 1800,
      temperature: service.sensitivity === "grief" ? 0.55 : 0.72,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: unknown;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { raw: errorText };
    }
    throw new Error(`${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function generateSegment(
  segmentIndex: number,
  segments: ScriptSegment[],
  service: MrScriptService,
  body: ScriptGenerationBody,
  previousContent: string,
  isRefinement: boolean,
  customInstructions?: string
) {
  const segment = segments[segmentIndex];
  const prompt = buildSegmentPrompt(
    segment,
    segmentIndex,
    segments,
    service,
    body,
    previousContent,
    isRefinement,
    customInstructions
  );

  return callOpenAI(prompt, service, body.usePremiumModel);
}

function buildFinalScript(
  segmentsContent: string[],
  segments: ScriptSegment[],
  service: MrScriptService,
  body: ScriptGenerationBody,
  isRefinement: boolean
) {
  const subjectName = getSubjectName(body, service);
  const date = normalize(body.ceremonyDate) || normalize(body.weddingDate) || "Date TBD";
  const venue = normalize(body.venue) || "Location TBD";
  const tone = body.ceremonyTone || body.userResponses?.["ceremony-tone"] || service.toneOptions[0] || "Warm and natural";
  const duration = body.ceremonyLength || body.userResponses?.["ceremony-duration"] || "20-30 minutes";

  const bodyText = segmentsContent
    .map((content, index) => {
      const heading = `PART ${index + 1}: ${segments[index].name.toUpperCase()}`;
      return `\n\n${"-".repeat(heading.length)}\n${heading}\n${"-".repeat(heading.length)}\n\n${content.trim()}`;
    })
    .join("");

  return `${service.displayName.toUpperCase()} SCRIPT
${isRefinement ? "REFINED VERSION\n" : ""}Prepared by Mr. Script for ${subjectName}
Service category: ${service.category}
Date: ${date}
Location: ${venue}
Target duration: ${duration}
Tone: ${tone}

${bodyText}

${"-".repeat(32)}
END OF SCRIPT
${"-".repeat(32)}

SCRIPT NOTES
- Service: ${service.displayName}
- Sensitivity: ${service.sensitivity}
- Output type: ${service.outputTypes[0] || "ceremony_script"}
- Segments generated: ${segments.length}

Prepared with Mr. Script for professional officiant review and editing.`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured", details: "Please add OPENAI_API_KEY to environment variables" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ScriptGenerationBody;
    const service = getMrScriptServiceByResponse(body.ceremonyType || body.ceremonyStyle);
    const segments = buildSegments(service, body.ceremonyLength || body.userResponses?.["ceremony-duration"], body);
    const isRefinement = Boolean(body.refinementInstructions);
    const isSingleSegment = typeof body.regenerateSegmentIndex === "number";

    if (isSingleSegment && body.existingSegments && Array.isArray(body.existingSegments)) {
      const index = Math.max(0, Math.min(body.regenerateSegmentIndex || 0, segments.length - 1));
      const previousContent = body.existingSegments.slice(0, index).join("\n\n");
      const newSegment = await generateSegment(
        index,
        segments,
        service,
        body,
        previousContent,
        false,
        body.segmentInstructions
      );

      const updatedSegments = [...body.existingSegments];
      updatedSegments[index] = newSegment;
      const finalScript = buildFinalScript(updatedSegments, segments, service, body, false);

      return NextResponse.json({
        script: finalScript,
        segments: updatedSegments,
        regeneratedIndex: index,
        serviceId: service.id,
        model: getOpenAIModel(body.usePremiumModel),
        premiumModelUsed: Boolean(body.usePremiumModel),
      });
    }

    const generatedSegments: string[] = [];
    let previousContent = "";

    for (let i = 0; i < segments.length; i += 1) {
      const segmentContent = await generateSegment(i, segments, service, body, previousContent, isRefinement);
      generatedSegments.push(segmentContent);
      previousContent += `\n\nPART ${i + 1}: ${segments[i].name}\n${segmentContent}`;

      if (i < segments.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    return NextResponse.json({
      script: buildFinalScript(generatedSegments, segments, service, body, isRefinement),
      segments: generatedSegments,
      serviceId: service.id,
      serviceName: service.displayName,
      segmentPlan: segments,
      availableServices: MR_SCRIPT_SERVICES.map((item) => item.id),
      model: getOpenAIModel(body.usePremiumModel),
      premiumModelUsed: Boolean(body.usePremiumModel),
    });
  } catch (error) {
    console.error("Error generating script:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Script generation failed",
        details: errorMessage,
        hint: "Check server logs for model access, rate limits, or missing environment variables.",
      },
      { status: 500 }
    );
  }
}
