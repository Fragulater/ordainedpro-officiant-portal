import { NextRequest, NextResponse } from "next/server";

// Define ceremony segments - each will be generated separately
// Note: Cannot export from API routes - only HTTP handlers allowed
const CEREMONY_SEGMENTS = [
  {
    id: "opening",
    name: "Opening & Welcome",
    sections: ["Processional", "Welcome & Opening Words", "Reflection on Love & Marriage"],
    wordTarget: 600,
  },
  {
    id: "declarations",
    name: "Declarations & Readings",
    sections: ["Reading (if applicable)", "Address to the Couple", "Declaration of Intent"],
    wordTarget: 500,
  },
  {
    id: "vows",
    name: "Vows & Promises",
    sections: ["Introduction to Vows", "Exchange of Vows", "Affirmation"],
    wordTarget: 500,
  },
  {
    id: "unity",
    name: "Unity & Rings",
    sections: ["Unity Ceremony (if applicable)", "Ring Ceremony", "Ring Exchange Words"],
    wordTarget: 500,
  },
  {
    id: "closing",
    name: "Closing & Pronouncement",
    sections: ["Blessing/Closing Words", "Pronouncement", "The Kiss", "Presentation to Guests", "Recessional"],
    wordTarget: 400,
  },
];

async function generateSegment(
  segmentIndex: number,
  ceremonyDetails: any,
  previousContent: string,
  isRefinement: boolean,
  customInstructions?: string
): Promise<string> {
  const segment = CEREMONY_SEGMENTS[segmentIndex];
  const {
    brideName,
    groomName,
    venue,
    weddingDate,
    ceremonyStyle,
    ceremonyLength,
    ceremonyTone,
    unityCeremony,
    vowsType,
    readingStyle,
    readingText,
    refinementInstructions,
    additionalUnity,
    religiousElements,
    culturalTraditions,
  } = ceremonyDetails;

  // Determine if this segment should include optional elements
  const includeReading = segmentIndex === 1 && readingStyle && readingStyle !== "none";
  const includeUnity = segmentIndex === 3 && unityCeremony && unityCeremony !== "None";
  const includeAdditionalUnity = segmentIndex === 3 && additionalUnity && additionalUnity !== "Skip this";
  const includeReligious = religiousElements && religiousElements !== "Skip this";

  // Build segment-specific prompt
  let segmentPrompt = `You are an expert wedding officiant writing SEGMENT ${segmentIndex + 1} of 5 for a wedding ceremony.

**CRITICAL INSTRUCTIONS:**
- Write ONLY the sections listed below - do not include sections from other segments
- Write in first person as the officiant speaking directly
- Include [stage directions in brackets] for actions
- Be detailed and heartfelt - use the FULL word count target
- This segment should be approximately ${segment.wordTarget} words
- Write as if speaking aloud at the ceremony

**COUPLE:** ${brideName} & ${groomName}
**VENUE:** ${venue || "their chosen venue"}
**DATE:** ${weddingDate || "their wedding day"}
**STYLE:** ${ceremonyStyle || "Traditional"}
**TONE:** ${ceremonyTone || "Warm and Personal"}

**SEGMENT TO WRITE: ${segment.name}**
Sections to include:
${segment.sections.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;

  // Add segment-specific details
  if (segmentIndex === 0) {
    // Opening segment
    segmentPrompt += `
**FOR THIS OPENING SEGMENT:**
- Start with [Processional music plays as the wedding party enters]
- Write a warm, engaging welcome that sets the ${ceremonyTone?.toLowerCase() || "warm"} tone
- Include a meaningful reflection on what love and marriage mean
- Acknowledge the gathered guests
- This sets the foundation for the entire ceremony
`;
  } else if (segmentIndex === 1) {
    // Declarations segment
    if (includeReading) {
      segmentPrompt += `
**READING TO INCLUDE:**
Style: ${readingStyle}
${readingText ? `Text: "${readingText}"` : "Please select an appropriate reading for this style."}
`;
    }
    segmentPrompt += `
**FOR THIS DECLARATIONS SEGMENT:**
- Transition smoothly from the opening
- Address the couple directly about their commitment
- Include the Declaration of Intent ("Do you, ${brideName}, take ${groomName}...")
- Write both questions and the responses ("I do")
`;
  } else if (segmentIndex === 2) {
    // Vows segment
    segmentPrompt += `
**VOWS TYPE:** ${vowsType || "Traditional Vows"}
**FOR THIS VOWS SEGMENT:**
${vowsType === "Personal Written Vows"
  ? "- Include placeholder: [${brideName} reads their personal vows] and [${groomName} reads their personal vows]"
  : `- Write complete traditional vows for both ${brideName} and ${groomName} to repeat
- Include the officiant's prompts and the couple's responses
- Make them meaningful and complete`}
`;
  } else if (segmentIndex === 3) {
    // Unity & Rings segment
    if (includeUnity) {
      segmentPrompt += `
**UNITY CEREMONY:** ${unityCeremony}
- Include complete instructions and words for the ${unityCeremony}
- Explain the symbolism to guests
`;
    }
    if (includeAdditionalUnity) {
      segmentPrompt += `
**ADDITIONAL UNITY CEREMONY:** ${additionalUnity}
- Also include this unity ceremony with full script
`;
    }
    segmentPrompt += `
**FOR THE RING EXCHANGE:**
- Include the presentation of rings
- Write complete ring exchange vows for both partners
- Include "With this ring, I thee wed" style promises
`;
  } else if (segmentIndex === 4) {
    // Closing segment
    if (includeReligious) {
      segmentPrompt += `
**RELIGIOUS ELEMENTS:** ${religiousElements}
- Include appropriate prayers, blessings, or religious traditions
`;
    }
    if (culturalTraditions) {
      segmentPrompt += `
**CULTURAL TRADITIONS:** ${culturalTraditions}
- Incorporate these cultural elements
`;
    }
    segmentPrompt += `
**FOR THIS CLOSING SEGMENT:**
- Write a meaningful blessing or closing words
- Include the official pronouncement: "By the power vested in me..."
- Include [The couple shares their first kiss as a married couple]
- Write the presentation: "It is my honor to present to you, for the first time..."
- End with [Recessional music plays as the newlyweds exit]
`;
  }

  // Add context from previous segments for continuity
  if (previousContent && segmentIndex > 0) {
    segmentPrompt += `
**PREVIOUS SEGMENTS (for context and continuity - do NOT repeat this content):**
${previousContent.slice(-1500)}...

Continue naturally from where the previous segment ended.
`;
  }

  // Add refinement instructions if this is a refinement
  if (isRefinement && refinementInstructions) {
    segmentPrompt += `
**REFINEMENT REQUESTS - Apply these changes:**
${refinementInstructions}
`;
  }

  // Add custom instructions for single segment regeneration
  if (customInstructions) {
    segmentPrompt += `
**SPECIAL INSTRUCTIONS FOR THIS REGENERATION:**
${customInstructions}

Apply these specific changes while maintaining the ceremony flow.
`;
  }

  segmentPrompt += `
Now write ONLY Segment ${segmentIndex + 1}: ${segment.name}
Write approximately ${segment.wordTarget} words. Be detailed and complete.`;

  // Make API call for this segment
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert wedding officiant with 20+ years of experience. You write beautiful, heartfelt ceremony scripts. Write in first person as if you are the officiant speaking. Be detailed and use the full word count requested.`,
        },
        {
          role: "user",
          content: segmentPrompt,
        },
      ],
      max_tokens: 1500, // Generous limit per segment
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { raw: errorText };
    }
    console.error(`Error generating segment ${segmentIndex}:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`Failed to generate segment ${segment.name}: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// Helper to build final script from segments array
function buildFinalScript(
  segments: string[],
  ceremonyDetails: any,
  isRefinement: boolean
): string {
  const {
    brideName,
    groomName,
    venue,
    weddingDate,
    ceremonyStyle,
    ceremonyLength,
    ceremonyTone,
    unityCeremony,
    vowsType,
    readingStyle,
    additionalUnity,
    religiousElements,
    culturalTraditions,
  } = ceremonyDetails;

  let fullScript = "";
  for (let i = 0; i < segments.length; i++) {
    fullScript += `\n\n${"═".repeat(60)}\n`;
    fullScript += `PART ${i + 1}: ${CEREMONY_SEGMENTS[i].name.toUpperCase()}\n`;
    fullScript += `${"═".repeat(60)}\n\n`;
    fullScript += segments[i];
  }

  return `${ceremonyStyle?.toUpperCase() || "WEDDING"} CEREMONY SCRIPT
${isRefinement ? "✨ REFINED VERSION ✨" : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated by Mr. Script (Powered by AI) for ${brideName} & ${groomName}
Venue: ${venue || "Wedding Venue"}
Date: ${weddingDate || "Wedding Date"}
Target Duration: ${ceremonyLength || "20-30 minutes"}

This is a COMPLETE, DETAILED ceremony script generated in 5 segments
for maximum detail and personalization.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fullScript}

${"═".repeat(60)}
END OF CEREMONY SCRIPT
${"═".repeat(60)}

CEREMONY DETAILS:
• Style: ${ceremonyStyle || "Traditional"}
• Tone: ${ceremonyTone || "Warm and Personal"}
• Duration: ${ceremonyLength || "20-30 minutes"}
${unityCeremony && unityCeremony !== "None" ? `• Unity Ceremony: ${unityCeremony}` : ""}
${additionalUnity && additionalUnity !== "Skip this" ? `• Additional Unity: ${additionalUnity}` : ""}
${religiousElements && religiousElements !== "Skip this" ? `• Religious Elements: ${religiousElements}` : ""}
${culturalTraditions ? `• Cultural Traditions: ${culturalTraditions}` : ""}
• Vows: ${vowsType || "Traditional Vows"}
${readingStyle && readingStyle !== "none" ? `• Reading Style: ${readingStyle}` : ""}

Generated with AI assistance by Mr. Script - Your Personal Wedding Script Creator
Total segments: 5 | Each segment optimized for maximum detail
`;
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json(
        { error: "OpenAI API key not configured", details: "Please add OPENAI_API_KEY to environment variables" },
        { status: 500 }
      );
    }

    // Log that we have an API key (first 10 chars for debugging)
    console.log(`OpenAI API key found: ${apiKey.substring(0, 10)}...`);

    const body = await request.json();
    const {
      refinementInstructions,
      // Single segment regeneration params
      regenerateSegmentIndex,
      existingSegments,
      segmentInstructions,
    } = body;

    const isRefinement = !!refinementInstructions;
    const isSingleSegment = typeof regenerateSegmentIndex === "number";

    // SINGLE SEGMENT REGENERATION
    if (isSingleSegment && existingSegments && Array.isArray(existingSegments)) {
      console.log(`Regenerating single segment ${regenerateSegmentIndex + 1}: ${CEREMONY_SEGMENTS[regenerateSegmentIndex].name}`);

      // Build context from previous segments
      let previousContent = "";
      for (let i = 0; i < regenerateSegmentIndex; i++) {
        previousContent += existingSegments[i] + "\n\n";
      }

      // Generate just the one segment
      const newSegment = await generateSegment(
        regenerateSegmentIndex,
        body,
        previousContent,
        false,
        segmentInstructions
      );

      // Replace the segment in the array
      const updatedSegments = [...existingSegments];
      updatedSegments[regenerateSegmentIndex] = newSegment;

      // Build the final script
      const finalScript = buildFinalScript(updatedSegments, body, false);

      return NextResponse.json({
        script: finalScript,
        segments: updatedSegments,
        regeneratedIndex: regenerateSegmentIndex,
      });
    }

    // FULL SCRIPT GENERATION
    const segments: string[] = [];
    let previousContent = "";

    console.log("Starting full segmented script generation...");

    for (let i = 0; i < CEREMONY_SEGMENTS.length; i++) {
      console.log(`Generating segment ${i + 1}/${CEREMONY_SEGMENTS.length}: ${CEREMONY_SEGMENTS[i].name}`);

      const segmentContent = await generateSegment(i, body, previousContent, isRefinement);
      segments.push(segmentContent);

      // Update previous content for context in next segment
      previousContent += `\n\n${"═".repeat(60)}\n`;
      previousContent += `PART ${i + 1}: ${CEREMONY_SEGMENTS[i].name.toUpperCase()}\n`;
      previousContent += `${"═".repeat(60)}\n\n`;
      previousContent += segmentContent;

      // Small delay between API calls to avoid rate limiting
      if (i < CEREMONY_SEGMENTS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Build the final script
    const finalScript = buildFinalScript(segments, body, isRefinement);

    console.log("Script generation complete!");
    return NextResponse.json({
      script: finalScript,
      segments: segments, // Return segments array for future single-segment regeneration
    });

  } catch (error) {
    console.error("Error generating script:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Script generation failed",
        details: errorMessage,
        hint: "Check Netlify function logs for more details. Common issues: invalid API key, rate limiting, or model access."
      },
      { status: 500 }
    );
  }
}
