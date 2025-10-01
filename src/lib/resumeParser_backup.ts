import { FileUploadResult } from "../types";
import { aiService } from "./aiService";
// @ts-ignore - mammoth doesn't have perfect types
import mammoth from "mammoth";
import pdfToText from "react-pdftotext";

// PDF text extraction using PDF.js (matching DOCX extraction pattern)
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log("� Starting PDF.js extraction for:", file.name);

    // Read file as ArrayBuffer (same pattern as DOCX)
    const arrayBuffer = await file.arrayBuffer();

    // Convert to Uint8Array for PDF.js
    const typedArray = new Uint8Array(arrayBuffer);

    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

    console.log(`📄 PDF loaded successfully. Pages: ${pdf.numPages}`);

    let fullText = "";

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // Map all text items to strings and join them
      const pageText = content.items.map((item: any) => item.str).join(" ");

      fullText += pageText + "\n";

      console.log(`✅ Extracted page ${i}/${pdf.numPages}`);
    }

    console.log(`📝 Total text extracted: ${fullText.length} characters`);
    console.log(`📝 Preview: ${fullText.substring(0, 300)}`);

    return fullText;
  } catch (error) {
    console.error("❌ PDF extraction failed:", error);
    throw new Error(
      `Failed to extract text from PDF: ${(error as Error).message}`
    );
  }
} // REAL DOCX text extraction using mammoth
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Use mammoth to extract text
    const result = await mammoth.extractRawText({ arrayBuffer });

    return result.value;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error(`Failed to parse DOCX: ${(error as Error).message}`);
  }
}

// Parse PDF with AI extraction and comprehensive debugging (SAME AS DOCX)
export async function parsePDF(file: File): Promise<FileUploadResult> {
  try {
    console.log("🔍 Starting PDF parsing process...");
    console.log("📄 File name:", file.name);
    console.log("📊 File size:", Math.round(file.size / 1024), "KB");
    console.log("📋 File type:", file.type);

    // Extract raw text using PDF.js (similar to how DOCX uses mammoth)
    const text = await extractTextFromPDF(file);
    console.log("📄 PDF text extracted, length:", text.length);
    console.log("📝 First 500 characters:", text.substring(0, 500));

    if (!text || text.trim().length === 0) {
      console.error("❌ No text content found in PDF");
      throw new Error("No text content found in PDF");
    }

    if (text.trim().length < 20) {
      console.warn(
        "⚠️ Extracted text is very short:",
        text.length,
        "characters"
      );
    }

    // Try regex extraction first for immediate feedback
    const regexResults = extractContactInfo(text);
    console.log("🔍 Regex extraction results:", regexResults);

    // Use AI to extract structured data (same as DOCX)
    console.log("🤖 Sending text to AI for extraction...");
    const extractedData = await aiService.extractResumeData(text);
    console.log("✅ AI extraction completed:", extractedData);

    // Combine AI and regex results, prioritizing non-null values (SAME AS DOCX)
    const finalData = {
      name: extractedData.name || regexResults.name || undefined,
      email: extractedData.email || regexResults.email || undefined,
      phone: extractedData.phone || regexResults.phone || undefined,
      experience: extractedData.experience || undefined,
      skills: extractedData.skills || [],
    };

    console.log("🎯 Final combined extraction results:", finalData);

    return {
      success: true,
      data: {
        ...finalData,
        text,
      },
    };
  } catch (error) {
    console.error("❌ PDF parsing failed:", error);
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return {
      success: false,
      error: "Failed to parse PDF file: " + (error as Error).message,
    };
  }
}

// Parse DOCX with AI extraction and comprehensive debugging
export async function parseDOCX(file: File): Promise<FileUploadResult> {
  try {
    console.log("📄 Starting DOCX parsing with mammoth...");

    // Extract raw text
    const text = await extractTextFromDOCX(file);
    console.log("📝 DOCX text extracted, length:", text.length);
    console.log("📋 First 200 characters:", text.substring(0, 200));

    if (!text || text.trim().length === 0) {
      throw new Error("No text content found in DOCX");
    }

    // Try regex extraction first for immediate feedback
    const regexResults = extractContactInfo(text);
    console.log("🔍 Regex extraction results:", regexResults);

    // Use AI to extract structured data
    console.log("🤖 Sending text to AI for extraction...");
    const extractedData = await aiService.extractResumeData(text);
    console.log("✅ AI extraction completed:", extractedData);

    // Combine AI and regex results, prioritizing non-null values
    const finalData = {
      name: extractedData.name || regexResults.name || undefined,
      email: extractedData.email || regexResults.email || undefined,
      phone: extractedData.phone || regexResults.phone || undefined,
      experience: extractedData.experience || undefined,
      skills: extractedData.skills || [],
    };

    console.log("🎯 Final combined extraction results:", finalData);

    return {
      success: true,
      data: {
        ...finalData,
        text,
      },
    };
  } catch (error) {
    console.error("❌ DOCX parsing failed:", error);
    return {
      success: false,
      error: "Failed to parse DOCX file: " + (error as Error).message,
    };
  }
}

// Main resume parsing function
export async function parseResume(file: File): Promise<FileUploadResult> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return parsePDF(file);
  } else if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    return parseDOCX(file);
  } else {
    return {
      success: false,
      error: "Unsupported file type. Please upload a PDF or DOCX file.",
    };
  }
}

// Enhanced contact information extraction with comprehensive regex patterns
export function extractContactInfo(text: string): {
  name?: string;
  email?: string;
  phone?: string;
} {
  console.log(
    "🔍 Starting enhanced regex extraction on text length:",
    text.length
  );

  // Enhanced email regex - more comprehensive with validation
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
  const emailMatches = text.match(emailRegex);
  let email: string | undefined;

  if (emailMatches) {
    // Filter out obvious test/example emails and prefer real-looking ones
    const validEmails = emailMatches.filter(
      (match) =>
        isValidEmail(match) &&
        !match.toLowerCase().includes("example") &&
        !match.toLowerCase().includes("test") &&
        !match.toLowerCase().includes("sample")
    );

    if (validEmails.length > 0) {
      email = validEmails[0];
    } else if (emailMatches.length > 0) {
      email = emailMatches[0]; // Fallback to first match
    }
  }
  console.log("📧 Email found:", email);

  // Enhanced phone regex - multiple formats with validation
  const phoneRegexes = [
    /\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    /\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    /([0-9]{3})[-.]([0-9]{3})[-.]([0-9]{4})/g,
    /\+?1\s?\(?([0-9]{3})\)?\s?([0-9]{3})\s?([0-9]{4})/g,
  ];

  let phone: string | undefined;
  for (const regex of phoneRegexes) {
    const phoneMatches = text.match(regex);
    if (phoneMatches) {
      for (const match of phoneMatches) {
        // Validate that it's actually a phone number, not a date or other number
        if (isValidPhoneNumber(match)) {
          phone = match;
          break;
        }
      }
      if (phone) break;
    }
  }
  console.log("📱 Phone found:", phone);

  // Enhanced name extraction with multiple strategies
  const lines = text
    .split(/[\n\r]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let name: string | undefined;
  console.log("📋 Processing", lines.length, "lines for name extraction");

  // Strategy 1: Look in first 10 lines for name patterns
  for (const line of lines.slice(0, 10)) {
    // Skip lines with common resume keywords, email, or phone
    if (
      line.includes("@") ||
      phoneRegexes.some((regex) => regex.test(line)) ||
      /\b(resume|cv|curriculum|vitae|experience|education|skills|contact|objective|summary|profile|about)\b/i.test(
        line
      ) ||
      line.length > 50 // Skip long lines
    ) {
      continue;
    }

    // Look for 2-4 capitalized words that could be a name
    const words = line.split(/\s+/).filter((word) => word.length > 0);
    if (words.length >= 2 && words.length <= 4 && line.length <= 40) {
      const isLikelyName = words.every(
        (word) =>
          word.length > 1 &&
          word[0] === word[0].toUpperCase() &&
          /^[A-Za-z\s'.-]+$/.test(word) &&
          !/(developer|engineer|analyst|manager|director|coordinator|specialist|consultant|intern|jr|sr|senior|junior)/i.test(
            word
          )
      );

      if (isLikelyName) {
        name = line;
        console.log("👤 Name found via pattern matching:", name);
        break;
      }
    }
  }

  // Strategy 2: Look for "Name:" patterns if first strategy failed
  if (!name) {
    const namePatterns = [
      /name:\s*([A-Za-z\s'.-]{2,40})/i,
      /full\s+name:\s*([A-Za-z\s'.-]{2,40})/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/m,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        name = match[1].trim();
        console.log("👤 Name found via label pattern:", name);
        break;
      }
    }
  }

  const result = { name, email, phone };
  console.log("🎯 Final regex extraction results:", result);
  return result;
}

// Validation function to prevent false positives in phone number detection
function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters for analysis
  const digitsOnly = phone.replace(/\D/g, "");

  // Basic length check (7-15 digits is reasonable for phone numbers)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return false;
  }

  // Check if it looks like a date (common false positive)
  // Patterns like 20170815, 2017081507, etc.
  if (/^20[0-9]{6,8}$/.test(digitsOnly)) {
    console.log("🚫 Rejected phone (looks like date):", phone);
    return false;
  }

  // Check if it's all the same digit (unlikely to be a real phone)
  if (/^(\d)\1+$/.test(digitsOnly)) {
    console.log("🚫 Rejected phone (repeated digits):", phone);
    return false;
  }

  // Check if it starts with reasonable patterns for US/international numbers
  if (digitsOnly.length === 10) {
    // US format: area code shouldn't start with 0 or 1
    const areaCode = digitsOnly.substring(0, 3);
    if (areaCode.startsWith("0") || areaCode.startsWith("1")) {
      console.log("🚫 Rejected phone (invalid area code):", phone);
      return false;
    }
  }

  console.log("✅ Valid phone number:", phone);
  return true;
}

// Validation function for email addresses
function isValidEmail(email: string): boolean {
  // Strict email validation
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/i;

  // Additional checks to prevent false positives
  if (!emailRegex.test(email)) return false;
  if (email.length > 254) return false; // RFC maximum
  if (email.includes("..")) return false; // Consecutive dots not allowed

  const [localPart, domain] = email.split("@");
  if (localPart.length > 64) return false; // RFC maximum for local part
  if (domain.length > 253) return false; // RFC maximum for domain

  return true;
}
