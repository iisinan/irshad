<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Resource;

class ResourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Prevent duplicates if running multiple times
        Resource::truncate();

        $resources = [
            [
                'title' => 'Introduction to Islamic Finance & Halal Stocks',
                'scholar' => 'Mufti Ismail Desai',
                'type' => 'video',
                'duration' => '45:12',
                'thumbnail' => 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop',
                'url' => 'https://www.youtube.com/embed/5-v_sT-dZiw',
                'category' => 'Beginner Guide',
                'external_id' => 'yt-5-v_sT-dZiw',
            ],
            [
                'title' => 'AAOIFI Shariah Standard No. 21 - Financial Papers',
                'scholar' => 'AAOIFI Board',
                'type' => 'document',
                'duration' => null,
                'thumbnail' => null,
                'url' => 'https://aaoifi.com/shariah-standards/',
                'category' => 'Standard',
                'external_id' => 'aaoifi-std-21',
            ],
            [
                'title' => 'How to Screen Stocks on the Nigerian Exchange',
                'scholar' => 'Irshad Research Team',
                'type' => 'video',
                'duration' => '12:30',
                'thumbnail' => 'https://images.unsplash.com/photo-1590283603385-18ff3858414d?q=80&w=2070&auto=format&fit=crop',
                'url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
                'category' => 'Tutorial',
                'external_id' => 'yt-tutorial-ngx',
            ],
            [
                'title' => 'Dividend Purification: A Practical Guide',
                'scholar' => 'Sheikh Dr. Joe Bradford',
                'type' => 'video',
                'duration' => '28:15',
                'thumbnail' => 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop',
                'url' => 'https://www.youtube.com/embed/bL9K1kYFj7s',
                'category' => 'Advanced',
                'external_id' => 'yt-purification',
            ],
            [
                'title' => 'The Halal Investing Playbook 2026',
                'scholar' => 'Amanah Advisors',
                'type' => 'document',
                'duration' => null,
                'thumbnail' => null,
                'url' => 'https://example.com/halal-investing-playbook.pdf',
                'category' => 'Strategy',
                'external_id' => 'amanah-playbook',
            ],
            [
                'title' => 'Understanding Debt to Market Cap Ratio',
                'scholar' => 'Dr. Muhammad Al-Bashir',
                'type' => 'video',
                'duration' => '18:40',
                'thumbnail' => 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=2070&auto=format&fit=crop',
                'url' => 'https://www.youtube.com/embed/8v_4O44sfjM',
                'category' => 'Intermediate',
                'external_id' => 'yt-debt-ratio',
            ],
            [
                'title' => 'How to Invest in Halal Stocks for Beginners',
                'scholar' => 'Practical Islamic Finance',
                'type' => 'video',
                'duration' => '15:20',
                'thumbnail' => 'https://images.unsplash.com/photo-1590283603385-18ff3858414d?q=80&w=2070&auto=format&fit=crop',
                'url' => 'https://www.youtube.com/embed/K8_Y701N1O0',
                'category' => 'Beginner Guide',
                'external_id' => 'yt-halal-beginners',
            ],
            [
                'title' => 'Shariah Compliant Stock Screening Explained',
                'scholar' => 'Islamic Finance Guru',
                'type' => 'video',
                'duration' => '22:15',
                'thumbnail' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
                'url' => 'https://www.youtube.com/embed/1v_4O44sXyZ',
                'category' => 'Intermediate',
                'external_id' => 'yt-shariah-screening',
            ],
            [
                'title' => 'Halal ETFs vs Individual Stocks',
                'scholar' => 'Amanah Wealth',
                'type' => 'video',
                'duration' => '10:45',
                'thumbnail' => 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop',
                'url' => 'https://www.youtube.com/embed/2B_4O44sABC',
                'category' => 'Strategy',
                'external_id' => 'yt-etf-vs-stocks',
            ]
        ];

        foreach ($resources as $res) {
            Resource::updateOrCreate(
                ['external_id' => $res['external_id']],
                $res
            );
        }
    }
}
