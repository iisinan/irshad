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

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy existing application directory contents
COPY . /var/www

# Set up Python venv for Laravel background scripts (PDF extraction, Gemini overviews, TradingView data)
ENV PATH="/var/www/venv/bin:$PATH"
RUN python3 -m venv /var/www/venv && \
    /var/www/venv/bin/pip install --no-cache-dir requests pypdf google-generativeai

# Install dependencies
ENV COMPOSER_MEMORY_LIMIT=-1
RUN composer install --no-interaction --optimize-autoloader --no-dev --ignore-platform-reqs

# Set permissions for Laravel
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Install RoadRunner by copying the binary from the official image to bypass GitHub API rate limits
COPY --from=ghcr.io/roadrunner-server/roadrunner:latest /usr/bin/rr /usr/local/bin/rr

# Expose port 8080 (Render's default)
EXPOSE 8080

# Use a custom entrypoint script to handle migrations and start Octane
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
