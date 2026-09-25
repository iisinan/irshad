<?php
$files = glob('backend/database/migrations/*_add_apple_id_to_users_table.php');
$file = $files[0];
$content = file_get_contents($file);
$content = str_replace('Schema::table('\''users'\'', function (Blueprint $table) {', 'Schema::table('\''users'\'', function (Blueprint $table) {
            $table->string('\''apple_id'\'')->nullable()->after('\''google_id'\'');', $content);
$content = str_replace('public function down(): void
    {
        Schema::table('\''users'\'', function (Blueprint $table) {
            //
        });
    }', 'public function down(): void
    {
        Schema::table('\''users'\'', function (Blueprint $table) {
            $table->dropColumn('\''apple_id'\'');
        });
    }', $content);
file_put_contents($file, $content);
echo "Patched\n";
