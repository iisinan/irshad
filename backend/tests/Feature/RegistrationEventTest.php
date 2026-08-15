<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Notification;
use App\Notifications\VerifyEmailNotification;

class RegistrationEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_fires_notification()
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        event(new Registered($user));

        Notification::assertSentTo(
            [$user], VerifyEmailNotification::class
        );
    }
}
