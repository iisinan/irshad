# Stage 1: Build Flutter Web
FROM debian:latest AS build-env

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl git unzip xz-utils libglu1-mesa sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Flutter
RUN git clone https://github.com/flutter/flutter.git /usr/local/flutter
ENV PATH="/usr/local/flutter/bin:/usr/local/flutter/bin/cache/dart-sdk/bin:${PATH}"
RUN git config --global --add safe.directory /usr/local/flutter
RUN flutter doctor
RUN flutter config --enable-web

# Copy source and build
WORKDIR /app
COPY mobile/ /app/
RUN flutter pub get
RUN flutter build web --release

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build-env /app/build/web /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
