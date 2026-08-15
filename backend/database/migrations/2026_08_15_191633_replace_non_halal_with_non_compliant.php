<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop old constraints first
        DB::statement("ALTER TABLE stock_statuses DROP CONSTRAINT IF EXISTS stock_statuses_status_check");
        DB::statement("ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_status_check");
        DB::statement("ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check");

        // Now we can safely update the data since the constraints are gone
        DB::statement("UPDATE stock_statuses SET status = 'non-compliant' WHERE status = 'non-halal'");
        DB::statement("UPDATE ingredients SET status = 'non-compliant' WHERE status = 'non-halal'");
        DB::statement("UPDATE products SET status = 'non-compliant' WHERE status = 'non-halal'");
        
        // Add new constraints now that the data complies
        DB::statement("ALTER TABLE stock_statuses ADD CONSTRAINT stock_statuses_status_check CHECK (status::text = ANY (ARRAY['halal'::character varying, 'non-compliant'::character varying, 'doubtful'::character varying]::text[]))");
        DB::statement("ALTER TABLE ingredients ADD CONSTRAINT ingredients_status_check CHECK (status::text = ANY (ARRAY['halal'::character varying, 'non-compliant'::character varying, 'doubtful'::character varying]::text[]))");
        DB::statement("ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status::text = ANY (ARRAY['halal'::character varying, 'non-compliant'::character varying, 'doubtful'::character varying]::text[]))");

        // Non-constrained string columns
        DB::statement("UPDATE companies SET current_status = 'non-compliant' WHERE current_status = 'non-halal'");
        DB::statement("UPDATE aaoifi_screenings SET final_status = 'non-compliant' WHERE final_status = 'non-halal'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert data back to non-halal
        DB::statement("UPDATE stock_statuses SET status = 'non-halal' WHERE status = 'non-compliant'");
        DB::statement("UPDATE ingredients SET status = 'non-halal' WHERE status = 'non-compliant'");
        DB::statement("UPDATE products SET status = 'non-halal' WHERE status = 'non-compliant'");
        DB::statement("UPDATE companies SET current_status = 'non-halal' WHERE current_status = 'non-compliant'");
        DB::statement("UPDATE aaoifi_screenings SET final_status = 'non-halal' WHERE final_status = 'non-compliant'");

        // Drop and recreate constraint for stock_statuses (old)
        DB::statement("ALTER TABLE stock_statuses DROP CONSTRAINT IF EXISTS stock_statuses_status_check");
        DB::statement("ALTER TABLE stock_statuses ADD CONSTRAINT stock_statuses_status_check CHECK (status::text = ANY (ARRAY['halal'::character varying, 'non-halal'::character varying, 'doubtful'::character varying]::text[]))");
        
        // Drop and recreate constraint for ingredients (old)
        DB::statement("ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_status_check");
        DB::statement("ALTER TABLE ingredients ADD CONSTRAINT ingredients_status_check CHECK (status::text = ANY (ARRAY['halal'::character varying, 'non-halal'::character varying, 'doubtful'::character varying]::text[]))");
        
        // Drop and recreate constraint for products (old)
        DB::statement("ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check");
        DB::statement("ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status::text = ANY (ARRAY['halal'::character varying, 'non-halal'::character varying, 'doubtful'::character varying]::text[]))");
    }
};
