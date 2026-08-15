import { formatAppJustification } from './screeningFormatter.js';

const tests = [
  "Operations involve conventional banking activities, primarily generating revenue through interest-based lending and deposits (Riba).",
  "Core business activities involve the production, distribution, and sale of alcoholic beverages, which are impermissible.",
  "Media and advertising operations present concerns regarding the revenue mix, specifically the proportion derived from advertising for impermissible sectors like alcohol and gambling."
];

for (const t of tests) {
    console.log("Original: " + t);
    console.log("Formatted: " + formatAppJustification(t, true));
    console.log("---");
}
