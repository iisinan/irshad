<?php

namespace App\Services;

use App\Models\Company;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser as PdfParser;
use ZipArchive;

class StatementParserService
{
    /**
     * Common NGX stock aliases mapped to their official symbols.
     */
    protected array $aliases = [
        'MTN' => 'MTNN',
        'MTN NIGERIA' => 'MTNN',
        'MTN NIGERIA COMMUNICATIONS' => 'MTNN',
        'MTN NIGERIA COMMUNICATIONS PLC' => 'MTNN',
        'ZENITH' => 'ZENITHBANK',
        'ZENITH BANK' => 'ZENITHBANK',
        'ZENITH BANK PLC' => 'ZENITHBANK',
        'GTCO' => 'GTCO',
        'GT BANK' => 'GTCO',
        'GTBANK' => 'GTCO',
        'GUARANTY TRUST' => 'GTCO',
        'GUARANTY TRUST HOLDING COMPANY' => 'GTCO',
        'GUARANTY TRUST HOLDINGS' => 'GTCO',
        'GUARANTY TRUST BANK' => 'GTCO',
        'DANGOTE CEMENT' => 'DANGCEM',
        'DANGOTE CEMENT PLC' => 'DANGCEM',
        'DANGOTE SUGAR' => 'DANGSUGAR',
        'DANGOTE SUGAR REFINERY' => 'DANGSUGAR',
        'BUA CEMENT' => 'BUACEMENT',
        'BUA CEMENT PLC' => 'BUACEMENT',
        'BUA FOODS' => 'BUAFOODS',
        'BUA FOODS PLC' => 'BUAFOODS',
        'AIRTEL' => 'AIRTELAFRI',
        'AIRTEL AFRICA' => 'AIRTELAFRI',
        'AIRTEL AFRICA PLC' => 'AIRTELAFRI',
        'ACCESSCORP' => 'ACCESSCORP',
        'ACCESS HOLDINGS' => 'ACCESSCORP',
        'ACCESS BANK' => 'ACCESSCORP',
        'ACCESS BANK PLC' => 'ACCESSCORP',
        'UBA' => 'UBA',
        'UNITED BANK FOR AFRICA' => 'UBA',
        'UNITED BANK FOR AFRICA PLC' => 'UBA',
        'FBNH' => 'FBNH',
        'FIRST BANK' => 'FBNH',
        'FBN HOLDINGS' => 'FBNH',
        'FIRST BANK OF NIGERIA' => 'FBNH',
        'SEPLAT' => 'SEPLAT',
        'SEPLAT ENERGY' => 'SEPLAT',
        'SEPLAT PETROLEUM' => 'SEPLAT',
        'NESTLE' => 'NESTLE',
        'NESTLE NIGERIA' => 'NESTLE',
        'NESTLE NIGERIA PLC' => 'NESTLE',
        'GEREGU' => 'GEREGU',
        'GEREGU POWER' => 'GEREGU',
        'GEREGU POWER PLC' => 'GEREGU',
        'TRANSCORP' => 'TRANSCORP',
        'TRANSNATIONAL CORPORATION' => 'TRANSCORP',
        'TRANSCOHOT' => 'TRANSCOHOT',
        'TRANSCORP HOTELS' => 'TRANSCOHOT',
        'PRESCO' => 'PRESCO',
        'PRESCO PLC' => 'PRESCO',
        'OKOMU' => 'OKOMUOIL',
        'OKOMU OIL' => 'OKOMUOIL',
        'OKOMU OIL PALM' => 'OKOMUOIL',
        'FIDELITY' => 'FIDELITYBK',
        'FIDELITY BANK' => 'FIDELITYBK',
        'FIDELITY BANK PLC' => 'FIDELITYBK',
        'STANBIC' => 'STANBIC',
        'STANBIC IBTC' => 'STANBIC',
        'STANBIC IBTC HOLDINGS' => 'STANBIC',
        'TOTAL' => 'TOTAL',
        'TOTALENERGIES' => 'TOTAL',
        'TOTAL NIGERIA' => 'TOTAL',
        'CONOIL' => 'CONOIL',
        'CONOIL PLC' => 'CONOIL',
        'OANDO' => 'OANDO',
        'OANDO PLC' => 'OANDO',
        'WEMA' => 'WEMABANK',
        'WEMA BANK' => 'WEMABANK',
        'STERLING' => 'STERLINGNG',
        'STERLING BANK' => 'STERLINGNG',
        'STERLING FINANCIAL HOLDINGS' => 'STERLINGNG',
        'FCMB' => 'FCMB',
        'FCMB GROUP' => 'FCMB',
        'FLOUR MILLS' => 'FLOURMILL',
        'FLOUR MILLS OF NIGERIA' => 'FLOURMILL',
        'UNILEVER' => 'UNILEVER',
        'UNILEVER NIGERIA' => 'UNILEVER',
        'GUINNESS' => 'GUINNESS',
        'GUINNESS NIGERIA' => 'GUINNESS',
        'NB' => 'NB',
        'NIGERIAN BREWERIES' => 'NB',
        'CADBURY' => 'CADBURY',
        'CADBURY NIGERIA' => 'CADBURY',
        'PZ' => 'PZ',
        'PZ CUSSONS' => 'PZ',
        'NASCON' => 'NASCON',
        'NASCON ALLIED INDUSTRIES' => 'NASCON',
        'JAIZ' => 'JAIZBANK',
        'JAIZ BANK' => 'JAIZBANK',
        'TAJ' => 'TAJ',
        'TAJ BANK' => 'TAJ',
        'LOTUS' => 'LOTUSHAL15',
        'LOTUS HALAL' => 'LOTUSHAL15',
        'LOTUS CAPITAL' => 'LOTUSHAL15',
        'CWG' => 'CWG',
        'CHAMS' => 'CHAMS',
        'CORNERSTONE' => 'CORNERST',
        'AIICO' => 'AIICO',
        'AIICO INSURANCE' => 'AIICO',
        'MANSARD' => 'MANSARD',
        'AXA MANSARD' => 'MANSARD',
        'CUSTODIAN' => 'CUSTODIAN',
        'CUSTODIAN INVESTMENT' => 'CUSTODIAN',
        'VERITAS' => 'VERITASKAP',
        'SUNU' => 'SUNUASSUR',
        'LINKAGE' => 'LINKASSURE',
        'NEM' => 'NEM',
        'NEM INSURANCE' => 'NEM',
        'INTERNATIONAL BREWERIES' => 'INTBREW',
        'INTBREW' => 'INTBREW',
        'CHAMPION BREWERIES' => 'CHAMPION',
        'CHAMPION' => 'CHAMPION',
        'VITAFOAM' => 'VITAFOAM',
        'VITAFOAM NIGERIA' => 'VITAFOAM',
        'CAP' => 'CAP',
        'CAP PLC' => 'CAP',
        'BERGER' => 'BERGER',
        'BERGER PAINTS' => 'BERGER',
        'MEYER' => 'MEYER',
        'CUTIX' => 'CUTIX',
        'CUTIX PLC' => 'CUTIX',
        'ETERNA' => 'ETERNA',
        'ETERNA OIL' => 'ETERNA',
    ];

    /**
     * Parse an uploaded statement file and return normalized holdings.
     */
    public function parse(UploadedFile $file, ?string $password = null): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $filePath = $file->getRealPath();
        $extracted = [];
        $brokerDetected = 'Unknown Broker';

        try {
            if (in_array($extension, ['csv', 'txt'])) {
                $result = $this->parseCsv($filePath);
                $extracted = $result['holdings'] ?? [];
                $brokerDetected = $result['broker'] ?? 'CSV Trade Log';
            } elseif (in_array($extension, ['xlsx', 'xls'])) {
                $result = $this->parseXlsx($filePath);
                $extracted = $result['holdings'] ?? [];
                $brokerDetected = $result['broker'] ?? 'Excel Statement';
            } elseif ($extension === 'pdf') {
                $result = $this->parsePdf($filePath, $password);
                if (!empty($result['password_required'])) {
                    return $result;
                }
                $extracted = $result['holdings'] ?? [];
                $brokerDetected = $result['broker'] ?? 'PDF Statement';
            } else {
                throw new \InvalidArgumentException("Unsupported file extension: .{$extension}");
            }
        } catch (\Throwable $e) {
            $errMsg = strtolower($e->getMessage());
            if (str_contains($errMsg, 'secured') || str_contains($errMsg, 'password') || str_contains($errMsg, 'encrypt')) {
                return [
                    'password_required' => true,
                    'broker' => 'Encrypted PDF',
                    'holdings' => [],
                    'message' => 'This PDF statement is password-protected. Please enter your password to unlock it.',
                ];
            }

            Log::error("[StatementParserService] Error parsing file: " . $e->getMessage(), [
                'file' => $file->getClientOriginalName(),
                'trace' => $e->getTraceAsString(),
            ]);

            // If local parsing failed on PDF/XLSX, attempt Gemini AI extraction
            if (in_array($extension, ['pdf', 'xlsx', 'xls', 'csv'])) {
                Log::info("[StatementParserService] Attempting Gemini fallback extraction...");
                $geminiResult = $this->parseWithGemini($filePath, $file->getClientMimeType());
                if (!empty($geminiResult['holdings'])) {
                    $extracted = $geminiResult['holdings'];
                    $brokerDetected = $geminiResult['broker'] ?? 'Broker Statement';
                }
            }
        }

        // Reconcile and enrich matched holdings with current database status & prices
        return $this->reconcileHoldings($extracted, $brokerDetected);
    }

    /**
     * Parse CSV / TSV files with automatic column detection.
     */
    public function parseCsv(string $filePath): array
    {
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (empty($lines)) {
            return ['broker' => 'Empty CSV', 'holdings' => []];
        }

        // Determine delimiter (, or \t or ;)
        $firstLine = $lines[0];
        $delimiter = ',';
        if (substr_count($firstLine, "\t") > substr_count($firstLine, ',')) {
            $delimiter = "\t";
        } elseif (substr_count($firstLine, ';') > substr_count($firstLine, ',')) {
            $delimiter = ';';
        }

        $headerIdx = -1;
        $colMap = [];
        $broker = 'CSV Statement';

        // Scan the first 15 lines to identify the table header row
        foreach (array_slice($lines, 0, 15) as $i => $line) {
            $lower = strtolower($line);
            if (str_contains($lower, 'meristem')) $broker = 'Meristem Securities';
            elseif (str_contains($lower, 'stanbic')) $broker = 'Stanbic IBTC Stockbrokers';
            elseif (str_contains($lower, 'bamboo')) $broker = 'Bamboo';
            elseif (str_contains($lower, 'chaka')) $broker = 'Chaka';
            elseif (str_contains($lower, 'trove')) $broker = 'Trove';
            elseif (str_contains($lower, 'cscs')) $broker = 'CSCS Clearing';

            $cols = array_map('trim', str_getcsv($line, $delimiter, '"', "\\"));
            $foundCols = $this->detectColumns($cols);

            if (isset($foundCols['symbol']) && (isset($foundCols['shares']) || isset($foundCols['price']))) {
                $headerIdx = $i;
                $colMap = $foundCols;
                break;
            }
        }

        if ($headerIdx === -1 || !isset($colMap['symbol'])) {
            return ['broker' => $broker, 'holdings' => []];
        }

        $holdings = [];
        for ($i = $headerIdx + 1; $i < count($lines); $i++) {
            $row = array_map('trim', str_getcsv($lines[$i], $delimiter, '"', "\\"));
            if (empty($row) || count($row) <= $colMap['symbol']) continue;

            $rawSym = $row[$colMap['symbol']] ?? '';
            if (empty($rawSym) || is_numeric($rawSym)) continue;

            // Skip total / summary rows
            if (preg_match('/^(total|subtotal|balance|grand total|cash)/i', $rawSym)) continue;

            $shares = isset($colMap['shares']) && isset($row[$colMap['shares']])
                ? $this->cleanNumber($row[$colMap['shares']])
                : 0.0;

            $price = isset($colMap['price']) && isset($row[$colMap['price']])
                ? $this->cleanNumber($row[$colMap['price']])
                : 0.0;

            $date = isset($colMap['date']) && isset($row[$colMap['date']])
                ? $this->cleanDate($row[$colMap['date']])
                : null;

            if ($shares > 0) {
                $holdings[] = [
                    'symbol_or_name' => $rawSym,
                    'shares' => $shares,
                    'average_buy_price' => $price,
                    'purchase_date' => $date,
                ];
            }
        }

        return ['broker' => $broker, 'holdings' => $holdings];
    }

    /**
     * Parse Excel .xlsx files via native ZipArchive + SimpleXML (no heavy packages required).
     */
    public function parseXlsx(string $filePath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException("Unable to open XLSX archive.");
        }

        // 1. Read shared strings
        $sharedStrings = [];
        $stringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($stringsXml) {
            $xml = simplexml_load_string($stringsXml);
            if ($xml && isset($xml->si)) {
                foreach ($xml->si as $si) {
                    $sharedStrings[] = (string) ($si->t ?? ($si->r->t ?? ''));
                }
            }
        }

        // 2. Read sheet1.xml
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if (!$sheetXml) {
            throw new \RuntimeException("Sheet 1 not found in XLSX file.");
        }

        $xml = simplexml_load_string($sheetXml);
        if (!$xml || !isset($xml->sheetData->row)) {
            return ['broker' => 'Excel Statement', 'holdings' => []];
        }

        $rows = [];
        foreach ($xml->sheetData->row as $row) {
            $rIndex = (int) $row['r'];
            $cells = [];
            foreach ($row->c as $c) {
                $r = (string) $c['r'];
                $colLetters = preg_replace('/[0-9]/', '', $r);
                $colIdx = $this->columnLetterToIndex($colLetters);

                $val = (string) $c->v;
                if ((string) $c['t'] === 's' && isset($sharedStrings[(int) $val])) {
                    $val = $sharedStrings[(int) $val];
                }
                $cells[$colIdx] = trim($val);
            }
            if (!empty($cells)) {
                ksort($cells);
                $rows[$rIndex] = $cells;
            }
        }

        // Convert structured rows to CSV-like array
        $headerIdx = -1;
        $colMap = [];
        $broker = 'Excel Statement';

        foreach (array_slice($rows, 0, 15, true) as $rIdx => $row) {
            $rowStr = strtolower(implode(' ', $row));
            if (str_contains($rowStr, 'meristem')) $broker = 'Meristem Securities';
            elseif (str_contains($rowStr, 'stanbic')) $broker = 'Stanbic IBTC';
            elseif (str_contains($rowStr, 'cscs')) $broker = 'CSCS Clearing';

            $detected = $this->detectColumns($row);
            if (isset($detected['symbol']) && (isset($detected['shares']) || isset($detected['price']))) {
                $headerIdx = $rIdx;
                $colMap = $detected;
                break;
            }
        }

        if ($headerIdx === -1 || !isset($colMap['symbol'])) {
            return ['broker' => $broker, 'holdings' => []];
        }

        $holdings = [];
        foreach ($rows as $rIdx => $row) {
            if ($rIdx <= $headerIdx) continue;
            $rawSym = $row[$colMap['symbol']] ?? '';
            if (empty($rawSym) || is_numeric($rawSym)) continue;
            if (preg_match('/^(total|subtotal|balance|grand total|cash)/i', $rawSym)) continue;

            $shares = isset($colMap['shares']) && isset($row[$colMap['shares']])
                ? $this->cleanNumber($row[$colMap['shares']])
                : 0.0;

            $price = isset($colMap['price']) && isset($row[$colMap['price']])
                ? $this->cleanNumber($row[$colMap['price']])
                : 0.0;

            $date = isset($colMap['date']) && isset($row[$colMap['date']])
                ? $this->cleanDate($row[$colMap['date']])
                : null;

            if ($shares > 0) {
                $holdings[] = [
                    'symbol_or_name' => $rawSym,
                    'shares' => $shares,
                    'average_buy_price' => $price,
                    'purchase_date' => $date,
                ];
            }
        }

        return ['broker' => $broker, 'holdings' => $holdings];
    }

    /**
     * Parse standard digital PDFs using Smalot\PdfParser with regex heuristics.
     */
    public function parsePdf(string $filePath, ?string $password = null): array
    {
        // 1. Check if the PDF has encryption indicators
        $raw = @file_get_contents($filePath);
        $isEncrypted = $raw !== false && (str_contains($raw, '/Encrypt') || str_contains($raw, 'Encrypt'));

        if ($isEncrypted) {
            if (empty($password)) {
                return [
                    'password_required' => true,
                    'broker' => 'Encrypted PDF',
                    'holdings' => [],
                    'message' => 'This PDF statement is password-protected. Please enter your password to unlock it.',
                ];
            }

            // Attempt decryption via Python pypdf
            $decrypted = $this->decryptPdfWithPython($filePath, $password);
            if ($decrypted && file_exists($decrypted)) {
                $filePath = $decrypted;
            } else {
                return [
                    'password_required' => true,
                    'broker' => 'Encrypted PDF',
                    'holdings' => [],
                    'message' => 'Incorrect password or unable to unlock this statement. Please verify the password.',
                ];
            }
        }

        try {
            $parser = new PdfParser();
            $pdf = $parser->parseFile($filePath);
            $text = $pdf->getText();
        } catch (\Throwable $e) {
            $err = strtolower($e->getMessage());
            if (str_contains($err, 'secured') || str_contains($err, 'password') || str_contains($err, 'encrypt')) {
                return [
                    'password_required' => true,
                    'broker' => 'Encrypted PDF',
                    'holdings' => [],
                    'message' => 'This PDF statement is password-protected. Please enter your password to unlock it.',
                ];
            }
            $text = '';
        }

        if (empty(trim($text)) || strlen($text) < 50) {
            // Text is sparse or scanned; delegate directly to Gemini
            return $this->parseWithGemini($filePath, 'application/pdf');
        }

        $lines = explode("\n", $text);
        $broker = 'PDF Statement';
        $lowerText = strtolower($text);

        if (str_contains($lowerText, 'meristem')) $broker = 'Meristem Securities';
        elseif (str_contains($lowerText, 'stanbic ibtc')) $broker = 'Stanbic IBTC Stockbrokers';
        elseif (str_contains($lowerText, 'chapel hill')) $broker = 'Chapel Hill Denham';
        elseif (str_contains($lowerText, 'cardinalstone')) $broker = 'CardinalStone';
        elseif (str_contains($lowerText, 'cscs') || str_contains($lowerText, 'central securities clearing')) $broker = 'CSCS Statement';
        elseif (str_contains($lowerText, 'bamboo')) $broker = 'Bamboo';

        $holdings = [];

        // Match table rows: e.g. "MTNN 5,000 240.50" or "DANGCEM DANGOTE CEMENT 1,200 ₦285.00"
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // Pattern: Ticker/Name followed by numbers (quantity, price)
            if (preg_match('/^([A-Z0-9\.\-\& ]{2,35})\s+([\d,]+(?:\.\d+)?)\s+(?:₦|N|\$)?\s*([\d,]+(?:\.\d+)?)/i', $line, $matches)) {
                $sym = trim($matches[1]);
                if (preg_match('/^(total|subtotal|account|statement|date|page|client|balance)/i', $sym)) continue;
                // Exclude lines ending with a period or punctuation (prose/sentences)
                if (preg_match('/[\.\?\!]$/', $sym)) continue;

                $shares = $this->cleanNumber($matches[2]);
                $price = $this->cleanNumber($matches[3]);

                if ($shares > 0 && ($price > 0 || $shares >= 1)) {
                    $holdings[] = [
                        'symbol_or_name' => $sym,
                        'shares' => $shares,
                        'average_buy_price' => $price,
                        'purchase_date' => null,
                    ];
                }
            }
        }

        // Check if any extracted holding matches a known company symbol or alias
        $hasKnownMatch = false;
        foreach ($holdings as $h) {
            $s = strtoupper(trim($h['symbol_or_name'] ?? ''));
            if (Company::where('symbol', $s)->exists() || isset($this->aliases[$s])) {
                $hasKnownMatch = true;
                break;
            }
        }

        // If regex extraction yielded verified matches, or if Gemini key is absent, return it; otherwise invoke Gemini
        if ($hasKnownMatch || (count($holdings) >= 1 && empty(config('services.gemini.key')))) {
            return ['broker' => $broker, 'holdings' => $holdings];
        }

        return $this->parseWithGemini($filePath, 'application/pdf');
    }

    /**
     * Fallback AI Document Parser using Gemini Flash.
     */
    public function parseWithGemini(string $filePath, string $mimeType = 'application/pdf'): array
    {
        $apiKeysString = config('services.gemini.key');
        if (empty($apiKeysString)) {
            Log::warning("[StatementParserService] GEMINI_API_KEY is not configured for fallback.");
            return ['broker' => 'Statement Import', 'holdings' => []];
        }

        $apiKeys = array_map('trim', explode(',', $apiKeysString));
        $currentKeyIndex = Cache::get('gemini_key_index', 0);
        $apiKey = $apiKeys[$currentKeyIndex] ?? $apiKeys[0];

        try {
            // Upload file to Gemini Files API
            $uploadUrl = 'https://generativelanguage.googleapis.com/upload/v1beta/files?key=' . $apiKey;
            $fileSize = filesize($filePath);
            $fileResource = fopen($filePath, 'r');

            $ch = curl_init($uploadUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'X-Goog-Upload-Command: start, upload, finalize',
                'X-Goog-Upload-Header-Content-Length: ' . $fileSize,
                'X-Goog-Upload-Header-Content-Type: ' . $mimeType,
                'Content-Type: ' . $mimeType,
            ]);
            curl_setopt($ch, CURLOPT_PUT, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
            curl_setopt($ch, CURLOPT_INFILE, $fileResource);
            curl_setopt($ch, CURLOPT_INFILESIZE, $fileSize);

            $responseBody = curl_exec($ch);
            fclose($fileResource);

            $uploadData = json_decode($responseBody, true);
            $fileUri = $uploadData['file']['uri'] ?? null;

            if (!$fileUri) {
                Log::error("[StatementParserService] Gemini file upload failed: " . $responseBody);
                return ['broker' => 'Statement Import', 'holdings' => []];
            }

            // Generate structured content from Gemini Flash
            $prompt = 'You are an expert investment statement parser. Analyze this portfolio statement or trade log from any brokerage institution. Extract all equity/stock holdings and positions. Return ONLY a valid JSON object matching this schema without markdown codeblocks or quotes:
{
  "broker_name": "detected broker name or unknown",
  "holdings": [
    {
      "symbol_or_name": "exact ticker or company name",
      "shares": 1000,
      "average_buy_price": 50.25,
      "purchase_date": "YYYY-MM-DD or null"
    }
  ]
}';

            $genUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey;
            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                            ['fileData' => ['mimeType' => $mimeType, 'fileUri' => $fileUri]],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.1,
                    'responseMimeType' => 'application/json',
                ],
            ];

            $response = Http::timeout(60)->post($genUrl, $payload);
            if ($response->successful()) {
                $candidates = $response->json('candidates.0.content.parts.0.text');
                $decoded = json_decode($candidates, true);
                if (isset($decoded['holdings']) && is_array($decoded['holdings'])) {
                    return [
                        'broker' => $decoded['broker_name'] ?? 'Broker Statement',
                        'holdings' => $decoded['holdings'],
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::error("[StatementParserService] Gemini parsing error: " . $e->getMessage());
        }

        return ['broker' => 'Statement Import', 'holdings' => []];
    }

    /**
     * Reconcile extracted holdings with the local companies database.
     */
    protected function reconcileHoldings(array $extracted, string $brokerName): array
    {
        $companies = Company::with('aaoifiScreening')
            ->get(['id', 'symbol', 'name', 'current_status', 'latest_price', 'logo_url']);

        $symbolMap = [];
        $nameMap = [];

        foreach ($companies as $c) {
            $symUpper = strtoupper($c->symbol);
            $nameUpper = strtoupper($c->name);

            $symbolMap[$symUpper] = $c;
            $nameMap[$nameUpper] = $c;

            // Strip "PLC", "HOLDINGS", etc. for fuzzy matching
            $cleanName = trim(preg_replace('/\b(plc|ltd|limited|holdings|group|holding)\b/i', '', $nameUpper));
            if (!empty($cleanName)) {
                $nameMap[$cleanName] = $c;
            }
        }

        $aggregated = [];

        foreach ($extracted as $item) {
            $raw = trim($item['symbol_or_name'] ?? '');
            if (empty($raw)) continue;

            $rawUpper = strtoupper($raw);
            $cleanRaw = trim(preg_replace('/\b(plc|ltd|limited|holdings|group|holding)\b/i', '', $rawUpper));

            $matchedCompany = null;

            // 1. Exact symbol match
            if (isset($symbolMap[$rawUpper])) {
                $matchedCompany = $symbolMap[$rawUpper];
            }
            // 2. Alias lookup
            elseif (isset($this->aliases[$rawUpper]) && isset($symbolMap[$this->aliases[$rawUpper]])) {
                $matchedCompany = $symbolMap[$this->aliases[$rawUpper]];
            } elseif (isset($this->aliases[$cleanRaw]) && isset($symbolMap[$this->aliases[$cleanRaw]])) {
                $matchedCompany = $symbolMap[$this->aliases[$cleanRaw]];
            }
            // 3. Exact clean company name match
            elseif (isset($nameMap[$cleanRaw])) {
                $matchedCompany = $nameMap[$cleanRaw];
            }
            // 4. Substring search across tickers and names
            else {
                foreach ($symbolMap as $sym => $comp) {
                    if (str_contains($cleanRaw, $sym) || str_contains($sym, $cleanRaw)) {
                        $matchedCompany = $comp;
                        break;
                    }
                }
            }

            $shares = (float) ($item['shares'] ?? 0);
            $avgBuyPrice = (float) ($item['average_buy_price'] ?? 0);
            $purchaseDate = !empty($item['purchase_date']) ? $this->cleanDate($item['purchase_date']) : null;

            $groupKey = $matchedCompany
                ? 'comp_' . $matchedCompany->id
                : 'raw_' . strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $raw));

            if (!isset($aggregated[$groupKey])) {
                $aggregated[$groupKey] = [
                    'matched_company' => $matchedCompany,
                    'raw_symbol' => $raw,
                    'total_shares' => 0.0,
                    'total_cost' => 0.0,
                    'earliest_date' => $purchaseDate,
                    'fallback_price' => $avgBuyPrice,
                ];
            }

            if ($shares > 0) {
                $aggregated[$groupKey]['total_shares'] += $shares;
                $costPrice = $avgBuyPrice > 0 ? $avgBuyPrice : (float) ($matchedCompany?->latest_price ?? 0);
                $aggregated[$groupKey]['total_cost'] += ($shares * $costPrice);
            }

            if ($purchaseDate) {
                if (!$aggregated[$groupKey]['earliest_date'] || $purchaseDate < $aggregated[$groupKey]['earliest_date']) {
                    $aggregated[$groupKey]['earliest_date'] = $purchaseDate;
                }
            }
        }

        $reconciled = [];
        $matchedCount = 0;

        foreach ($aggregated as $entry) {
            $matchedCompany = $entry['matched_company'];
            $raw = $entry['raw_symbol'];
            $shares = $entry['total_shares'];
            $totalCost = $entry['total_cost'];
            $date = $entry['earliest_date'] ?? now()->format('Y-m-d');

            if ($shares <= 0) continue;

            $weightedPrice = $totalCost > 0 ? round($totalCost / $shares, 2) : $entry['fallback_price'];

            if ($matchedCompany) {
                $matchedCount++;
                $status = $matchedCompany->current_status ?? $matchedCompany->aaoifiScreening?->final_status ?? 'doubtful';
                $reconciled[] = [
                    'company_id' => $matchedCompany->id,
                    'symbol' => $matchedCompany->symbol,
                    'company_name' => $matchedCompany->name,
                    'shares' => $shares,
                    'average_buy_price' => $weightedPrice > 0 ? $weightedPrice : (float) ($matchedCompany->latest_price ?? 0),
                    'current_price' => (float) ($matchedCompany->latest_price ?? 0),
                    'purchase_date' => $date,
                    'status' => strtolower($status),
                    'logo_url' => $matchedCompany->logo_url,
                    'matched' => true,
                    'raw_symbol' => $raw,
                ];
            } else {
                $reconciled[] = [
                    'company_id' => null,
                    'symbol' => strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $raw), 0, 10)),
                    'company_name' => $raw,
                    'shares' => $shares,
                    'average_buy_price' => $weightedPrice,
                    'current_price' => 0.0,
                    'purchase_date' => $date,
                    'status' => 'doubtful',
                    'logo_url' => null,
                    'matched' => false,
                    'raw_symbol' => $raw,
                ];
            }
        }

        return [
            'broker' => $brokerName,
            'total_count' => count($reconciled),
            'matched_count' => $matchedCount,
            'holdings' => $reconciled,
        ];
    }

    /**
     * Decrypt password-protected PDF using python pypdf.
     */
    protected function decryptPdfWithPython(string $filePath, string $password): ?string
    {
        $pythonBinary = null;
        $possibleBinaries = [
            '/var/www/venv/bin/python3',
            '/var/www/venv/bin/python',
            'python3',
            'python',
        ];

        foreach ($possibleBinaries as $bin) {
            $check = @shell_exec("which $bin 2>/dev/null");
            if (!empty($check) || file_exists($bin)) {
                $pythonBinary = $bin;
                break;
            }
        }

        if (!$pythonBinary) {
            return null;
        }

        $outPath = tempnam(sys_get_temp_dir(), 'pdf_dec_') . '.pdf';
        
        $script = <<<'PY'
import sys, pypdf
try:
    reader = pypdf.PdfReader(sys.argv[1])
    if reader.is_encrypted:
        if not reader.decrypt(sys.argv[2]):
            sys.exit(1)
    writer = pypdf.PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    with open(sys.argv[3], "wb") as f:
        writer.write(f)
    sys.exit(0)
except Exception:
    sys.exit(1)
PY;

        $scriptFile = tempnam(sys_get_temp_dir(), 'py_dec_') . '.py';
        file_put_contents($scriptFile, $script);

        $cmd = escapeshellcmd($pythonBinary) . ' ' . escapeshellarg($scriptFile) . ' ' . escapeshellarg($filePath) . ' ' . escapeshellarg($password) . ' ' . escapeshellarg($outPath);
        $output = [];
        $returnVar = 0;
        exec($cmd, $output, $returnVar);

        @unlink($scriptFile);

        if ($returnVar === 0 && file_exists($outPath) && filesize($outPath) > 0) {
            return $outPath;
        }

        @unlink($outPath);
        return null;
    }

    /**
     * Map header strings to recognized data columns.
     */
    protected function detectColumns(array $headers): array
    {
        $map = [];
        foreach ($headers as $idx => $header) {
            $h = strtolower(trim($header));
            if (empty($h)) continue;

            // Date match first to avoid matching "value date" or "trade date" as security/rate
            if (!isset($map['date']) && preg_match('/\b(date|trade\s*date|transaction\s*date|purchase\s*date|value\s*date|time)\b/i', $h)) {
                $map['date'] = $idx;
            }
            // Price match (average cost, unit cost, buy price, consideration)
            elseif (!isset($map['price']) && preg_match('/\b(average|avg|cost|unit\s*cost|unit\s*price|buy\s*price|buy|price|rate|consideration)\b/i', $h)) {
                $map['price'] = $idx;
            }
            // Shares / Quantity
            elseif (!isset($map['shares']) && preg_match('/\b(shares|qty|quantity|units|volume|vol|balance|holdings|position)\b/i', $h)) {
                $map['shares'] = $idx;
            }
            // Symbol / Ticker / Description
            elseif (!isset($map['symbol']) && preg_match('/\b(symbol|ticker|stock|security|instrument|asset|code|description|company)\b/i', $h)) {
                $map['symbol'] = $idx;
            }
        }
        return $map;
    }

    /**
     * Parse and clean numeric strings from statements.
     */
    protected function cleanNumber(string|float|int $value): float
    {
        if (is_numeric($value)) return (float) $value;
        $cleaned = preg_replace('/[^\d\.\-]/', '', (string) $value);
        return is_numeric($cleaned) ? (float) $cleaned : 0.0;
    }

    /**
     * Clean and format dates into YYYY-MM-DD.
     */
    protected function cleanDate(string $rawDate): ?string
    {
        $raw = trim($rawDate);
        if (empty($raw)) return null;

        // Common DD/MM/YYYY or DD-MM-YYYY format in Nigerian statements
        if (preg_match('/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/', $raw, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
        }

        try {
            return Carbon::parse($raw)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Convert Excel column letter (e.g. A, B, Z, AA) to 0-based integer index.
     */
    protected function columnLetterToIndex(string $letters): int
    {
        $letters = strtoupper($letters);
        $len = strlen($letters);
        $idx = 0;
        for ($i = 0; $i < $len; $i++) {
            $idx = $idx * 26 + (ord($letters[$i]) - ord('A') + 1);
        }
        return $idx - 1;
    }
}
