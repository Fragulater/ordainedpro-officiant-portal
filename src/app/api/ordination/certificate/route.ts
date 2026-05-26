import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function readParam(searchParams: URLSearchParams, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return fallback;
}

function formatDate(value: string) {
  if (!value || value === "Ordination date needed") return value;
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function centerText(
  page: import("pdf-lib").PDFPage,
  text: string,
  y: number,
  size: number,
  font: import("pdf-lib").PDFFont,
  color = rgb(0.02, 0.08, 0.18)
) {
  const width = page.getWidth();
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (width - textWidth) / 2,
    y,
    size,
    font,
    color,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = readParam(searchParams, ["name", "fullName", "full_name"], "Full legal name needed");
  const date = readParam(
    searchParams,
    ["date", "ordinationDate", "ordination_date"],
    "Ordination date needed"
  );
  const state = readParam(searchParams, ["state"], "");
  const id =
    readParam(searchParams, ["id", "certificateId", "certificate_id"], "") ||
    `MOL-${Date.now().toString().slice(-8)}`;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([792, 612]);
  const width = page.getWidth();
  const height = page.getHeight();
  const serif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const blue = rgb(0.1, 0.32, 0.88);
  const dark = rgb(0.02, 0.08, 0.18);
  const muted = rgb(0.32, 0.39, 0.49);

  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderWidth: 3,
    borderColor: rgb(0.65, 0.78, 1),
    color: rgb(1, 1, 1),
  });
  page.drawRectangle({
    x: 52,
    y: 52,
    width: width - 104,
    height: height - 104,
    borderWidth: 1,
    borderColor: rgb(0.78, 0.86, 1),
  });

  centerText(page, "MINISTRIES OF LOVE", 492, 13, sans, blue);
  centerText(page, "Certificate of Ordination", 438, 38, serifBold, dark);
  centerText(page, "This certifies that", 388, 17, serif, muted);
  centerText(page, name, 342, 32, serifBold, dark);

  page.drawLine({
    start: { x: 180, y: 328 },
    end: { x: width - 180, y: 328 },
    thickness: 1,
    color: rgb(0.67, 0.72, 0.8),
  });

  const body = state
    ? `has received licensed minister credentials through Ministries of Love on ${formatDate(date)} and is recognized as an Arbiter of Matrimony in ${state}.`
    : `has received licensed minister credentials through Ministries of Love on ${formatDate(date)} and may retain this certificate as proof of ordination.`;

  const words = body.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (serif.widthOfTextAtSize(test, 16) > 590) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  lines.forEach((line, index) => centerText(page, line, 284 - index * 24, 16, serif, dark));

  page.drawLine({
    start: { x: 145, y: 126 },
    end: { x: 330, y: 126 },
    thickness: 1,
    color: rgb(0.4, 0.45, 0.52),
  });
  page.drawLine({
    start: { x: 462, y: 126 },
    end: { x: 647, y: 126 },
    thickness: 1,
    color: rgb(0.4, 0.45, 0.52),
  });
  centerText(page, "Ministries of Love", 104, 13, sans, dark);
  page.drawText("Certificate ID", { x: 512, y: 104, size: 13, font: sans, color: dark });
  page.drawText(id, { x: 486, y: 82, size: 11, font: sans, color: muted });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ministries-of-love-ordination-certificate.pdf"`,
    },
  });
}
