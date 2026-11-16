<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'institution_name')) {
                $table->string('institution_name')->nullable()->after('role');
            }
            if (! Schema::hasColumn('users', 'institution_type')) {
                $table->string('institution_type')->nullable()->after('institution_name');
            }
        });

        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['user'::character varying, 'admin'::character varying, 'scholar'::character varying, 'institution'::character varying]::text[]))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'scholar', 'institution') NOT NULL DEFAULT 'user'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['user'::character varying, 'admin'::character varying, 'scholar'::character varying]::text[]))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'scholar') NOT NULL DEFAULT 'user'");
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'institution_type')) {
                $table->dropColumn('institution_type');
            }
            if (Schema::hasColumn('users', 'institution_name')) {
                $table->dropColumn('institution_name');
            }
        });
    }
};
