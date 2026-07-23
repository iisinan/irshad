#!/bin/sh
set -e

# Run migrations
php artisan migrate --force

# Cache configuration and routes
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Export default PORT if not set
export PORT=${PORT:-8080}
sed -i "s/--port=8080/--port=${PORT}/g" /var/www/supervisord.conf

# Start Supervisor to run both Laravel Octane and Python AI Engine
exec /usr/bin/supervisord -c /var/www/supervisord.conf
