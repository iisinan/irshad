<?php

namespace App\Observers;

use App\Models\FinancialScreening;

class FinancialScreeningObserver
{
    /**
     * Handle the FinancialScreening "created" event.
     */
    public function created(FinancialScreening $financialScreening): void
    {
        //
    }

    /**
     * Handle the FinancialScreening "updated" event.
     */
    public function updated(FinancialScreening $financialScreening): void
    {
        //
    }

    /**
     * Handle the FinancialScreening "deleted" event.
     */
    public function deleted(FinancialScreening $financialScreening): void
    {
        //
    }

    /**
     * Handle the FinancialScreening "restored" event.
     */
    public function restored(FinancialScreening $financialScreening): void
    {
        //
    }

    /**
     * Handle the FinancialScreening "force deleted" event.
     */
    public function forceDeleted(FinancialScreening $financialScreening): void
    {
        //
    }
}
