import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
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

function drawCenteredTextInRange(
  page: import("pdf-lib").PDFPage,
  text: string,
  startX: number,
  endX: number,
  y: number,
  size: number,
  font: import("pdf-lib").PDFFont,
  color = rgb(0.02, 0.08, 0.18)
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: startX + (endX - startX - textWidth) / 2,
    y,
    size,
    font,
    color,
  });
}

function drawMinistriesLogo(
  page: import("pdf-lib").PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  serifBold: import("pdf-lib").PDFFont,
  sans: import("pdf-lib").PDFFont
) {
  const centerX = x + width / 2;
  const scaleX = width / 320;
  const scaleY = height / 220;
  const sx = (value: number) => x + value * scaleX;
  const sy = (value: number) => y + (220 - value) * scaleY;

  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: rgb(0.72, 0.79, 0.76),
    borderColor: rgb(0.72, 0.79, 0.76),
    borderWidth: 1,
  });
  page.drawCircle({
    x: centerX,
    y: sy(82),
    size: 58 * Math.min(scaleX, scaleY),
    color: rgb(0.91, 0.63, 0.58),
    borderColor: rgb(1, 1, 1),
    borderWidth: 1.4,
  });

  page.drawLine({ start: { x: sx(122), y: sy(134) }, end: { x: sx(122), y: sy(82) }, thickness: 2, color: rgb(1, 1, 1) });
  page.drawLine({ start: { x: sx(122), y: sy(82) }, end: { x: sx(160), y: sy(42) }, thickness: 2, color: rgb(1, 1, 1) });
  page.drawLine({ start: { x: sx(160), y: sy(42) }, end: { x: sx(198), y: sy(82) }, thickness: 2, color: rgb(1, 1, 1) });
  page.drawLine({ start: { x: sx(198), y: sy(82) }, end: { x: sx(198), y: sy(134) }, thickness: 2, color: rgb(1, 1, 1) });
  page.drawLine({ start: { x: sx(112), y: sy(134) }, end: { x: sx(208), y: sy(134) }, thickness: 2, color: rgb(1, 1, 1) });
  page.drawLine({ start: { x: sx(160), y: sy(42) }, end: { x: sx(160), y: sy(22) }, thickness: 2, color: rgb(1, 1, 1) });
  page.drawLine({ start: { x: sx(148), y: sy(30) }, end: { x: sx(172), y: sy(30) }, thickness: 2, color: rgb(1, 1, 1) });
  page.drawCircle({ x: centerX, y: sy(73), size: 2.2, color: rgb(1, 1, 1) });

  const ministriesSize = Math.max(10, width * 0.13);
  const ofLoveSize = Math.max(6, width * 0.072);
  page.drawText("MINISTRIES", {
    x: x + (width - serifBold.widthOfTextAtSize("MINISTRIES", ministriesSize)) / 2,
    y: y + height * 0.2,
    size: ministriesSize,
    font: serifBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("OF LOVE", {
    x: x + (width - sans.widthOfTextAtSize("OF LOVE", ofLoveSize)) / 2,
    y: y + height * 0.07,
    size: ofLoveSize,
    font: sans,
    color: rgb(1, 1, 1),
  });
}

async function readSignaturePath() {
  try {
    const signatureSvg = await readFile(
      path.join(process.cwd(), "public", "daniel_salerno_signature_vector.svg"),
      "utf8"
    );
    return signatureSvg.match(/<path[^>]*\sd="([^"]+)"/)?.[1] || "";
  } catch {
    return "";
  }
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
  const signaturePath = await readSignaturePath();

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

  page.drawCircle({
    x: width / 2,
    y: 166,
    size: 42,
    color: rgb(0.95, 0.78, 0.42),
    borderColor: rgb(0.66, 0.43, 0.12),
    borderWidth: 2,
  });
  page.drawCircle({
    x: width / 2,
    y: 166,
    size: 34,
    color: rgb(0.98, 0.87, 0.58),
    borderColor: rgb(0.66, 0.43, 0.12),
    borderWidth: 1,
  });
  centerText(page, "State of", 170, 11, serif, dark);
  centerText(page, "Arizona", 154, 14, serifBold, dark);

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
  if (signaturePath) {
    page.drawSvgPath(signaturePath, {
      x: 151,
      y: 145,
      scale: 0.52,
      color: dark,
    });
  } else {
    page.drawText("Daniel Salerno", {
      x: 160,
      y: 135,
      size: 16,
      font: serif,
      color: dark,
    });
  }
  drawCenteredTextInRange(page, "Arbiter of Matrimony", 145, 330, 104, 13, sans, dark);
  drawCenteredTextInRange(page, id, 462, 647, 132, 11, sans, dark);
  drawCenteredTextInRange(page, "Certificate ID", 462, 647, 104, 13, sans, dark);
  drawMinistriesLogo(page, width - 162, 56, 98, 66, serifBold, sans);

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ministries-of-love-ordination-certificate.pdf"`,
    },
  });
}
