<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Traits\ApiResponder;

class BillingController extends Controller
{
    use ApiResponder;

    public function upgrade(Request $request): JsonResponse
    {
        $user = auth()->user();

        if ($user->is_premium) {
            return $this->error('You are already an Irshad Pro member.', 400);
        }

        // Simulating successful payment webhook / confirmation
        $user->is_premium = true;
        $user->save();

        return $this->success($user, 'Successfully upgraded to Irshad Pro!');
    }
}
