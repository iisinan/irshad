# Use the official PHP 8.2 FPM image as a base
FROM php:8.2-fpm-alpine

# Install essential system dependencies (lean, no bloated compilers or LLVM)
RUN apk add --no-cache \
    postgresql-client \
    supervisor \
    curl \
    unzip \
    git \
    redis \
    python3 \
    py3-pip

# Install PHP extensions reliably using official extension installer
# Uses pre-compiled binaries or minimal temporary build tools, preventing OOM crashes
COPY --from=mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_pgsql exif pcntl bcmath gd zip sockets redis opcache

# Get Composer 2
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install RoadRunner 2025 by copying the binary from the official image to bypass GitHub API rate limits
COPY --from=ghcr.io/roadrunner-server/roadrunner:2025 /usr/bin/rr /usr/local/bin/rr

# Set working directory
WORKDIR /var/www

# Set up Python venv for Laravel background scripts (PDF extraction, Gemini overviews, TradingView data)
# Cached layer: requests and pypdf are pure-python with no heavy C-dependencies (no grpcio)
ENV PATH="/var/www/venv/bin:$PATH"
RUN python3 -m venv /var/www/venv && \
    /var/www/venv/bin/pip install --no-cache-dir requests pypdf

# Install Composer dependencies (cached as long as composer.json/lock don't change)
COPY composer.json composer.lock ./
ENV COMPOSER_MEMORY_LIMIT=-1
RUN composer install --no-interaction --no-scripts --no-autoloader --no-dev --ignore-platform-reqs

# Copy application source code
COPY . /var/www

# Setup RoadRunner binary and run Composer autoloader optimization
RUN cp /usr/local/bin/rr /var/www/rr && chmod +x /var/www/rr /usr/local/bin/rr && \
    composer dump-autoload --optimize --no-dev

# Set permissions for Laravel
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Expose port 8080 (Render / Railway default)
EXPOSE 8080

# Use custom entrypoint script to handle migrations and start Octane
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
