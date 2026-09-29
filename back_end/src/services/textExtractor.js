import fs from "node:fs/promises";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import ApiError from "../utils/ApiError.js";

const pdfMimeType = "application/pdf";
const docxMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const textMimeType = "text/plain";

const extractPdfText = async (filePath) => {
  const parser = new PDFParse({ data: await fs.readFile(filePath) });
  try {
    const result = await parser.getText();
    return result.pages.map((page) => page.text).join("\n");
  } finally {
    await parser.destroy();
  }
};

const extractText = async (filePath, mimeType) => {
  let text;

  try {
    if (mimeType === pdfMimeType) {
      text = await extractPdfText(filePath);
    } else if (mimeType === docxMimeType) {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (mimeType === textMimeType) {
      const buffer = await fs.readFile(filePath);
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } else {
      throw new ApiError(415, "Only PDF, DOCX, and TXT files are supported");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(422, "Unable to read this file; upload a valid PDF, DOCX, or UTF-8 TXT file");
  }

  const extractedText = text?.trim();
  if (!extractedText) {
    if (mimeType === pdfMimeType) {
      throw new ApiError(422, "No selectable text was found; scanned-only PDFs are not supported");
    }
    throw new ApiError(422, "The uploaded file is empty or contains no readable text");
  }

  return extractedText;
};

export { extractText };