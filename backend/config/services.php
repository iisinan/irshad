<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_SES_KEY', env('AWS_ACCESS_KEY_ID')),
        'secret' => env('AWS_SES_SECRET', env('AWS_SECRET_ACCESS_KEY')),
        'region' => env('AWS_SES_REGION', 'us-east-1'),
        'endpoint' => env('AWS_SES_ENDPOINT', 'https://email.us-east-1.amazonaws.com'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'ngx' => [
        'key' => env('NGX_API_KEY'),
        'url' => env('NGX_API_URL', 'https://api.ngxgroup.com/v1'),
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
    ],

    'scraperapi' => [
        'key' => env('SCRAPERAPI_KEY'),
    ],

    'youtube' => [
        'key' => env('YOUTUBE_API_KEY'),
    ],

    'apify' => [
        'token' => env('APIFY_TOKEN'),
    ],

    'squad' => [
        'secret'    => env('SQUAD_SECRET_KEY'),
        'public'    => env('SQUAD_PUBLIC_KEY'),
        'base_url'  => rtrim(env('SQUAD_BASE_URL', 'https://sandbox-api-d.squadco.com'), '/'),
        'recurring' => filter_var(env('SQUAD_RECURRING_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
    ],

];
