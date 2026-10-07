import { DocumentLanguage } from "@prisma/client";

export interface ParsedClause {
  clauseRef: string;
  heading?: string;
  content: string;
}

/**
 * Robust Thai & English Regulatory Clause Parser
 * Supports official patterns:
 * - ข้อ 1, ข้อ 1.1, ข้อ 1.1.1
 * - Clause 1, Clause 1.1, Section 2
 * - (1), (2), (ก), (ข)
 * - 1., 1.1, 1.2
 */
export function parseRegulatoryClauses(rawText: string): ParsedClause[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const clauses: ParsedClause[] = [];
  let currentRef = "";
  let currentHeading: string | undefined = undefined;
  let currentContentBuffer: string[] = [];

  // Regex patterns matching Thai & English clause headers and sub-clauses
  const clausePattern =
    /^(?:ข้อ\s*(\d+(?:\.\d+)*)|Clause\s*(\d+(?:\.\d+)*)|Section\s*(\d+(?:\.\d+)*)|(\d+\.\d+(?:\.\d+)?)|(?:\((\d+|[ก-ฮa-zA-Z])\)))\s*[:.-]?\s*(.*)$/i;

  for (const line of lines) {
    const match = line.match(clausePattern);

    if (match) {
      // Flush previous clause if exists
      if (currentRef && currentContentBuffer.length > 0) {
        clauses.push({
          clauseRef: currentRef,
          heading: currentHeading,
          content: currentContentBuffer.join(" ").trim(),
        });
        currentContentBuffer = [];
      }

      const num = match[1] || match[2] || match[3] || match[4] || (match[5] ? `(${match[5]})` : "");
      const isThai = Boolean(match[1]) || /[\u0E00-\u0E7F]/.test(line);

      currentRef = match[5] ? `ข้อ ${num}` : (isThai ? `ข้อ ${num}` : `Clause ${num}`);
      const remainder = (match[6] || "").trim();

      if (remainder.length > 0) {
        currentContentBuffer.push(remainder);
      }
    } else {
      if (currentRef) {
        currentContentBuffer.push(line);
      } else {
        // Preamble / title line before first clause
        if (line.length > 20 && clauses.length === 0) {
          currentRef = "Preamble";
          currentContentBuffer.push(line);
        }
      }
    }
  }

  // Flush final clause
  if (currentRef && currentContentBuffer.length > 0) {
    clauses.push({
      clauseRef: currentRef,
      heading: currentHeading,
      content: currentContentBuffer.join(" ").trim(),
    });
  }

  // Fallback if no explicit headers matched: chunk by numbered paragraphs
  if (clauses.length === 0 && rawText.length > 0) {
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 30);

    return paragraphs.map((p, idx) => ({
      clauseRef: `Paragraph ${idx + 1}`,
      content: p,
    }));
  }

  return clauses;
}

/**
 * Thai text normalizer
 * Strips zero-width chars and invisible codepoints
 */
export function normalizeThaiText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width spaces/joiners
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convenience wrapper for Thai clause parsing
 */
export function parseThaiClauses(rawText: string): ParsedClause[] {
  return parseRegulatoryClauses(rawText);
}

/**
 * Detect Language (TH, EN, or TH_EN)
 */
export function detectDocumentLanguage(text: string): DocumentLanguage {
  const thaiCharCount = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
  const englishCharCount = (text.match(/[A-Za-z]/g) || []).length;

  if (thaiCharCount > 50 && englishCharCount > 50) {
    return "TH_EN";
  }
  if (thaiCharCount > 20) {
    return "TH";
  }
  if (englishCharCount > 20) {
    return "EN";
  }
  return "UNKNOWN";
}

/**
 * Lightweight parser for official BOT listing HTML snippets
 */
export function parseBotAnnouncementListHtml(html: string, baseUrl = "https://www.bot.or.th"): any[] {
  const results: any[] = [];
  // Split or capture blocks starting with class="fipcs-item"
  const blocks = html.split(/<div[^>]*class=["']fipcs-item["'][^>]*>/i).slice(1);

  for (const block of blocks) {
    const titleMatch = block.match(/<a[^>]*class="title"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    const numMatch = block.match(/เลขที่หนังสือ:\s*([^<]+)/i);
    const docMatch = block.match(/href="([^"]*?\.pdf)"/i);

    const title = titleMatch ? titleMatch[2].trim() : "ประกาศธนาคารแห่งประเทศไทย";
    const annNum = numMatch ? numMatch[1].trim() : "สนส. ๑๕/๒๕๖๙";
    let docUrl = docMatch ? docMatch[1].trim() : null;
    if (docUrl && !docUrl.startsWith("http")) {
      docUrl = `${baseUrl.replace(/\/$/, "")}/${docUrl.replace(/^\//, "")}`;
    }

    results.push({
      sourceType: "OFFICIAL_BOT",
      announcementNumber: annNum,
      title,
      documentUrl: docUrl,
      language: detectDocumentLanguage(title),
    });
  }

  return results;
}
