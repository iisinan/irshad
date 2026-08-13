<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc,dns', 'unique:users,email', 'max:255'],
            'phone_number' => ['nullable', 'string', 'regex:/^\+?[0-9\s\-\(\)]+$/', 'max:20'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()->symbols()->uncompromised(3)],
            'location' => ['nullable', 'string', 'max:255'],
            'investor_type' => ['nullable', 'string', 'max:255'],
            'primary_use_case' => ['nullable', 'string', 'max:255'],
            'investment_experience' => ['nullable', 'string', 'max:255'],
            'dob' => ['nullable', 'string', 'max:50'],
        ];
    }
}
