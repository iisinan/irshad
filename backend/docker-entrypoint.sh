#!/bin/sh
set -e

# Start Redis first so it's available when Laravel boots
redis-server --daemonize yes --logfile /tmp/redis.log

# Wait for Redis to be ready (up to 10 seconds)
for i in $(seq 1 10); do
    if redis-cli ping 2>/dev/null | grep -q PONG; then
        echo "Redis is ready."
        break
    fi
    echo "Waiting for Redis... ($i)"
    sleep 1
done

# Run migrations
php artisan migrate --force

# Cache configuration and routes
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Export default PORT if not set
export PORT=${PORT:-8080}
sed -i "s/--port=8080/--port=${PORT}/g" /var/www/supervisord.conf

# Start Supervisor (it will also start redis-server via [program:redis], which will
# take over management of the already-running Redis instance due to autorestart)
exec /usr/bin/supervisord -c /var/www/supervisord.conf
