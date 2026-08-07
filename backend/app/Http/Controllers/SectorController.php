<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class SectorController extends Controller
{
    /**
     * Get a distinct list of all sectors and their associated industries.
     */
    public function index()
    {
        try {
            // Fetch sectors and industries from the companies table
            $data = DB::table('companies')
                ->select('sector', 'industry', 'business_type')
                ->whereNotNull('sector')
                ->where('sector', '!=', '')
                ->get();

            $grouped = [];

            foreach ($data as $row) {
                $sector = trim($row->sector ?? '');
                if (!$sector) continue;

                $industry = trim($row->industry ?? $row->business_type ?? 'Other');
                if (!$industry) $industry = 'Other';

                // Handle known slight misspellings or casing issues in DB
                if (strtolower($sector) === 'ict') {
                    $sector = 'ICT';
                } elseif (strtolower($sector) === 'oil and gas') {
                    $sector = 'Oil & Gas';
                } elseif (strtolower($sector) === 'construction/real estate') {
                    $sector = 'Real Estate';
                }

                if (!isset($grouped[$sector])) {
                    $grouped[$sector] = [];
                }

                if (!in_array($industry, $grouped[$sector])) {
                    $grouped[$sector][] = $industry;
                }
            }

            // Sort industries alphabetically within each sector
            foreach ($grouped as $key => $industries) {
                sort($industries);
                $grouped[$key] = $industries;
            }

            // Sort the sectors alphabetically
            ksort($grouped);

            return response()->json([
                'status' => 'success',
                'data' => $grouped,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'success',
                'data' => (object)[],
            ]);
        }
    }
}
