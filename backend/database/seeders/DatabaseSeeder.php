<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Irshad Admin',
            'email' => 'admin@irshad',
            'password' => \Illuminate\Support\Facades\Hash::make('irshad'),
            'role' => 'admin',
        ]);

        $this->call(CompanySeeder::class);
        $this->call(BasketSeeder::class);
    }
}
