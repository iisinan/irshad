<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SectorController extends Controller
{
    /**
     * Get a distinct list of all sectors and their associated industries.
     */
    public function index()
    {
        // Fetch distinct sectors and industries from the stocks table
        $data = DB::table('ngx_stocks')
            ->select('sector', 'business_type as industry')
            ->whereNotNull('sector')
            ->where('sector', '!=', '')
            ->distinct()
            ->get();

        // Group the industries by sector
        $grouped = [];

        foreach ($data as $row) {
            // Normalize sector name for consistency if needed
            $sector = $row->sector;
            $industry = trim($row->industry ?? 'Other');

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
            'data' => $grouped
        ]);
    }
}
