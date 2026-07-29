<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserNotification;

class NotificationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        if (!$user) {
            $this->command->warn('No users found. Skipping NotificationsSeeder.');
            return;
        }

        UserNotification::truncate();

        $notifications = [
            [
                'user_id' => $user->id,
                'icon' => '🔔',
                'title' => 'Dangote Cement — Status Changed',
                'category' => 'screening',
                'message' => 'Dangote Cement has moved from Halal to Non-Halal. Reason: Interest-bearing debt exceeded AAOIFI threshold (33.2%). Please review your holdings.',
                'action_url' => '/stocks/DANGCEM',
                'action_label' => 'View Report',
                'created_at' => now()->subHours(2),
                'read_at' => null,
            ],
            [
                'user_id' => $user->id,
                'icon' => '✅',
                'title' => 'Portfolio Update',
                'category' => 'portfolio',
                'message' => 'Your portfolio has been synced successfully. 7 holdings are Halal, 1 requires purification.',
                'action_url' => null,
                'action_label' => null,
                'created_at' => now()->subDays(1),
                'read_at' => now(),
            ],
            [
                'user_id' => $user->id,
                'icon' => '💰',
                'title' => 'Price Alert — MTNN',
                'category' => 'price_alerts',
                'message' => 'MTN Nigeria (MTNN) has reached your target price of ₦255.00. Current price: ₦256.50.',
                'action_url' => '/stocks/MTNN',
                'action_label' => 'View Stock',
                'created_at' => now()->subDays(3),
                'read_at' => null,
            ],
            [
                'user_id' => $user->id,
                'icon' => '📊',
                'title' => 'Screening Completed — BUAFOODS',
                'category' => 'screening',
                'message' => 'BUA Foods Plc has been re-screened using 2025 annual report data. Status remains Halal.',
                'action_url' => '/stocks/BUAFOODS',
                'action_label' => 'View Report',
                'created_at' => now()->subDays(5),
                'read_at' => now(),
            ],
            [
                'user_id' => $user->id,
                'icon' => '📰',
                'title' => 'Business Activity — NESTLE',
                'category' => 'business_activity',
                'message' => 'Nestlé Nigeria has announced expansion into fortified food products. This does not affect Shariah compliance.',
                'action_url' => null,
                'action_label' => null,
                'created_at' => now()->subDays(7),
                'read_at' => null,
            ],
        ];

        foreach ($notifications as $notification) {
            UserNotification::create($notification);
        }

        $this->command->info('Seed data inserted into UserNotifications.');
    }
}
