import { NextRequest, NextResponse } from "next/server";

// Email sending API route
// Uses Resend for reliable email delivery
// Fallback: Can be configured to use SMTP directly

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, fromName, coupleName } = body;

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, message" },
        { status: 400 }
      );
    }

    // Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      // Use Resend for email delivery
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: `${fromName || "Wedding Officiant"} <onboarding@resend.dev>`,
          to: [to],
          subject: subject,
          html: generateEmailHtml(fromName, coupleName, message, subject),
          text: message,
        }),
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
      console.log("✅ Email sent via Resend:", data);
      return NextResponse.json({ success: true, messageId: data.id });
    }

    // Fallback: Log email for development (no email service configured)
    console.log("📧 Email would be sent (no RESEND_API_KEY configured):");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Message:", message);

    return NextResponse.json({
      success: true,
      note: "Email logged (no email service configured). Add RESEND_API_KEY to enable email delivery.",
      preview: { to, subject, message }
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
  subject: string
): string {
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
                💍 Wedding Message
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                From your wedding officiant
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                Dear ${coupleName || "Couple"},
              </p>

              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
                  ${message}
                </p>
              </div>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #1f2937;">${fromName || "Your Wedding Officiant"}</strong>
              </p>
            </td>
          </tr>

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
