#!/bin/sh
set -e

# Run migrations
php artisan migrate --force

# Cache configuration and routes
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start Laravel Octane with RoadRunner
# We must strictly limit workers to 1 on 512MB instances to prevent massive OOM crashes at boot
php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=${PORT:-8080} --workers=1 --task-workers=1 --max-requests=250
