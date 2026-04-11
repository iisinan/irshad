#!/bin/bash

# Navigate to mobile directory
cd mobile

# Install dependencies
flutter pub get

# Build for web
flutter build web --release

# The output is in mobile/build/web
echo "Flutter web build complete. Files are in mobile/build/web"
