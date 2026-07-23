<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 font-sans">
    <div class="max-w-7xl mx-auto space-y-8">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 class="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    Irshad Screener
                </h1>
                <p class="text-slate-400 mt-2 text-lg">Real-time AAOIFI Shariah compliance analysis for NGX stocks.</p>
            </div>

            <!-- Search and Filters -->
            <div class="flex flex-col sm:flex-row gap-3">
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input wire:model.live.debounce.300ms="search" type="text" class="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-400 backdrop-blur-sm transition-all" placeholder="Search ticker or company...">
                </div>
                
                <select wire:model.live="filter" class="w-full sm:w-auto px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 text-white backdrop-blur-sm transition-all appearance-none cursor-pointer">
                    <option value="all">All Stocks</option>
                    <option value="halal">Halal (Compliant)</option>
                    <option value="non_halal">Non-Halal</option>
                </select>
            </div>
        </div>

        <!-- Data Table Card -->
        <div class="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-800/60 text-slate-300 text-sm uppercase tracking-wider border-b border-slate-700/50">
                            <th class="px-6 py-4 font-medium">Ticker</th>
                            <th class="px-6 py-4 font-medium">Company Name</th>
                            <th class="px-6 py-4 font-medium">Period</th>
                            <th class="px-6 py-4 font-medium">Date</th>
                            <th class="px-6 py-4 font-medium">Status</th>
                            <th class="px-6 py-4 font-medium text-right">Debt Ratio</th>
                            <th class="px-6 py-4 font-medium text-right">Income Ratio</th>
                            <th class="px-6 py-4 font-medium text-center">AI Analysis</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700/50">
                        @forelse ($stocks as $stock)
                            <tr class="hover:bg-slate-700/30 transition-colors group">
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold bg-slate-700/50 text-white border border-slate-600/50 group-hover:border-slate-500 transition-colors">
                                        {{ $stock->ticker }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-slate-200 font-medium">
                                    {{ $stock->company_name ?: 'Unknown' }}
                                </td>
                                <td class="px-6 py-4 text-slate-300">
                                    {{ $stock->report_quarter ?: 'FY ' . $stock->financial_year }}
                                </td>
                                <td class="px-6 py-4 text-slate-400 text-sm">
                                    {{ $stock->published_date ? $stock->published_date->format('M j, Y') : '-' }}
                                </td>
                                <td class="px-6 py-4">
                                    @if ($stock->is_compliant === true)
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            Compliant
                                        </span>
                                    @elseif ($stock->is_compliant === false)
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                            <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                            Non-Compliant
                                        </span>
                                    @else
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                            Pending
                                        </span>
                                    @endif
                                </td>
                                <td class="px-6 py-4 text-right font-mono text-sm">
                                    @if($stock->debt_ratio_pct !== null)
                                        <span class="{{ $stock->debt_ratio_pct > 30 ? 'text-rose-400' : 'text-slate-300' }}">
                                            {{ number_format($stock->debt_ratio_pct, 2) }}%
                                        </span>
                                    @else
                                        <span class="text-slate-500">-</span>
                                    @endif
                                </td>
                                <td class="px-6 py-4 text-right font-mono text-sm">
                                    @if($stock->impermissible_income_ratio_pct !== null)
                                        <span class="{{ $stock->impermissible_income_ratio_pct > 5 ? 'text-rose-400' : 'text-slate-300' }}">
                                            {{ number_format($stock->impermissible_income_ratio_pct, 2) }}%
                                        </span>
                                    @else
                                        <span class="text-slate-500">-</span>
                                    @endif
                                </td>
                                <td class="px-6 py-4 text-center">
                                    @if($stock->ai_explanation)
                                        <button 
                                            onclick="alert('{{ addslashes(str_replace(\"\n\", ' ', $stock->ai_explanation)) }}')"
                                            class="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border border-indigo-500/20 transition-all"
                                            title="View AI Analysis"
                                        >
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        </button>
                                    @else
                                        <span class="text-slate-600 text-sm italic">N/A</span>
                                    @endif
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                                    <div class="flex flex-col items-center justify-center gap-3">
                                        <svg class="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                        <p class="text-lg">No stock records found.</p>
                                    </div>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            @if($stocks->hasPages())
                <div class="px-6 py-4 border-t border-slate-700/50 bg-slate-800/20">
                    {{ $stocks->links(data: ['scrollTo' => false]) }}
                </div>
            @endif
        </div>
    </div>
</div>
