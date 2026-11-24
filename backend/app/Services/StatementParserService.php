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
        'JAIZ BANK PLC' => 'JAIZBANK',
        'LAFARGE' => 'HBMNG',
        'LAFARGE AFRICA' => 'HBMNG',
        'LAFARGE AFRICA PLC' => 'HBMNG',
        'WAPCO' => 'HBMNG',
        'HBMNG' => 'HBMNG',
        'ARADEL' => 'ARADEL',
        'ARADEL HOLDINGS' => 'ARADEL',
        'ARADEL HOLDINGS PLC' => 'ARADEL',
        'NAHCO' => 'NAHCO',
        'NIGERIAN AVIATION HANDLING' => 'NAHCO',
        'NIGERIAN AVIATION HANDLING COMPANY' => 'NAHCO',
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
     * Parse an uploaded statement file (any format) and return normalized holdings.
     * Detects format via magic bytes and structural inspection rather than trusting extension alone.
     */
    public function parse(UploadedFile $file, ?string $password = null): array
    {
        $filePath = $file->getRealPath();
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getMimeType() ?: $file->getClientMimeType();

        $detection = $this->detectDocumentFormat($filePath, $originalName, $mimeType);
        $format = $detection['format'];
        $formatLabel = $detection['label'];
        $extracted = [];
        $brokerDetected = 'Unknown Broker';
        $extractionMethod = 'deterministic';

        try {
            switch ($format) {
                case 'pdf':
                    $result = $this->parsePdf($filePath, $password);
                    if (!empty($result['password_required'])) {
                        $result['detected_format'] = $format;
                        $result['detected_format_label'] = $formatLabel;
                        return $result;
                    }
                    $extracted = $result['holdings'] ?? [];
                    $brokerDetected = $result['broker'] ?? 'PDF Statement';
                    break;

                case 'xlsx':
                    $result = $this->parseXlsx($filePath);
                    $extracted = $result['holdings'] ?? [];
                    $brokerDetected = $result['broker'] ?? 'Excel Workbook';
                    break;

                case 'docx':
                    $result = $this->parseDocx($filePath);
                    $extracted = $result['holdings'] ?? [];
                    $brokerDetected = $result['broker'] ?? 'Word Document';
                    break;

                case 'ods':
                    $result = $this->parseOds($filePath);
                    $extracted = $result['holdings'] ?? [];
                    $brokerDetected = $result['broker'] ?? 'OpenDocument Spreadsheet';
                    break;

                case 'json':
                    $result = $this->parseJson($filePath);
                    $extracted = $result['holdings'] ?? [];
                    $brokerDetected = $result['broker'] ?? 'JSON Portfolio Export';
                    break;

                case 'html':
                case 'xml':
                    $result = $this->parseHtmlOrXml($filePath);
                    $extracted = $result['holdings'] ?? [];
                    $brokerDetected = $result['broker'] ?? 'Web / XML Statement';
                    break;

                case 'csv':
                case 'tsv':
                    $result = $this->parseCsv($filePath);
                    $extracted = $result['holdings'] ?? [];
                    $brokerDetected = $result['broker'] ?? 'Delimited Portfolio';
                    if (empty($extracted)) {
                        $rawText = @file_get_contents($filePath) ?: '';
                        $textRes = $this->parseUnstructuredText($rawText);
                        $extracted = $textRes['holdings'] ?? [];
                        $brokerDetected = $textRes['broker'] ?? $brokerDetected;
                    }
                    break;

                case 'image':
                    $extractionMethod = 'ai_vision';
                    $visionMime = $detection['mime'] ?: ($mimeType ?: 'image/png');
                    $geminiResult = $this->parseWithGemini($filePath, $visionMime);
                    $extracted = $geminiResult['holdings'] ?? [];
                    $brokerDetected = $geminiResult['broker'] ?? 'Screenshot / Scanned Statement';
                    break;

                case 'ole_office':
                case 'text':
                default:
                    $rawText = @file_get_contents($filePath) ?: '';
                    if ($format !== 'ole_office' && $rawText !== '') {
                        $csvTry = $this->parseCsv($filePath);
                        if (!empty($csvTry['holdings'])) {
                            $extracted = $csvTry['holdings'];
                            $brokerDetected = $csvTry['broker'] ?? 'Text Statement';
                            break;
                        }
                        $textRes = $this->parseUnstructuredText($rawText);
                        $extracted = $textRes['holdings'] ?? [];
                        $brokerDetected = $textRes['broker'] ?? 'Text / Blotter';
                    }
                    break;
            }
        } catch (\Throwable $e) {
            $errMsg = strtolower($e->getMessage());
            if (str_contains($errMsg, 'secured') || str_contains($errMsg, 'password') || str_contains($errMsg, 'encrypt')) {
                return [
                    'password_required' => true,
                    'detected_format' => $format,
                    'detected_format_label' => $formatLabel,
                    'broker' => 'Encrypted PDF',
                    'holdings' => [],
                    'message' => 'This PDF statement is password-protected. Please enter your password to unlock it.',
                ];
            }

            Log::error("[StatementParserService] Error parsing {$format} file: " . $e->getMessage(), [
                'file' => $originalName,
            ]);
        }

        // Universal intelligent AI fallback if deterministic extraction yielded nothing
        if (empty($extracted)) {
            $extractionMethod = 'ai_assisted';
            $geminiResult = $this->parseAnyWithGemini($filePath, $format, $detection['mime'] ?: ($mimeType ?: 'application/octet-stream'));
            if (!empty($geminiResult['holdings'])) {
                $extracted = $geminiResult['holdings'];
                $brokerDetected = $geminiResult['broker'] ?? $brokerDetected;
            }
        }

        $reconciled = $this->reconcileHoldings($extracted, $brokerDetected);
        $reconciled['detected_format'] = $format;
        $reconciled['detected_format_label'] = $formatLabel;
        $reconciled['extraction_method'] = $extractionMethod;

        return $reconciled;
    }

    /**
     * Parse raw pasted portfolio / blotter text (from email, WhatsApp, Bloomberg, Excel copy-paste).
     */
    public function parseRawText(string $rawText): array
    {
        $trimmed = trim($rawText);
        if ($trimmed === '') {
            return [
                'broker' => 'Pasted Portfolio',
                'detected_format' => 'text',
                'detected_format_label' => 'Pasted Text / Blotter',
                'extraction_method' => 'deterministic',
                'total_count' => 0,
                'matched_count' => 0,
                'holdings' => [],
            ];
        }

        $tmp = tempnam(sys_get_temp_dir(), 'raw_port_');
        file_put_contents($tmp, $trimmed);

        try {
            $firstChar = substr(ltrim($trimmed), 0, 1);
            $extracted = [];
            $broker = 'Pasted Portfolio';
            $format = 'text';
            $formatLabel = 'Pasted Text / Blotter';
            $method = 'deterministic';

            if (($firstChar === '{' || $firstChar === '[') && json_decode($trimmed, true) !== null) {
                $format = 'json';
                $formatLabel = 'Pasted JSON Payload';
                $res = $this->parseJson($tmp);
                $extracted = $res['holdings'] ?? [];
                $broker = $res['broker'] ?? $broker;
            } elseif (stripos($trimmed, '<table') !== false || stripos($trimmed, '<html') !== false) {
                $format = 'html';
                $formatLabel = 'Pasted HTML Table';
                $res = $this->parseHtmlOrXml($tmp);
                $extracted = $res['holdings'] ?? [];
                $broker = $res['broker'] ?? $broker;
            } else {
                $csvRes = $this->parseCsv($tmp);
                if (!empty($csvRes['holdings'])) {
                    $format = 'csv';
                    $formatLabel = 'Pasted Table / CSV';
                    $extracted = $csvRes['holdings'];
                    $broker = $csvRes['broker'] ?? $broker;
                } else {
                    $textRes = $this->parseUnstructuredText($trimmed);
                    $extracted = $textRes['holdings'] ?? [];
                    $broker = $textRes['broker'] ?? $broker;
                }
            }

            if (empty($extracted)) {
                $method = 'ai_assisted';
                $ai = $this->parseTextWithGemini($trimmed);
                $extracted = $ai['holdings'] ?? [];
                $broker = $ai['broker'] ?? $broker;
            }

            $reconciled = $this->reconcileHoldings($extracted, $broker);
            $reconciled['detected_format'] = $format;
            $reconciled['detected_format_label'] = $formatLabel;
            $reconciled['extraction_method'] = $method;

            return $reconciled;
        } finally {
            @unlink($tmp);
        }
    }

    /**
     * Detect actual file format using magic bytes, ZIP entry inspection, and content heuristics.
     */
    public function detectDocumentFormat(string $filePath, string $originalName = '', ?string $mimeType = null): array
    {
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $fh = @fopen($filePath, 'rb');
        $head = $fh ? fread($fh, 4096) : '';
        if ($fh) {
            fclose($fh);
        }

        // 1. Binary Magic Bytes
        if (str_starts_with($head, '%PDF-') || preg_match('/^.{0,16}%PDF-/s', $head)) {
            return ['format' => 'pdf', 'label' => 'PDF Statement (.pdf)', 'mime' => 'application/pdf'];
        }

        if (str_starts_with($head, "\x89PNG\r\n\x1a\n")) {
            return ['format' => 'image', 'label' => 'PNG Image / Screenshot', 'mime' => 'image/png'];
        }
        if (str_starts_with($head, "\xFF\xD8\xFF")) {
            return ['format' => 'image', 'label' => 'JPEG Image / Photo', 'mime' => 'image/jpeg'];
        }
        if (str_starts_with($head, 'GIF87a') || str_starts_with($head, 'GIF89a')) {
            return ['format' => 'image', 'label' => 'GIF Image', 'mime' => 'image/gif'];
        }
        if (str_starts_with($head, 'RIFF') && substr($head, 8, 4) === 'WEBP') {
            return ['format' => 'image', 'label' => 'WebP Image', 'mime' => 'image/webp'];
        }
        if (str_starts_with($head, "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1")) {
            return ['format' => 'ole_office', 'label' => 'Legacy Office / Excel (.xls/.doc)', 'mime' => 'application/vnd.ms-excel'];
        }

        // 2. ZIP Container (XLSX, DOCX, ODS, etc.)
        if (str_starts_with($head, "PK\x03\x04")) {
            $zip = new ZipArchive();
            if ($zip->open($filePath) === true) {
                $hasXlsx = $zip->locateName('xl/workbook.xml') !== false || $zip->locateName('xl/worksheets/sheet1.xml') !== false;
                $hasDocx = $zip->locateName('word/document.xml') !== false;
                $mimeEntry = $zip->getFromName('mimetype');
                $zip->close();

                if ($hasXlsx) {
                    return ['format' => 'xlsx', 'label' => 'Excel Workbook (.xlsx)', 'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
                }
                if ($hasDocx) {
                    return ['format' => 'docx', 'label' => 'Word Document (.docx)', 'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                }
                if (is_string($mimeEntry) && str_contains($mimeEntry, 'spreadsheet')) {
                    return ['format' => 'ods', 'label' => 'OpenDocument Spreadsheet (.ods)', 'mime' => 'application/vnd.oasis.opendocument.spreadsheet'];
                }
            }
        }

        // 3. Text / Markup / Structured Text Inspection (strip UTF-8/UTF-16 BOMs)
        $cleanText = preg_replace('/^\xEF\xBB\xBF/', '', $head);
        $trimmed = ltrim($cleanText);

        if ($trimmed !== '') {
            $first = substr($trimmed, 0, 1);
            if ($first === '{' || $first === '[') {
                $full = @file_get_contents($filePath);
                if ($full !== false && json_decode($full, true) !== null) {
                    return ['format' => 'json', 'label' => 'JSON Portfolio (.json)', 'mime' => 'application/json'];
                }
            }

            if (preg_match('/^<!doctype\s+html|<html[\s>]|<table[\s>]/i', $trimmed)) {
                return ['format' => 'html', 'label' => 'HTML Portfolio Table', 'mime' => 'text/html'];
            }

            if (str_starts_with($trimmed, '<?xml') || preg_match('/^<[a-z0-9:_-]+[\s>]/i', $trimmed)) {
                if (str_contains(strtolower($trimmed), 'workbook') || str_contains(strtolower($trimmed), 'worksheet')) {
                    return ['format' => 'html', 'label' => 'XML Spreadsheet', 'mime' => 'text/xml'];
                }
                return ['format' => 'xml', 'label' => 'XML Portfolio Export', 'mime' => 'text/xml'];
            }

            $lines = preg_split('/\r\n|\r|\n/', trim($cleanText));
            $sampleLines = array_slice($lines, 0, 10);
            $tabHits = 0;
            $commaHits = 0;
            $semiHits = 0;
            foreach ($sampleLines as $sl) {
                if (substr_count($sl, "\t") >= 1) $tabHits++;
                if (substr_count($sl, ',') >= 1) $commaHits++;
                if (substr_count($sl, ';') >= 1) $semiHits++;
            }

            if ($tabHits >= 2 || $ext === 'tsv') {
                return ['format' => 'tsv', 'label' => 'Tab-Separated Sheet (.tsv)', 'mime' => 'text/tab-separated-values'];
            }
            if ($commaHits >= 2 || $semiHits >= 2 || $ext === 'csv') {
                return ['format' => 'csv', 'label' => 'CSV Portfolio (.csv)', 'mime' => 'text/csv'];
            }

            return ['format' => 'text', 'label' => 'Text / Broker Blotter', 'mime' => 'text/plain'];
        }

        // Extension fallback if unreadable/unusual mime
        if (in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'], true) || ($mimeType && str_starts_with($mimeType, 'image/'))) {
            return ['format' => 'image', 'label' => 'Scanned Image', 'mime' => $mimeType ?: 'image/png'];
        }
        if ($ext === 'xlsx') {
            return ['format' => 'xlsx', 'label' => 'Excel Workbook (.xlsx)', 'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        }
        if ($ext === 'docx') {
            return ['format' => 'docx', 'label' => 'Word Document (.docx)', 'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        }
        if ($ext === 'pdf') {
            return ['format' => 'pdf', 'label' => 'PDF Statement (.pdf)', 'mime' => 'application/pdf'];
        }

        return ['format' => 'text', 'label' => strtoupper($ext ?: 'Unknown') . ' Document', 'mime' => $mimeType ?: 'text/plain'];
    }

    /**
     * Shared tabular row extractor used by CSV/TSV, XLSX, DOCX tables, ODS, and HTML tables.
     */
    protected function extractHoldingsFromTableRows(array $rows, string $defaultBroker = 'Statement'): array
    {
        $headerIdx = -1;
        $colMap = [];
        $broker = $defaultBroker;

        $scanned = 0;
        foreach ($rows as $rIdx => $row) {
            $scanned++;
            $rowStr = strtolower(implode(' ', array_map('strval', $row)));
            if (str_contains($rowStr, 'meristem')) $broker = 'Meristem Securities';
            elseif (str_contains($rowStr, 'stanbic')) $broker = 'Stanbic IBTC Stockbrokers';
            elseif (str_contains($rowStr, 'chapel hill')) $broker = 'Chapel Hill Denham';
            elseif (str_contains($rowStr, 'cardinalstone')) $broker = 'CardinalStone';
            elseif (str_contains($rowStr, 'lotus')) $broker = 'Lotus Capital';
            elseif (str_contains($rowStr, 'norrenberger')) $broker = 'Norrenberger';
            elseif (str_contains($rowStr, 'bamboo')) $broker = 'Bamboo';
            elseif (str_contains($rowStr, 'chaka')) $broker = 'Chaka';
            elseif (str_contains($rowStr, 'trove')) $broker = 'Trove';
            elseif (str_contains($rowStr, 'cscs')) $broker = 'CSCS Clearing';

            $detected = $this->detectColumns($row);
            if (isset($detected['symbol']) && (
                isset($detected['shares']) || isset($detected['price']) || isset($detected['market_value']) || isset($detected['weight'])
            )) {
                $headerIdx = $rIdx;
                $colMap = $detected;
                break;
            }
            if ($scanned >= 25) {
                break;
            }
        }

        if ($headerIdx === -1 || !isset($colMap['symbol'])) {
            return ['broker' => $broker, 'holdings' => []];
        }

        $holdings = [];
        $passedHeader = false;
        foreach ($rows as $rIdx => $row) {
            if ($rIdx === $headerIdx) {
                $passedHeader = true;
                continue;
            }
            if (! $passedHeader) {
                continue;
            }

            $rawSym = trim((string) ($row[$colMap['symbol']] ?? ''));
            if ($rawSym === '' || is_numeric($rawSym)) {
                continue;
            }
            if (preg_match('/^(total|subtotal|sub-total|grand total|portfolio value|net asset value|opening balance|closing balance)/i', $rawSym)) {
                continue;
            }

            $shares = isset($colMap['shares']) && isset($row[$colMap['shares']])
                ? $this->cleanNumber($row[$colMap['shares']])
                : 0.0;

            $price = isset($colMap['price']) && isset($row[$colMap['price']])
                ? $this->cleanNumber($row[$colMap['price']])
                : 0.0;

            $marketValue = isset($colMap['market_value']) && isset($row[$colMap['market_value']])
                ? $this->cleanNumber($row[$colMap['market_value']])
                : 0.0;

            $weightPct = isset($colMap['weight']) && isset($row[$colMap['weight']])
                ? $this->cleanNumber($row[$colMap['weight']])
                : null;

            $assetClass = isset($colMap['asset_class']) && isset($row[$colMap['asset_class']])
                ? trim((string) $row[$colMap['asset_class']])
                : null;

            $contract = isset($colMap['shariah_contract']) && isset($row[$colMap['shariah_contract']])
                ? trim((string) $row[$colMap['shariah_contract']])
                : null;

            $maturity = isset($colMap['maturity']) && isset($row[$colMap['maturity']])
                ? trim((string) $row[$colMap['maturity']])
                : null;

            $sector = isset($colMap['sector']) && isset($row[$colMap['sector']])
                ? trim((string) $row[$colMap['sector']])
                : null;

            $date = isset($colMap['date']) && isset($row[$colMap['date']])
                ? $this->cleanDate((string) $row[$colMap['date']])
                : null;

            if ($shares <= 0 && $marketValue > 0) {
                if ($price > 0) {
                    $shares = round($marketValue / $price, 4);
                } else {
                    $shares = 1.0;
                    $price = $marketValue;
                }
            }

            if ($shares > 0 || $marketValue > 0 || ($weightPct !== null && $weightPct > 0)) {
                $holdings[] = [
                    'symbol_or_name' => $rawSym,
                    'shares' => $shares,
                    'average_buy_price' => $price,
                    'market_value' => $marketValue > 0 ? $marketValue : null,
                    'weight_pct' => ($weightPct !== null && $weightPct > 0) ? $weightPct : null,
                    'asset_class' => $assetClass ?: null,
                    'shariah_contract' => $contract ?: null,
                    'maturity' => $maturity ?: null,
                    'sector' => $sector ?: null,
                    'purchase_date' => $date,
                ];
            }
        }

        return ['broker' => $broker, 'holdings' => $holdings];
    }

    /**
     * Parse CSV / TSV / Pipe / Semicolon delimited files with automatic delimiter & column detection.
     */
    public function parseCsv(string $filePath): array
    {
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (empty($lines)) {
            return ['broker' => 'Empty CSV', 'holdings' => []];
        }

        // Strip UTF-8 BOM if present on first line
        $lines[0] = preg_replace('/^\xEF\xBB\xBF/', '', $lines[0]);

        $sampleText = implode("\n", array_slice($lines, 0, 8));
        $delimiter = ',';
        $counts = [
            "\t" => substr_count($sampleText, "\t"),
            ',' => substr_count($sampleText, ','),
            ';' => substr_count($sampleText, ';'),
            '|' => substr_count($sampleText, '|'),
        ];
        arsort($counts);
        $topDelim = array_key_first($counts);
        if ($counts[$topDelim] > 0) {
            $delimiter = $topDelim;
        }

        $rows = [];
        foreach ($lines as $i => $line) {
            $cols = array_map('trim', str_getcsv($line, $delimiter, '"', "\\"));
            $rows[$i] = $cols;
        }

        return $this->extractHoldingsFromTableRows($rows, 'CSV Statement');
    }

    /**
     * Parse multi-sheet Excel .xlsx files via native ZipArchive + SimpleXML.
     */
    public function parseXlsx(string $filePath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException("Unable to open XLSX archive.");
        }

        // 1. Read shared strings (handles plain <t> and rich-text <r><t>)
        $sharedStrings = [];
        $stringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($stringsXml) {
            $xml = @simplexml_load_string($stringsXml);
            if ($xml && isset($xml->si)) {
                foreach ($xml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $buf = '';
                        foreach ($si->r as $run) {
                            $buf .= (string) ($run->t ?? '');
                        }
                        $sharedStrings[] = $buf;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // 2. Discover all worksheet XML entries cleanly
        $sheetPaths = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (preg_match('/^xl\/worksheets\/sheet\d+\.xml$/i', $name)) {
                $sheetPaths[] = $name;
            }
        }
        natsort($sheetPaths);

        $allHoldings = [];
        $detectedBroker = 'Excel Workbook';

        foreach ($sheetPaths as $sheetPath) {
            $sheetXml = $zip->getFromName($sheetPath);
            if (! $sheetXml) {
                continue;
            }
            $xml = @simplexml_load_string($sheetXml);
            if (! $xml || ! isset($xml->sheetData->row)) {
                continue;
            }

            $rows = [];
            foreach ($xml->sheetData->row as $row) {
                $rIndex = (int) $row['r'];
                $cells = [];
                foreach ($row->c as $c) {
                    $r = (string) $c['r'];
                    $colLetters = preg_replace('/[0-9]/', '', $r);
                    $colIdx = $colLetters !== '' ? $this->columnLetterToIndex($colLetters) : count($cells);

                    $type = (string) $c['t'];
                    $val = (string) $c->v;
                    if ($type === 's' && isset($sharedStrings[(int) $val])) {
                        $val = $sharedStrings[(int) $val];
                    } elseif ($type === 'inlineStr' && isset($c->is->t)) {
                        $val = (string) $c->is->t;
                    }
                    $cells[$colIdx] = trim($val);
                }
                if (! empty($cells)) {
                    ksort($cells);
                    $rows[$rIndex] = $cells;
                }
            }

            $res = $this->extractHoldingsFromTableRows($rows, 'Excel Workbook');
            if (! empty($res['holdings'])) {
                $allHoldings = array_merge($allHoldings, $res['holdings']);
                $detectedBroker = $res['broker'] ?? $detectedBroker;
            }
        }

        $zip->close();

        return ['broker' => $detectedBroker, 'holdings' => $allHoldings];
    }

    /**
     * Parse Word .docx documents by inspecting embedded tables (<w:tbl>) and paragraphs (<w:p>).
     */
    public function parseDocx(string $filePath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException("Unable to open DOCX archive.");
        }
        $docXml = $zip->getFromName('word/document.xml');
        $zip->close();

        if (! $docXml) {
            return ['broker' => 'Word Document', 'holdings' => []];
        }

        $dom = new \DOMDocument();
        @$dom->loadXML($docXml);

        $allHoldings = [];
        $broker = 'Word Document';

        // 1. Parse Word tables first
        $tables = $dom->getElementsByTagName('tbl');
        foreach ($tables as $tbl) {
            $tableRows = [];
            foreach ($tbl->getElementsByTagName('tr') as $tr) {
                $rowCells = [];
                foreach ($tr->getElementsByTagName('tc') as $tc) {
                    $rowCells[] = trim(preg_replace('/\s+/', ' ', $tc->textContent));
                }
                if (! empty(array_filter($rowCells, fn ($v) => $v !== ''))) {
                    $tableRows[] = $rowCells;
                }
            }
            if (! empty($tableRows)) {
                $res = $this->extractHoldingsFromTableRows($tableRows, 'Word Document');
                if (! empty($res['holdings'])) {
                    $allHoldings = array_merge($allHoldings, $res['holdings']);
                    $broker = $res['broker'] ?? $broker;
                }
            }
        }

        if (! empty($allHoldings)) {
            return ['broker' => $broker, 'holdings' => $allHoldings];
        }

        // 2. Fall back to paragraph text extraction
        $paraText = [];
        foreach ($dom->getElementsByTagName('p') as $p) {
            $txt = trim(preg_replace('/\s+/', ' ', $p->textContent));
            if ($txt !== '') {
                $paraText[] = $txt;
            }
        }

        return $this->parseUnstructuredText(implode("\n", $paraText), 'Word Document');
    }

    /**
     * Parse OpenDocument Spreadsheet (.ods) files cleanly via ZipArchive + DOMDocument.
     */
    public function parseOds(string $filePath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException("Unable to open ODS archive.");
        }
        $contentXml = $zip->getFromName('content.xml');
        $zip->close();

        if (! $contentXml) {
            return ['broker' => 'OpenDocument Spreadsheet', 'holdings' => []];
        }

        $dom = new \DOMDocument();
        @$dom->loadXML($contentXml);
        $tables = $dom->getElementsByTagName('table');
        $allHoldings = [];
        $broker = 'OpenDocument Spreadsheet';

        foreach ($tables as $table) {
            $tableRows = [];
            foreach ($table->getElementsByTagName('table-row') as $tr) {
                $rowCells = [];
                foreach ($tr->getElementsByTagName('table-cell') as $tc) {
                    $val = trim(preg_replace('/\s+/', ' ', $tc->textContent));
                    $repeat = (int) $tc->getAttribute('table:number-columns-repeated');
                    $repeatCount = ($repeat > 0 && $repeat <= 12) ? $repeat : 1;
                    for ($r = 0; $r < $repeatCount; $r++) {
                        $rowCells[] = $val;
                    }
                }
                if (! empty(array_filter($rowCells, fn ($v) => $v !== ''))) {
                    $tableRows[] = $rowCells;
                }
            }
            $res = $this->extractHoldingsFromTableRows($tableRows, 'OpenDocument Spreadsheet');
            if (! empty($res['holdings'])) {
                $allHoldings = array_merge($allHoldings, $res['holdings']);
                $broker = $res['broker'] ?? $broker;
            }
        }

        return ['broker' => $broker, 'holdings' => $allHoldings];
    }

    /**
     * Parse JSON portfolio payloads (array of holdings, nested keys, or symbol->units map).
     */
    public function parseJson(string $filePath): array
    {
        $raw = @file_get_contents($filePath);
        if (! $raw) {
            return ['broker' => 'JSON Portfolio', 'holdings' => []];
        }
        $data = json_decode($raw, true);
        if (! is_array($data)) {
            return ['broker' => 'JSON Portfolio', 'holdings' => []];
        }

        $broker = is_string($data['broker'] ?? null)
            ? $data['broker']
            : (is_string($data['institution'] ?? null) ? $data['institution'] : 'JSON Portfolio');

        // Recursively locate list of holding arrays
        $candidates = $data;
        foreach (['holdings', 'positions', 'portfolio', 'securities', 'constituents', 'data', 'items'] as $key) {
            if (isset($data[$key]) && is_array($data[$key])) {
                $candidates = $data[$key];
                break;
            }
        }

        $holdings = [];
        if (array_is_list($candidates)) {
            foreach ($candidates as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $sym = $row['symbol'] ?? $row['ticker'] ?? $row['stock'] ?? $row['security'] ?? $row['name'] ?? $row['symbol_or_name'] ?? null;
                $shares = $row['shares'] ?? $row['units'] ?? $row['quantity'] ?? $row['qty'] ?? $row['volume'] ?? 0;
                $price = $row['avg_price'] ?? $row['average_buy_price'] ?? $row['price'] ?? $row['unit_price'] ?? $row['cost'] ?? 0;
                if ($sym && (float) $shares > 0) {
                    $holdings[] = [
                        'symbol_or_name' => trim((string) $sym),
                        'shares' => $this->cleanNumber($shares),
                        'average_buy_price' => $this->cleanNumber($price),
                        'purchase_date' => isset($row['date']) ? $this->cleanDate((string) $row['date']) : null,
                    ];
                }
            }
        } else {
            // Associative map e.g. {"DANGCEM": 50000, "MTNN": 120000}
            foreach ($candidates as $sym => $val) {
                if (! is_string($sym) || preg_match('/^(broker|institution|name|currency|date|meta|summary)/i', $sym)) {
                    continue;
                }
                if (is_numeric($val) && (float) $val > 0) {
                    $holdings[] = [
                        'symbol_or_name' => trim($sym),
                        'shares' => (float) $val,
                        'average_buy_price' => 0.0,
                        'purchase_date' => null,
                    ];
                }
            }
        }

        return ['broker' => $broker, 'holdings' => $holdings];
    }

    /**
     * Parse HTML or XML documents containing portfolio tables.
     */
    public function parseHtmlOrXml(string $filePath): array
    {
        $raw = @file_get_contents($filePath);
        if (! $raw) {
            return ['broker' => 'Web Statement', 'holdings' => []];
        }

        $dom = new \DOMDocument();
        @$dom->loadHTML($raw, LIBXML_NOERROR | LIBXML_NOWARNING);

        $allHoldings = [];
        $broker = 'Web / HTML Statement';
        foreach ($dom->getElementsByTagName('table') as $table) {
            $tableRows = [];
            foreach ($table->getElementsByTagName('tr') as $tr) {
                $cells = [];
                foreach ($tr->childNodes as $child) {
                    if (in_array(strtolower($child->nodeName), ['th', 'td'], true)) {
                        $cells[] = trim(preg_replace('/\s+/', ' ', $child->textContent));
                    }
                }
                if (! empty(array_filter($cells, fn ($v) => $v !== ''))) {
                    $tableRows[] = $cells;
                }
            }
            if (! empty($tableRows)) {
                $res = $this->extractHoldingsFromTableRows($tableRows, $broker);
                if (! empty($res['holdings'])) {
                    $allHoldings = array_merge($allHoldings, $res['holdings']);
                    $broker = $res['broker'] ?? $broker;
                }
            }
        }

        if (! empty($allHoldings)) {
            return ['broker' => $broker, 'holdings' => $allHoldings];
        }

        $plain = trim(strip_tags($raw));
        return $this->parseUnstructuredText($plain, $broker);
    }

    /**
     * Smart unstructured text / Markdown / blotter line extractor matching against known symbols & aliases.
     */
    public function parseUnstructuredText(string $text, string $defaultBroker = 'Text Blotter'): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $text);
        $holdings = [];
        $broker = $defaultBroker;

        $lowerText = strtolower($text);
        if (str_contains($lowerText, 'meristem')) $broker = 'Meristem Securities';
        elseif (str_contains($lowerText, 'stanbic')) $broker = 'Stanbic IBTC Stockbrokers';
        elseif (str_contains($lowerText, 'lotus')) $broker = 'Lotus Capital';
        elseif (str_contains($lowerText, 'norrenberger')) $broker = 'Norrenberger';
        elseif (str_contains($lowerText, 'cscs')) $broker = 'CSCS Statement';

        foreach ($lines as $line) {
            $clean = trim(preg_replace('/[|`*•\-]+/', ' ', $line));
            if ($clean === '' || preg_match('/^(total|subtotal|account|statement|date|page|client|balance|symbol|ticker)/i', $clean)) {
                continue;
            }

            // Match percentage lines e.g. "FGN Sukuk 36%" or "ARADEL 12.5%"
            if (preg_match('/^([A-Z][A-Za-z0-9\.\&\/\-\s]{1,42}?)\s+(\d{1,3}(?:\.\d+)?)\s*%$/', $clean, $pm)) {
                $sym = trim($pm[1]);
                $wt = (float) $pm[2];
                if ($sym !== '' && $wt > 0) {
                    $holdings[] = [
                        'symbol_or_name' => $sym,
                        'shares' => 0.0,
                        'average_buy_price' => 0.0,
                        'market_value' => null,
                        'weight_pct' => $wt,
                        'purchase_date' => null,
                    ];
                }
                continue;
            }

            // Match e.g. "FGN Sukuk ₦350,000,000" (direct Naira valuation)
            if (preg_match('/^([A-Z][A-Za-z0-9\.\&\/\-\s]{1,42}?)\s+(?:₦|NGN)\s*([\d,]+(?:\.\d+)?)$/i', $clean, $nm)) {
                $sym = trim($nm[1]);
                $val = $this->cleanNumber($nm[2]);
                if ($sym !== '' && $val > 0) {
                    $holdings[] = [
                        'symbol_or_name' => $sym,
                        'shares' => 1.0,
                        'average_buy_price' => $val,
                        'market_value' => $val,
                        'purchase_date' => null,
                    ];
                }
                continue;
            }

            // Match e.g. "DANGCEM 50,000 285.00" or "DANGCEM - 50000" or "MTN Nigeria 120,000 units"
            if (preg_match('/^([A-Z][A-Z0-9\.\& ]{1,36}?)\s+([\d,]{2,}(?:\.\d+)?)(?:\s+(?:units|shares|qty))?(?:\s+(?:@|₦|NGN|N|\$)?\s*([\d,]+(?:\.\d+)?))?/i', $clean, $m)) {
                $sym = trim($m[1]);
                $shares = $this->cleanNumber($m[2]);
                $price = isset($m[3]) ? $this->cleanNumber($m[3]) : 0.0;
                if ($sym !== '' && $shares > 0) {
                    $holdings[] = [
                        'symbol_or_name' => $sym,
                        'shares' => $shares,
                        'average_buy_price' => $price,
                        'purchase_date' => null,
                    ];
                }
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

            // Optional leading row index (e.g. "1." or "1)") or date (e.g. "12/03/2024")
            $rowDate = null;
            if (preg_match('/^(\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4})\s+(.+)$/', $line, $dateMatches)) {
                $rowDate = $this->cleanDate($dateMatches[1]);
                $line = trim($dateMatches[2]);
            } elseif (preg_match('/^\d+[\.\)\-]\s+(.+)$/', $line, $numMatches)) {
                $line = trim($numMatches[1]);
            }

            // Pattern: Ticker/Name followed by numbers (quantity, price)
            if (preg_match('/^([A-Z0-9\.\-\& ]{2,40})\s+([\d,]+(?:\.\d+)?)\s+(?:₦|N|\$)?\s*([\d,]+(?:\.\d+)?)/i', $line, $matches)) {
                $sym = trim($matches[1], " \t\n\r\0\x0B.,:;");
                if (empty($sym)) continue;
                if (preg_match('/^(total|subtotal|account|statement|date|page|client|balance)/i', $sym)) continue;

                $shares = $this->cleanNumber($matches[2]);
                $price = $this->cleanNumber($matches[3]);

                if ($shares > 0 && ($price > 0 || $shares >= 1)) {
                    $holdings[] = [
                        'symbol_or_name' => $sym,
                        'shares' => $shares,
                        'average_buy_price' => $price,
                        'purchase_date' => $rowDate,
                    ];
                }
            }
        }

        // If regex extraction yielded results, return them
        if (count($holdings) >= 1) {
            return ['broker' => $broker, 'holdings' => $holdings];
        }

        // Try unstructured text line scan before invoking external AI
        $textFallback = $this->parseUnstructuredText($text, $broker);
        if (!empty($textFallback['holdings'])) {
            return $textFallback;
        }

        return $this->parseWithGemini($filePath, 'application/pdf');
    }

    protected function geminiExtractionPrompt(): string
    {
        return 'You are an expert institutional investment statement parser. Analyze this portfolio statement, factsheet, blotter, spreadsheet export, or screenshot from any brokerage, asset manager, PFA, or custodian. Extract ALL positions across Equities, Fixed Income (Sukuk, Bonds, Mudarabah, Murabaha, Wakalah, Ijarah, Commercial Paper, T-Bills), and Cash / Money Market. Return ONLY a valid JSON object matching this schema without markdown codeblocks:
{
  "broker_name": "detected institution, fund manager, or broker name or unknown",
  "holdings": [
    {
      "symbol_or_name": "exact ticker, bond/sukuk code, or security name",
      "asset_class": "equity | fixed_income | cash",
      "shariah_contract": "Screened Equity | Sukuk Al-Ijarah | Sukuk Al-Wakalah | Mudarabah | Murabaha | Wadiah | Conventional Fixed Income | null",
      "shares": 1000,
      "average_buy_price": 50.25,
      "market_value": 50250.00,
      "weight_pct": 12.5,
      "maturity": "e.g. 2029 or 180 days or null",
      "purchase_date": "YYYY-MM-DD or null"
    }
  ]
}';
    }

    /**
     * Route non-native formats cleanly into Gemini (extracting text first for XML/Office containers if needed).
     */
    protected function parseAnyWithGemini(string $filePath, string $format, string $mimeType): array
    {
        if (in_array($format, ['docx', 'xlsx', 'ods', 'html', 'xml', 'csv', 'tsv', 'json', 'text'], true)) {
            $extractedText = @file_get_contents($filePath) ?: '';
            if (in_array($format, ['docx', 'xlsx', 'ods'], true)) {
                $zip = new ZipArchive();
                if ($zip->open($filePath) === true) {
                    $chunks = [];
                    for ($i = 0; $i < $zip->numFiles; $i++) {
                        $entry = $zip->getNameIndex($i);
                        if (str_ends_with(strtolower($entry), '.xml')) {
                            $chunks[] = strip_tags(str_replace('<', ' <', (string) $zip->getFromIndex($i)));
                        }
                    }
                    $zip->close();
                    $extractedText = trim(preg_replace('/\s+/', ' ', implode("\n", $chunks)));
                }
            }
            if ($extractedText !== '') {
                return $this->parseTextWithGemini(mb_substr($extractedText, 0, 80000));
            }
        }

        return $this->parseWithGemini($filePath, $mimeType);
    }

    /**
     * Ask Gemini Flash to extract structured holdings directly from text/tables.
     */
    public function parseTextWithGemini(string $text): array
    {
        $apiKeysString = config('services.gemini.key');
        if (empty($apiKeysString)) {
            return ['broker' => 'Statement Import', 'holdings' => []];
        }
        $apiKeys = array_map('trim', explode(',', $apiKeysString));
        $currentKeyIndex = Cache::get('gemini_key_index', 0);
        $apiKey = $apiKeys[$currentKeyIndex] ?? $apiKeys[0];

        try {
            $genUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=' . $apiKey;
            $response = Http::timeout(45)->post($genUrl, [
                'contents' => [[
                    'parts' => [
                        ['text' => $this->geminiExtractionPrompt() . "\n\nDOCUMENT CONTENT:\n" . $text],
                    ],
                ]],
                'generationConfig' => [
                    'temperature' => 0.1,
                    'responseMimeType' => 'application/json',
                ],
            ]);

            if ($response->successful()) {
                $rawJson = (string) $response->json('candidates.0.content.parts.0.text');
                $rawJson = trim(str_replace(['```json', '```'], '', $rawJson));
                $decoded = json_decode($rawJson, true);
                if (isset($decoded['holdings']) && is_array($decoded['holdings'])) {
                    return [
                        'broker' => $decoded['broker_name'] ?? 'Broker Statement',
                        'holdings' => $decoded['holdings'],
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::error('[StatementParserService] Gemini text parsing error: ' . $e->getMessage());
        }

        return ['broker' => 'Statement Import', 'holdings' => []];
    }

    /**
     * Fallback AI Document & Vision Parser using Gemini Flash.
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
            $fileData = file_get_contents($filePath);
            $fileSize = strlen($fileData);

            // Prefer inline base64 for files <= 4MB (faster, fewer roundtrips); Files API for larger docs
            $docPart = null;
            if ($fileSize <= 4 * 1024 * 1024) {
                $docPart = [
                    'inlineData' => [
                        'mimeType' => $mimeType,
                        'data' => base64_encode($fileData),
                    ],
                ];
            } else {
                $uploadUrl = 'https://generativelanguage.googleapis.com/upload/v1beta/files?key=' . $apiKey;
                $uploadResponse = Http::withHeaders([
                    'X-Goog-Upload-Command' => 'start, upload, finalize',
                    'X-Goog-Upload-Header-Content-Length' => (string) $fileSize,
                    'X-Goog-Upload-Header-Content-Type' => $mimeType,
                    'Content-Type' => $mimeType,
                ])->withBody($fileData, $mimeType)
                  ->timeout(60)
                  ->post($uploadUrl);

                if ($uploadResponse->successful()) {
                    $fileUri = $uploadResponse->json('file.uri');
                    if ($fileUri) {
                        $docPart = ['fileData' => ['mimeType' => $mimeType, 'fileUri' => $fileUri]];
                    }
                }
            }

            if (! $docPart) {
                return ['broker' => 'Statement Import', 'holdings' => []];
            }

            $genUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=' . $apiKey;
            $response = Http::timeout(60)->post($genUrl, [
                'contents' => [[
                    'parts' => [
                        ['text' => $this->geminiExtractionPrompt()],
                        $docPart,
                    ],
                ]],
                'generationConfig' => [
                    'temperature' => 0.1,
                    'responseMimeType' => 'application/json',
                ],
            ]);

            if ($response->successful()) {
                $candidates = (string) $response->json('candidates.0.content.parts.0.text');
                $candidates = trim(str_replace(['```json', '```'], '', $candidates));
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
            $explicitAssetClass = strtolower(trim((string) ($item['asset_class'] ?? '')));
            $looksFixedIncomeOrCash = in_array($explicitAssetClass, ['fixed_income', 'fixed income', 'sukuk', 'bond', 'money_market', 'cash'], true)
                || preg_match('/\b(sukuk|ijarah|mudarabah|murabaha|wakalah|istisna|salam|t-bill|tbill|treasury|ntb|bond|eurobond|debenture|commercial\s*paper|term\s*deposit|fixed\s*deposit|money\s*market|wadiah|qard|fixed\s*income)\b/i', $rawUpper);

            if (! $looksFixedIncomeOrCash) {
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
                        if (strlen($sym) >= 3 && strlen($cleanRaw) >= 3 && (str_contains($cleanRaw, $sym) || str_contains($sym, $cleanRaw))) {
                            $matchedCompany = $comp;
                            break;
                        }
                    }
                }
            }

            $shares = (float) ($item['shares'] ?? 0);
            $avgBuyPrice = (float) ($item['average_buy_price'] ?? 0);
            $marketValue = (float) ($item['market_value'] ?? 0);
            $weightPct = isset($item['weight_pct']) ? (float) $item['weight_pct'] : null;
            $purchaseDate = !empty($item['purchase_date']) ? $this->cleanDate($item['purchase_date']) : null;

            if ($shares <= 0 && $marketValue > 0) {
                if ($avgBuyPrice > 0) {
                    $shares = round($marketValue / $avgBuyPrice, 4);
                } else {
                    $shares = 1.0;
                    $avgBuyPrice = $marketValue;
                }
            }

            $groupKey = $matchedCompany
                ? 'comp_' . $matchedCompany->id
                : 'raw_' . strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $raw));

            if (!isset($aggregated[$groupKey])) {
                $aggregated[$groupKey] = [
                    'matched_company' => $matchedCompany,
                    'raw_symbol' => $raw,
                    'total_shares' => 0.0,
                    'total_cost' => 0.0,
                    'total_market_value' => 0.0,
                    'weight_pct' => $weightPct,
                    'asset_class' => $item['asset_class'] ?? null,
                    'shariah_contract' => $item['shariah_contract'] ?? null,
                    'maturity' => $item['maturity'] ?? null,
                    'sector' => $item['sector'] ?? null,
                    'earliest_date' => $purchaseDate,
                    'fallback_price' => $avgBuyPrice,
                ];
            }

            if ($shares > 0) {
                $aggregated[$groupKey]['total_shares'] += $shares;
                $costPrice = $avgBuyPrice > 0 ? $avgBuyPrice : (float) ($matchedCompany?->latest_price ?? 0);
                $aggregated[$groupKey]['total_cost'] += ($shares * $costPrice);
            }
            if ($marketValue > 0) {
                $aggregated[$groupKey]['total_market_value'] += $marketValue;
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
            $entryMv = $entry['total_market_value'];
            $entryWeight = $entry['weight_pct'];
            $date = $entry['earliest_date'] ?? now()->format('Y-m-d');

            if ($shares <= 0 && $entryMv <= 0 && ($entryWeight === null || $entryWeight <= 0)) continue;

            $weightedPrice = ($shares > 0 && $totalCost > 0) ? round($totalCost / $shares, 2) : $entry['fallback_price'];

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
                    'market_value' => $entryMv > 0 ? round($entryMv, 2) : null,
                    'weight_pct' => $entryWeight,
                    'asset_class' => $entry['asset_class'] ?: 'equity',
                    'shariah_contract' => $entry['shariah_contract'],
                    'maturity' => $entry['maturity'],
                    'sector' => $entry['sector'],
                    'purchase_date' => $date,
                    'status' => strtolower($status),
                    'logo_url' => $matchedCompany->logo_url,
                    'matched' => true,
                    'raw_symbol' => $raw,
                ];
            } else {
                $reconciled[] = [
                    'company_id' => null,
                    'symbol' => strtoupper(substr(preg_replace('/[^A-Za-z0-9\-]/', '', $raw), 0, 18)),
                    'company_name' => $raw,
                    'shares' => $shares,
                    'average_buy_price' => $weightedPrice,
                    'current_price' => $weightedPrice > 0 ? $weightedPrice : ($entryMv > 0 && $shares > 0 ? round($entryMv / $shares, 2) : 0.0),
                    'market_value' => $entryMv > 0 ? round($entryMv, 2) : null,
                    'weight_pct' => $entryWeight,
                    'asset_class' => $entry['asset_class'],
                    'shariah_contract' => $entry['shariah_contract'],
                    'maturity' => $entry['maturity'],
                    'sector' => $entry['sector'],
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
            $h = strtolower(trim((string) $header));
            if ($h === '') continue;

            // Date match first to avoid matching "value date" or "trade date" as security/rate
            if (!isset($map['date']) && preg_match('/\b(date|trade\s*date|transaction\s*date|purchase\s*date|value\s*date|settlement\s*date|time)\b/i', $h)) {
                $map['date'] = $idx;
            }
            // Asset Class / Instrument Type / Sleeve
            elseif (!isset($map['asset_class']) && preg_match('/\b(asset\s*class|instrument\s*type|security\s*type|mandate\s*sleeve|sleeve|category|type)\b/i', $h)) {
                $map['asset_class'] = $idx;
            }
            // Shariah Contract / Structure
            elseif (!isset($map['shariah_contract']) && preg_match('/\b(shariah\s*contract|contract|structure|mode)\b/i', $h)) {
                $map['shariah_contract'] = $idx;
            }
            // Maturity / Tenor
            elseif (!isset($map['maturity']) && preg_match('/\b(maturity|tenor|maturity\s*date|duration)\b/i', $h)) {
                $map['maturity'] = $idx;
            }
            // Sector / Industry
            elseif (!isset($map['sector']) && preg_match('/\b(sector|industry|asset\s*group)\b/i', $h)) {
                $map['sector'] = $idx;
            }
            // Weight (%) / Allocation
            elseif (!isset($map['weight']) && preg_match('/^(weight(\s*\(%\))?|allocation(\s*\(%\))?|share\s*\(%\)|%)$|\b(weight\s*pct|weight\s*%|allocation\s*%)\b/i', $h)) {
                $map['weight'] = $idx;
            }
            // Market Value / Principal / Amount (check after value date!)
            elseif (!isset($map['market_value']) && preg_match('/\b(market\s*value|current\s*value|valuation|principal|face\s*value|amount|aum|value)\b/i', $h)) {
                $map['market_value'] = $idx;
            }
            // Price match (average cost, unit cost, buy price, market price, closing price)
            elseif (!isset($map['price']) && preg_match('/\b(average|avg|cost|unit\s*cost|unit\s*price|buy\s*price|market\s*price|closing\s*price|buy|price|rate|consideration)\b/i', $h)) {
                $map['price'] = $idx;
            }
            // Shares / Quantity / Shareholding
            elseif (!isset($map['shares']) && preg_match('/\b(shares|shareholding|qty|quantity|units|units\s*held|volume|vol|holdings|position)\b/i', $h)) {
                $map['shares'] = $idx;
            }
            // Symbol / Ticker / Security Name / Company
            elseif (!isset($map['symbol']) && preg_match('/\b(symbol|ticker|stock|stock\s*code|security|instrument|asset|code|isin|description|company|company\s*name|name|issuer|equity)\b/i', $h)) {
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
