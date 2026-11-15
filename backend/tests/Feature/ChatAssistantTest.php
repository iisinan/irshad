<?php

namespace Tests\Feature;

use App\Models\AaoifiScreening;
use App\Models\ChatConversation;
use App\Models\Company;
use App\Models\Suggestion;
use App\Models\User;
use App\Notifications\AdminSuggestionNotification;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatAssistantTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->prepareInMemorySchema();
    }

    private function prepareInMemorySchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('role')->default('user');
            $table->string('plan')->default('free');
            $table->json('preferences')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->json('features')->nullable();
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('plan_id');
            $table->string('billing_cycle')->nullable();
            $table->string('status')->default('active');
            $table->boolean('auto_renew')->default(false);
            $table->timestamp('renews_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('symbol')->unique();
            $table->string('sector')->nullable();
            $table->string('industry')->nullable();
            $table->string('current_status')->nullable();
            $table->decimal('latest_price', 14, 2)->nullable();
            $table->text('activity_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id');
            $table->string('status')->nullable();
            $table->boolean('verified_by_scholar')->default(false);
            $table->timestamps();
        });

        Schema::create('aaoifi_screenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id');
            $table->string('business_status')->nullable();
            $table->json('business_reasoning')->nullable();
            $table->decimal('debt_ratio', 8, 4)->nullable();
            $table->string('debt_status')->nullable();
            $table->decimal('cash_ratio', 8, 4)->nullable();
            $table->string('cash_status')->nullable();
            $table->decimal('impermissible_income_ratio', 8, 4)->nullable();
            $table->string('impermissible_income_status')->nullable();
            $table->string('final_status')->nullable();
            $table->json('news_sources')->nullable();
            $table->json('financial_data_used')->nullable();
            $table->timestamps();
        });

        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('scholar')->nullable();
            $table->string('type')->default('video');
            $table->string('duration')->nullable();
            $table->string('thumbnail')->nullable();
            $table->string('url');
            $table->string('category')->nullable();
            $table->string('external_id')->nullable();
            $table->timestamps();
        });

        Schema::create('holdings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('symbol');
            $table->decimal('shares', 16, 4)->default(0);
            $table->decimal('average_buy_price', 14, 2)->nullable();
            $table->date('purchase_date')->nullable();
            $table->timestamp('grace_period_ends_at')->nullable();
            $table->boolean('grace_period_notified')->default(false);
            $table->timestamps();
        });

        Schema::create('suggestions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('message');
            $table->string('status')->default('unread');
            $table->boolean('is_admin_reply')->default(false);
            $table->timestamps();
        });

        $migration = require database_path('migrations/2026_11_15_100000_create_chat_tables.php');
        $migration->up();
    }

    public function test_authenticated_user_receives_grounded_kb_reply_and_persists_history(): void
    {
        Config::set('services.gemini.key', 'test-gemini-key');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'reply' => 'Under AAOIFI rules, the debt ratio must stay under 30% alongside business activity filters.',
                                        'suggested_followups' => ['How do I purify dividends?'],
                                        'needs_human_support' => false,
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/chat/message', [
            'message' => 'Why does AAOIFI check both business activity and financial ratios?',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user_message.role', 'user')
            ->assertJsonPath('assistant_message.role', 'assistant')
            ->assertJsonPath('assistant_message.metadata.cited_symbols', [])
            ->assertJsonPath('assistant_message.metadata.provider', 'gemini');

        Http::assertSent(function ($request) {
            $systemText = $request['systemInstruction']['parts'][0]['text'] ?? '';

            return str_contains($systemText, 'AAOIFI Shariah Screening Methodology')
                && str_contains($systemText, 'STRICT COMPLIANCE POLICY');
        });

        $conversationId = $response->json('conversation.id');

        $second = $this->postJson('/api/v1/chat/message', [
            'conversation_id' => $conversationId,
            'message' => 'What about Zakat when my Hawl arrives?',
        ]);

        $second->assertStatus(201);
        $this->assertDatabaseCount('chat_conversations', 1);
        $this->assertDatabaseCount('chat_messages', 4);
    }

    public function test_stock_compliance_questions_are_declined_without_calling_llm(): void
    {
        Config::set('services.gemini.key', 'test-gemini-key');

        $company = Company::create([
            'name' => 'MTN Nigeria Communications',
            'symbol' => 'MTNN',
            'sector' => 'Telecommunications',
            'current_status' => 'compliant',
            'latest_price' => 245.50,
        ]);

        AaoifiScreening::create([
            'company_id' => $company->id,
            'business_status' => 'PASS',
            'debt_ratio' => 18.25,
            'debt_status' => 'PASS',
            'cash_ratio' => 9.10,
            'cash_status' => 'PASS',
            'impermissible_income_ratio' => 0.45,
            'impermissible_income_status' => 'PASS',
            'final_status' => 'compliant',
        ]);

        Http::fake();

        foreach (['Is MTN halal?', 'Is MTNN halal under AAOIFI?', 'Which NGX stocks are halal?', 'Check MTNN compliance status'] as $query) {
            $res = $this->postJson('/api/v1/chat/public', ['message' => $query]);

            $res->assertStatus(200)
                ->assertJsonPath('assistant_message.metadata.provider', 'policy')
                ->assertJsonPath('assistant_message.metadata.cited_symbols', []);

            $content = $res->json('assistant_message.content');
            $this->assertStringContainsString('Market Screener', $content);
            $this->assertStringNotContainsString('18.25%', $content);
        }

        Http::assertNothingSent();
    }

    public function test_user_cannot_access_or_escalate_another_users_conversation(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $conversation = ChatConversation::create([
            'user_id' => $owner->id,
            'title' => 'Private Zakat Question',
            'status' => 'active',
            'last_message_at' => now(),
        ]);

        Sanctum::actingAs($otherUser);

        $this->getJson("/api/v1/chat/conversations/{$conversation->id}")->assertStatus(404);
        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/escalate")->assertStatus(404);
    }

    public function test_user_can_submit_feedback_and_escalate_conversation_to_admin_inbox(): void
    {
        Notification::fake();
        Config::set('services.gemini.key', '');

        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $chatResponse = $this->postJson('/api/v1/chat/message', [
            'message' => 'I was billed twice, need human support.',
        ])->assertStatus(201);

        $conversationId = $chatResponse->json('conversation.id');
        $assistantMsgId = $chatResponse->json('assistant_message.id');

        $this->postJson("/api/v1/chat/messages/{$assistantMsgId}/feedback", [
            'feedback' => 'down',
        ])->assertStatus(200);

        $this->assertDatabaseHas('chat_messages', [
            'id' => $assistantMsgId,
            'feedback' => 'down',
        ]);

        $this->postJson("/api/v1/chat/conversations/{$conversationId}/escalate", [
            'note' => 'Please check my latest Squad charge.',
        ])->assertStatus(200)
            ->assertJsonPath('status', 'escalated');

        $this->assertDatabaseHas('chat_conversations', [
            'id' => $conversationId,
            'status' => 'escalated',
        ]);

        $suggestion = Suggestion::where('chat_conversation_id', $conversationId)->first();
        $this->assertNotNull($suggestion);
        $this->assertStringContainsString('Please check my latest Squad charge.', $suggestion->message);

        Notification::assertSentTo($admin, AdminSuggestionNotification::class);
    }

    public function test_public_visitor_receives_kb_reply_without_db_persistence(): void
    {
        Config::set('services.gemini.key', 'test-gemini-key');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'reply' => 'Irshad offers Miftah (Free), Pro, and Max plans under Pricing.',
                                        'suggested_followups' => ['How do Zakat & Hawl work?'],
                                        'needs_human_support' => false,
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/chat/public', [
            'message' => 'Can you compare paid tiers and portfolio alerts?',
            'history' => [
                ['role' => 'user', 'content' => 'Salam'],
                ['role' => 'assistant', 'content' => 'As-salamu alaykum! How can I help?'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('assistant_message.role', 'assistant')
            ->assertJsonPath('assistant_message.metadata.cited_symbols', [])
            ->assertJsonPath('assistant_message.metadata.provider', 'gemini');

        Http::assertSent(function ($request) {
            $systemText = $request['systemInstruction']['parts'][0]['text'] ?? '';

            return str_contains($systemText, 'VISITOR CONTEXT (PUBLIC)')
                && ! str_contains($systemText, 'Recorded Holdings');
        });

        $this->assertDatabaseCount('chat_conversations', 0);
        $this->assertDatabaseCount('chat_messages', 0);
    }
}
