<?php
$data = json_decode(file_get_contents('/Users/sinan/Herd/irshad/backend/scratch/rephrased_fails.json'), true);

$unique = [];
foreach ($data as $symbol => $v) {
    $hash = md5($v['rephrased']);
    if (!isset($unique[$hash])) {
        $unique[$hash] = [
            'original' => $v['original'],
            'rephrased' => $v['rephrased'],
            'symbols' => []
        ];
    }
    $unique[$hash]['symbols'][] = $symbol;
}

$md = "# Rephrased Business Screening Rationales\n\n";
$md .= "The following lists the original and rephrased rationale for all 64 non-compliant companies that failed the business screening. Since many companies share the exact same reason (like conventional banking or insurance), they have been grouped together for easier review.\n\n";
$md .= "## User Review Required\n\n";
$md .= "> [!IMPORTANT]\n";
$md .= "> Please review the rephrased rationales below. They have been rewritten to be clearer and more professional. If you approve, I will apply these changes to the database.\n\n";
$md .= "## Proposed Changes\n\n";

foreach ($unique as $item) {
    $md .= "### " . implode(', ', $item['symbols']) . "\n\n";
    $md .= "**Original:**\n```text\n" . $item['original'] . "\n```\n\n";
    $md .= "**Rephrased:**\n```text\n" . $item['rephrased'] . "\n```\n\n";
    $md .= "---\n\n";
}

$md .= "## Verification Plan\n\n";
$md .= "### Automated Tests\n";
$md .= "- Run a script to verify that all 64 affected records in `aaoifi_screenings` have their `business_reasoning` updated to the new structure.\n\n";
$md .= "### Manual Verification\n";
$md .= "- Check a few tickers (e.g. UBA, TRANSCOHOT) in the screener UI to confirm the rewritten justification is displaying nicely.\n";

file_put_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/implementation_plan.md', $md);
