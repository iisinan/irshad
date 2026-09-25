<?php
$file = 'backend/app/Http/Controllers/PortfolioController.php';
$content = file_get_contents($file);

$old = <<<PHP
    public function update(Request \$request, \$id): JsonResponse
    {
        \$request->validate([
            'shares' => 'required|numeric|min:0',
            'average_buy_price' => 'required|numeric|min:0',
        ]);

        \$holding = Holding::where('user_id', Auth::id())->where('id', \$id)->first();

        if (! \$holding) {
            return \$this->error('Holding not found', 404);
        }

        \$holding->update([
            'shares' => \$request->shares,
            'average_buy_price' => \$request->average_buy_price,
        ]);
PHP;

$new = <<<PHP
    public function update(Request \$request, \$id): JsonResponse
    {
        \$request->validate([
            'symbol' => 'nullable|string',
            'shares' => 'required|numeric|min:0',
            'average_buy_price' => 'required|numeric|min:0',
        ]);

        \$holding = Holding::where('user_id', Auth::id())->where('id', \$id)->first();

        if (! \$holding) {
            return \$this->error('Holding not found', 404);
        }

        \$updateData = [
            'shares' => \$request->shares,
            'average_buy_price' => \$request->average_buy_price,
        ];
        if (\$request->has('symbol') && !empty(\$request->symbol)) {
            \$updateData['symbol'] = strtoupper(\$request->symbol);
        }

        \$holding->update(\$updateData);
PHP;

file_put_contents($file, str_replace($old, $new, $content));
