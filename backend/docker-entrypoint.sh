#!/bin/sh
set -e



# Run migrations
php artisan migrate --force

# Force remove any stale cached PHP files in bootstrap/cache
rm -rf /var/www/bootstrap/cache/*.php
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Export default PORT if not set
export PORT=${PORT:-8080}
sed -i "s/--port=8080/--port=${PORT}/g" /var/www/supervisord.conf

# Start Supervisor (it will also start redis-server via [program:redis], which will
# take over management of the already-running Redis instance due to autorestart)
exec /usr/bin/supervisord -c /var/www/supervisord.conf
