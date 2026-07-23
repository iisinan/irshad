<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\WithPagination;
use App\Models\FinancialScreening;

class StockScreener extends Component
{
    use WithPagination;

    public $search = '';
    public $filter = 'all'; // all, halal, non_halal

    protected $queryString = [
        'search' => ['except' => ''],
        'filter' => ['except' => 'all'],
    ];

    public function updatingSearch()
    {
        $this->resetPage();
    }

    public function updatingFilter()
    {
        $this->resetPage();
    }

    public function render()
    {
        $query = FinancialScreening::query();

        if (!empty($this->search)) {
            $query->where('company_ticker', 'like', '%' . strtoupper($this->search) . '%');
        }

        // We check the calculation_results JSON for overall_financial_pass
        if ($this->filter === 'halal') {
            $query->whereRaw("CAST(calculation_results->>'overall_financial_pass' AS BOOLEAN) = true");
        } elseif ($this->filter === 'non_halal') {
            $query->whereRaw("CAST(calculation_results->>'overall_financial_pass' AS BOOLEAN) = false");
        }

        $stocks = $query->orderBy('company_ticker', 'asc')->paginate(15);

        return view('livewire.stock-screener', [
            'stocks' => $stocks,
        ]);
    }
}
