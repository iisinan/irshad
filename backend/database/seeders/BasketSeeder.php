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
                'description' => 'Shariah-compliant industry leaders on the Nigerian Exchange with consistent dividends.',
                'image_url' => 'https://images.unsplash.com/photo-1542222024-c39e2281f121',
                'category' => 'Nigeria Premium',
                'symbols' => json_encode(['DANGCEM', 'MTNN', 'BUACEMENT', 'NESTLE']),
            ],
            [
                'name' => 'Halal Agriculture',
                'description' => 'Support Nigerias agricultural growth through ethical, Shariah-compliant firms.',
                'image_url' => 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2',
                'category' => 'Agriculture',
                'symbols' => json_encode(['PRESCO', 'OKOMUOIL']),
            ],
            [
                'name' => 'Infrastructure Growth',
                'description' => 'Ethical investments in Nigerian companies building national infrastructure.',
                'image_url' => 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
                'category' => 'Real Estate/Infra',
                'symbols' => json_encode(['JULI', 'UPDC']),
            ],
        ];

        foreach ($baskets as $basket) {
            Basket::create($basket);
        }
    }
}
