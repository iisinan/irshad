<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 160);
            $table->string('status', 32)->default('active'); // active, escalated, closed
            $table->timestamp('last_message_at')->nullable()->index();
            $table->timestamps();

            $table->index(['user_id', 'last_message_at']);
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('chat_conversations')->cascadeOnDelete();
            $table->string('role', 24); // user, assistant
            $table->longText('content');
            $table->json('metadata')->nullable();
            $table->string('feedback', 16)->nullable(); // up, down
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });

        Schema::table('suggestions', function (Blueprint $table) {
            $table->foreignId('chat_conversation_id')
                ->nullable()
                ->after('user_id')
                ->constrained('chat_conversations')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('suggestions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('chat_conversation_id');
        });

        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
    }
};
