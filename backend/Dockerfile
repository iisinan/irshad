# Use the official PHP 8.2 FPM image as a base
FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    postgresql-dev \
    oniguruma-dev \
    libzip-dev \
    linux-headers \
    python3 \
    py3-pip \
    python3-dev \
    gcc \
    musl-dev

# Install PHP extensions
RUN docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd xml zip sockets

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy existing application directory contents
COPY . /var/www

# Install Python dependencies for AI Engine
# We use a virtual environment as recommended by modern pip
RUN python3 -m venv /var/www/ai-engine/venv && \
    /var/www/ai-engine/venv/bin/pip install --no-cache-dir -r /var/www/ai-engine/requirements.txt

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
