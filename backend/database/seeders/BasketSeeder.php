<?php

namespace Database\Seeders;

use App\Models\Basket;
use Illuminate\Database\Seeder;

class BasketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Re-seeding with Nigerian-focused baskets
        Basket::whereNull('user_id')->delete();

        $baskets = [
            [
                'name' => 'NGX Blue Chips',
                'description' => 'Shariah-compliant industry leaders on the Nigerian Exchange with consistent dividends and robust market capitalization.',
                'image_url' => 'https://images.unsplash.com/photo-1542222024-c39e2281f121',
                'category' => 'Nigeria Premium',
                'symbols' => ['DANGCEM', 'MTNN', 'BUACEMENT', 'NESTLE'],
                'is_active' => true,
            ],
            [
                'name' => 'Halal Agriculture',
                'description' => 'Support Nigeria’s food security and agricultural export expansion through ethical, Shariah-compliant plantation enterprises.',
                'image_url' => 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2',
                'category' => 'Agriculture',
                'symbols' => ['PRESCO', 'OKOMUOIL'],
                'is_active' => true,
            ],
            [
                'name' => 'Energy & Power',
                'description' => 'Premier Shariah-compliant energy producers and power generation leaders powering commercial expansion.',
                'image_url' => 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
                'category' => 'Energy & Power',
                'symbols' => ['SEPLAT', 'GEREGU', 'TOTAL'],
                'is_active' => true,
            ],
            [
                'name' => 'Consumer Champions',
                'description' => 'Household consumer goods and food manufacturing leaders with defensive everyday cash flows.',
                'image_url' => 'https://images.unsplash.com/photo-1542838132-92c53300491e',
                'category' => 'Consumer Goods',
                'symbols' => ['NESTLE', 'NASCON', 'UNILEVER', 'CADBURY'],
                'is_active' => true,
            ],
            [
                'name' => 'Industrial Giants',
                'description' => 'Heavy industry, manufacturing, and building materials powerhouses driving nationwide infrastructural growth.',
                'image_url' => 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122',
                'category' => 'Industrial Goods',
                'symbols' => ['DANGCEM', 'BUACEMENT', 'CUTIX', 'BERGER'],
                'is_active' => true,
            ],
            [
                'name' => 'Dividend Champions',
                'description' => 'Top dividend-yielding halal companies providing steady passive cash flow and disciplined balance sheets.',
                'image_url' => 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44',
                'category' => 'Income & Dividends',
                'symbols' => ['DANGCEM', 'PRESCO', 'OKOMUOIL', 'MTNN', 'SEPLAT'],
                'is_active' => true,
            ],
        ];

        foreach ($baskets as $basket) {
            Basket::create($basket);
        }
    }
}
