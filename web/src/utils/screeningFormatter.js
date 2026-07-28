/**
 * Formats Shariah screening justifications for the application interface.
 * Ensures concise notifications without academic citations (e.g., [1][4]) or redundant ratio details
 * when a stock already fails the qualitative business activity screen.
 */
export const formatAppJustification = (text, isNonHalal = false) => {
  if (!text || typeof text !== 'string') return '';

  // 1. Strip Wikipedia/AI citation reference markers e.g. [1], [2], [1, 2], [1][4]
  let clean = text.replace(/\[\d+(?:,\s*\d+)*\]/g, '').replace(/\[\d+\]/g, '').trim();

  // 2. If it is non-halal or non-compliant, check if it's a business activity failure
  const isBusinessActivityFailure = 
    isNonHalal || 
    /\b(?:conventional bank|commercial bank|banking|lending|deposit|riba|alcohol|gambling|insurance|brewery|pork|tobacco|rule 1|qualitative|business activity|interest-based)\b/i.test(clean);

  if (isBusinessActivityFailure) {
    // If it's a business activity failure, aggressively drop any discussion of ratios or stages
    const paragraphs = clean.split(/\n+/).map(p => p.trim()).filter(Boolean);
    const kept = [];
    
    for (const p of paragraphs) {
      // If a paragraph contains quantitative/ratio keywords, stop including any further paragraphs completely.
      if (/\b(?:ratio|stage\s*2|stage\s*3|quantitative|furthermore|additionally|interest-bearing debt|interest income|cash and equivalents|impermissible income|financial statement)\b/i.test(p)) {
        
        // As a fallback, try to extract just the first sentence of this paragraph if it doesn't have the ratio yet
        const sentences = p.split(/(?<=[.!?])\s+/);
        for (const s of sentences) {
           if (/\b(?:ratio|stage\s*2|stage\s*3|quantitative|furthermore|additionally|interest-bearing debt|interest income|cash and equivalents|impermissible income|financial statement|regardless of its financial ratios)\b/i.test(s)) {
              break;
           }
           kept.push(s);
        }
        break; // Stop parsing further paragraphs entirely
      }
      kept.push(p);
    }
    
    clean = kept.join(' ').trim();

    // Even within the remaining text, enforce a strict cutoff at transition words
    const ratioTransitions = [
      /\b(?:furthermore|additionally|moreover|in addition|however|also),?\s+(?:its|the|this|company['']?s)?\s*(?:financial|interest|debt|cash|quantitative|ratio|revenue|stage\s*2|stage\s*3)/i,
      /\b(?:in terms of|regarding|concerning|on the quantitative|from a quantitative|under quantitative|for quantitative|when evaluating|turning to)\s+(?:its|the|this|company['']?s)?\s*(?:financial|quantitative|ratio|stage)/i,
      /\b(?:its|the|company['']?s|this)\s+(?:interest-bearing debt|interest income|cash and equivalents|non-permissible income|impermissible income|financial|debt|cash|revenue)\s+ratio/i,
      /\b(?:stage\s*2|stage\s*3|quantitative financial ratio screening|quantitative screening)\b/i,
      /\bratios?\s+(?:show|indicate|are|exceed|fail|comply|remain)/i,
      /regardless of its financial ratios/i
    ];

    for (const regex of ratioTransitions) {
      const match = clean.match(regex);
      if (match) {
        clean = clean.substring(0, match.index).trim();
        // If it ended abruptly (e.g. comma or space), clean it up
        clean = clean.replace(/[,;:\s]+$/, '');
        if (!clean.endsWith('.') && !clean.endsWith('!') && !clean.endsWith('?')) {
          clean += '.';
        }
      }
    }
  }

  // 3. Clean up formatting, double periods, trailing commas, and excessive whitespace
  clean = clean.replace(/\.{2,}/g, '.').replace(/\s+/g, ' ').trim();

  // If after all this we're left with basically nothing, provide a safe fallback
  if (clean.length < 10) {
     return text.split(/(?<=[.!?])\s+/)[0]; // return just the first sentence of the original text
  }

  return clean;
};
