#!/bin/sh
set -e

# Run migrations
php artisan migrate --force

# Cache configuration and routes
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start Laravel Octane with RoadRunner
# We listen on 8080 because Render expects it or we can configure Render to listen on what Octane uses.
# By default RoadRunner might be configured in .rr.yaml. Let's make sure it matches.
php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=${PORT:-8080}
