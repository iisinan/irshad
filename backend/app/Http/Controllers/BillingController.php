<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
