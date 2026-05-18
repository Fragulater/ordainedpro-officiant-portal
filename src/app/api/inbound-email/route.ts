import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force Node.js runtime for Netlify compatibility
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Webhook to receive inbound email replies from Resend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("📧 Inbound email webhook received:", JSON.stringify(body, null, 2));

    // Resend webhook payload - email data is nested inside 'data'
    const webhookData = body.data || body;

    // IMPORTANT: Resend webhooks only contain metadata, NOT the email body!
    // We need to fetch the full email content using the Resend API
    const emailId = webhookData.email_id;

    if (!emailId) {
      console.error("❌ No email_id in webhook payload");
      return NextResponse.json({
        success: false,
        message: "No email_id in webhook payload",
        receivedData: Object.keys(webhookData)
      });
    }

    console.log("📨 Email ID from webhook:", emailId);

    // Fetch the full email content from Resend API
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not configured");
      return NextResponse.json({
        success: false,
        message: "RESEND_API_KEY not configured on server"
      }, { status: 500 });
    }

    console.log("🔄 Fetching email content from Resend API...");

    // Use the CORRECT endpoint for RECEIVED/INBOUND emails: /emails/receiving/{id}
    // NOT /emails/{id} which is for SENT emails only!
    let emailResponse = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      }
    });

    // If not found, the email content might be in the webhook payload directly
    // Resend may not store inbound emails for retrieval - let's check their "emails" endpoint
    if (!emailResponse.ok && emailResponse.status === 404) {
      console.log("📧 Email not found via API, checking if content is in webhook payload...");

      // For inbound emails, Resend may include text/html directly in webhook with different field names
      // Check the original webhook data for content
      const rawText = webhookData.text || webhookData.body || webhookData.plain_text || "";
      const rawHtml = webhookData.html || webhookData.html_body || "";

      if (rawText || rawHtml) {
        console.log("📧 Found content in webhook payload directly");
        // Create a mock response with the webhook data
        emailResponse = {
          ok: true,
          json: async () => ({
            from: webhookData.from,
            to: webhookData.to,
            subject: webhookData.subject,
            text: rawText,
            html: rawHtml
          })
        } as Response;
      }
    }

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("❌ Failed to fetch email from Resend:", emailResponse.status, errorText);
      return NextResponse.json({
        success: false,
        message: "Failed to fetch email content from Resend",
        status: emailResponse.status,
        error: errorText
      }, { status: 500 });
    }

    const emailData = await emailResponse.json();
    console.log("✅ Fetched email data:", JSON.stringify(emailData, null, 2));

    // Extract email fields from the API response
    const {
      from,        // Sender email (the couple)
      to,          // Array of recipients or string
      subject,     // Email subject
      text,        // Plain text body
      html,        // HTML body (if available)
    } = emailData;

    console.log("📨 Email content:", { from, to, subject, textLength: text?.length, htmlLength: html?.length });

    // Extract sender email address
    let senderEmail = '';
    if (typeof from === 'string') {
      senderEmail = from.match(/<(.+)>/)?.[1] || from;
    } else if (from?.email) {
      senderEmail = from.email;
    } else if (from?.address) {
      senderEmail = from.address;
    } else if (Array.isArray(from) && from[0]) {
      senderEmail = typeof from[0] === 'string' ? from[0] : (from[0].email || from[0].address || '');
    }

    senderEmail = senderEmail.toLowerCase().trim();
    console.log("📧 Sender email extracted:", senderEmail);

    // Try to get reply text from multiple sources
    let replyText = '';

    // First try plain text
    if (text && typeof text === 'string') {
      replyText = extractReplyText(text);
      console.log("📝 Extracted from text:", replyText.substring(0, 100));
    }

    // If text is empty, try HTML
    if (!replyText.trim() && html && typeof html === 'string') {
      // Strip HTML tags and extract text
      const htmlText = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
      replyText = extractReplyText(htmlText);
      console.log("📝 Extracted from HTML:", replyText.substring(0, 100));
    }

    // If still empty, use raw text without processing (last resort)
    if (!replyText.trim() && text) {
      replyText = text.trim().substring(0, 1000); // Take first 1000 chars
      console.log("📝 Using raw text as fallback:", replyText.substring(0, 100));
    }

    // Also try subject as last resort if body is empty
    if (!replyText.trim() && subject) {
      // Some email clients put short replies in the subject when forwarding
      console.log("📝 Body empty, checking if subject contains reply...");
    }

    if (!replyText.trim()) {
      console.log("⚠️ Empty reply after all extraction attempts");
      console.log("📋 Full email data for debugging:", { from, to, subject, text, html });
      return NextResponse.json({
        success: false,
        message: "Empty reply - no content found in email body",
        debug: {
          hasText: !!text,
          hasHtml: !!html,
          from: senderEmail,
          subject: subject,
          emailId: emailId
        }
      });
    }

    console.log("📝 Final reply content:", replyText);

    // Parse couple ID and officiant ID from the "to" address
    // IMPORTANT: Use the TO address from the WEBHOOK payload, not the fetched email
    // The webhook payload has the plus-addressing: reply+coupleId_officiantId@ziloesteo.resend.app
    let coupleId: number | null = null;
    let officiantId: string | null = null;

    // Use webhook data's "to" field which has the plus-addressing
    const webhookTo = webhookData.to;
    const toAddress = Array.isArray(webhookTo) ? webhookTo[0] : webhookTo;
    const toAddressStr = typeof toAddress === 'string' ? toAddress : (toAddress?.email || toAddress?.address || '');

    console.log("📧 Parsing couple ID from TO address:", toAddressStr);

    const plusMatch = toAddressStr.match(/reply\+(\d+)_([a-f0-9-]+)@/i);

    if (plusMatch) {
      coupleId = parseInt(plusMatch[1], 10);
      officiantId = plusMatch[2];
      console.log("🎯 Parsed from address - Couple ID:", coupleId, "Officiant ID:", officiantId);
    }

    let couple: any = null;

    // Method 1: Direct lookup by couple ID (most reliable for multi-tenant)
    if (coupleId && officiantId) {
      const { data, error } = await supabase
        .from("couples")
        .select("id, user_id, bride_name, groom_name, bride_email, groom_email")
        .eq("id", coupleId)
        .eq("user_id", officiantId)
        .single();

      if (!error && data) {
        couple = data;
        console.log("✅ Found couple by ID:", couple.bride_name, "&", couple.groom_name);
      } else {
        console.log("⚠️ Couple not found by ID, falling back to email search");
      }
    }

    // Method 2: Fallback - search by email (for older emails without plus addressing)
    if (!couple && senderEmail) {
      const { data: couples, error: coupleError } = await supabase
        .from("couples")
        .select("id, user_id, bride_name, groom_name, bride_email, groom_email")
        .or(`bride_email.ilike.${senderEmail},groom_email.ilike.${senderEmail}`);

      if (coupleError) {
        console.error("❌ Error finding couple:", coupleError);
        return NextResponse.json(
          { error: "Database error", details: coupleError.message },
          { status: 500 }
        );
      }

      if (couples && couples.length > 0) {
        if (couples.length > 1) {
          console.warn("⚠️ Multiple couples found with email:", senderEmail, "- using first match");
        }
        couple = couples[0];
        console.log("✅ Found couple by email:", couple.bride_name, "&", couple.groom_name);
      }
    }

    // No couple found
    if (!couple) {
      console.log("⚠️ No couple found for email:", senderEmail);
      return NextResponse.json({
        success: false,
        message: "No matching couple found",
        email: senderEmail
      });
    }

    // Determine sender name based on which email matched
    const senderName = couple.bride_email?.toLowerCase() === senderEmail
      ? couple.bride_name
      : couple.groom_email?.toLowerCase() === senderEmail
        ? couple.groom_name
        : "Couple";

    // Save the reply as a message
    const messageData = {
      user_id: couple.user_id,
      couple_id: couple.id,
      sender: "couple",
      sender_name: senderName || "Couple",
      content: replyText,
      read: false,
      created_at: new Date().toISOString(),
    };

    console.log("💾 Saving message:", messageData);

    const { data: savedMessage, error: saveError } = await supabase
      .from("messages")
      .insert([messageData])
      .select();

    if (saveError) {
      console.error("❌ Error saving message:", saveError);
      return NextResponse.json(
        { error: "Failed to save message", details: saveError.message },
        { status: 500 }
      );
    }

    console.log("✅ Reply saved successfully for officiant:", couple.user_id);

    return NextResponse.json({
      success: true,
      message: "Reply processed and saved",
      messageId: savedMessage?.[0]?.id,
      from: senderEmail,
      coupleName: `${couple.bride_name} & ${couple.groom_name}`,
      officiantId: couple.user_id,
    });

  } catch (error) {
    console.error("❌ Inbound email error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Extract the actual reply text, removing quoted content
function extractReplyText(fullText: string): string {
  if (!fullText) return '';

  let replyText = fullText;

  // Step 1: Cut at common reply separators (find the EARLIEST one)
  const separatorPatterns = [
    /On [A-Za-z]{3,9},? [A-Za-z]{3,9} \d{1,2},? \d{4}[,\s]+(?:at )?\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?[^\n]*wrote:/i,  // Gmail-style: "On Mon, Apr 6, 2026 at 9:22 AM ... wrote:"
    /On \d{1,2}\/\d{1,2}\/\d{2,4}.+wrote:/i,   // "On 4/6/2026 ... wrote:"
    /\d{4}-\d{2}-\d{2}.+wrote:/i,              // "2026-04-06 ... wrote:"
    /<.+@.+\.\w+>\s*wrote:/i,                  // "<email@domain.com> wrote:"
    /^From:\s*.+$/im,                          // "From: ..."
    /^Sent:\s*.+$/im,                          // "Sent: ..."
    /^Date:\s*.+$/im,                          // "Date: ..."
    /^To:\s*.+$/im,                            // "To: ..." (in forwarded emails)
    /-{5,}/,                                   // Line of 5+ dashes
    /_{5,}/,                                   // Line of 5+ underscores
    /={5,}/,                                   // Line of 5+ equals
    /Sent from my iPhone/i,
    /Sent from my Android/i,
    /Sent from Mail for Windows/i,
    /Get Outlook for/i,
    /This message was sent from/i,
    /^--\s*$/m,                                // Email signature delimiter
    /^\*From:\*/im,                            // Markdown-style "**From:**"
  ];

  let earliestIndex = replyText.length;

  for (const pattern of separatorPatterns) {
    const match = replyText.match(pattern);
    if (match && match.index !== undefined && match.index > 5 && match.index < earliestIndex) {
      earliestIndex = match.index;
    }
  }

  // Cut at the earliest separator
  replyText = replyText.substring(0, earliestIndex);

  // Step 2: Remove any lines starting with ">" (quoted text that might be before separators)
  replyText = replyText
    .split('\n')
    .filter(line => !line.trim().startsWith('>'))
    .join('\n');

  // Step 3: Clean up
  replyText = replyText
    .replace(/^\s+|\s+$/g, '')     // Trim whitespace
    .replace(/\r\n/g, '\n')        // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')    // Max 2 consecutive newlines
    .replace(/^[\s\n]+|[\s\n]+$/g, ''); // Trim again after filtering

  console.log("📝 Cleaned reply text:", replyText.substring(0, 100));

  return replyText;
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Inbound email webhook is active",
    endpoint: "/api/inbound-email",
    note: "This endpoint receives email.received webhooks from Resend and fetches full email content via API"
  });
}
