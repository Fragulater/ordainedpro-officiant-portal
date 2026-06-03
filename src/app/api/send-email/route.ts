import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/utils/server";

// Force Node.js runtime (not Edge) for Netlify compatibility
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Attachment type for email
interface EmailAttachment {
  filename: string;
  content: string; // Text content or base64 encoded content
  contentType?: 'text' | 'base64'; // Type of content
  mimeType?: string;
}

// Email sending API route
// Uses Resend for reliable email delivery
// Fallback: Can be configured to use SMTP directly

function isAllowedEmailOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const requestHost = request.headers.get("host");
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://portal.ordainedpro.com";
  const allowedHosts = new Set(
    [requestHost, new URL(configuredSiteUrl).host, "portal.ordainedpro.com"]
      .filter(Boolean)
      .map((host) => String(host).toLowerCase())
  );

  try {
    return allowedHosts.has(new URL(origin).host.toLowerCase());
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedEmailOrigin(request)) {
      return NextResponse.json({ error: "Email requests are only allowed from the OrdainedPro portal." }, { status: 403 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Please log in before sending email." }, { status: 401 });
    }

    const body = await request.json();
    const {
      to,
      subject,
      message,
      fromName,
      coupleName,
      coupleId,
      officiantId,
      attachments,
      calendarUrl,
      actionUrl,
      actionLabel,
      emailTitle,
      emailSubtitle,
    } = body;
    const recipients = Array.isArray(to)
      ? to.filter((email) => typeof email === "string" && email.trim())
      : typeof to === "string" && to.trim()
        ? [to.trim()]
        : [];

    // Validate required fields
    if (recipients.length === 0 || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, message" },
        { status: 400 }
      );
    }

    // Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      // Prepare attachments for Resend API
      const resendAttachments = (attachments || []).map((att: EmailAttachment) => {
        // If already base64, use directly; otherwise convert text to base64
        const base64Content = att.contentType === 'base64'
          ? att.content
          : Buffer.from(att.content).toString('base64');

        return {
          filename: att.filename,
          content: base64Content,
          content_type: att.mimeType,
        };
      });

      // Use Resend for email delivery
      const emailPayload: Record<string, unknown> = {
        from: `${fromName || "Wedding Officiant"} <info@ordainedpro.com>`,
        reply_to: coupleId && officiantId
          ? `reply+${coupleId}_${officiantId}@ziloesteo.resend.app`
          : "reply@ziloesteo.resend.app",
        to: recipients,
        subject: subject,
        html: generateEmailHtml(fromName, coupleName, message, subject, attachments, calendarUrl, actionUrl, actionLabel, emailTitle, emailSubtitle),
        text: message,
      };

      // Only add attachments if there are any
      if (resendAttachments.length > 0) {
        emailPayload.attachments = resendAttachments;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Resend API error:", error);
        return NextResponse.json(
          { error: "Failed to send email", details: error },
          { status: 500 }
        );
      }

      const data = await response.json();
      console.log("[OK] Email sent via Resend:", data);
      return NextResponse.json({ success: true, messageId: data.id });
    }

    // Fallback: Log email for development (no email service configured)
    console.log("[EMAIL] Would be sent (no RESEND_API_KEY configured):");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Message:", message);
    console.log("Attachments:", attachments?.length || 0);

    return NextResponse.json({
      success: true,
      note: "Email logged (no email service configured). Add RESEND_API_KEY to enable email delivery.",
      preview: { to, subject, message, attachmentCount: attachments?.length || 0 }
    });

  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Generate beautiful HTML email template
function generateEmailHtml(
  fromName: string,
  coupleName: string,
  message: string,
  subject: string,
  attachments?: EmailAttachment[],
  calendarUrl?: string,
  actionUrl?: string,
  actionLabel?: string,
  emailTitle?: string,
  emailSubtitle?: string
): string {
  const trimmedMessage = message.trim();
  const startsWithGreeting = /^dear\s/i.test(trimmedMessage);

  // Build attachments section if there are any
  let attachmentsHtml = '';
  if (attachments && attachments.length > 0) {
    attachmentsHtml = `
      <tr>
        <td style="padding: 0 40px 20px;">
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 10px; color: #1e40af; font-weight: 600; font-size: 14px;">
              Attachments (${attachments.length}):
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
              ${attachments.map(att => `<li style="margin: 4px 0;">${att.filename}</li>`).join('')}
            </ul>
          </div>
        </td>
      </tr>
    `;
  }

  const primaryActionUrl = actionUrl || calendarUrl;
  const primaryActionLabel = actionLabel || (calendarUrl ? "Add to Google Calendar" : "");
  const actionHtml = primaryActionUrl ? `
      <tr>
        <td style="padding: 0 40px 24px; text-align: center;">
          <a href="${primaryActionUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 18px; border-radius: 8px;">
            ${primaryActionLabel}
          </a>
        </td>
      </tr>
    ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${emailTitle || "Wedding Documents"}
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                ${emailSubtitle || "From your officiant"}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              ${startsWithGreeting ? "" : `
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Dear ${coupleName || "Couple"},
              </p>
              `}

              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
                  ${message}
                </p>
              </div>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #1f2937;">${fromName || "Your Officiant"}</strong>
              </p>
            </td>
          </tr>

          <!-- Attachments Section -->
          ${attachmentsHtml}

          <!-- Calendar Section -->
          ${actionHtml}

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This message was sent from the OrdainedPro Wedding Portal.
              </p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                Reply directly to this email to continue the conversation.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
