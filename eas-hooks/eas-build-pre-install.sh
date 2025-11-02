#!/usr/bin/env bash

set -euo pipefail

echo "📦 Fixing Gradle version..."

# Fix Gradle version to 8.10.2
GRADLE_PROPS="android/gradle/wrapper/gradle-wrapper.properties"

if [ -f "$GRADLE_PROPS" ]; then
    sed -i 's|gradle-8\.1-all\.zip|gradle-8.10.2-all.zip|g' "$GRADLE_PROPS"
    echo "✅ Updated Gradle to 8.10.2"
else
    echo "⚠️  Gradle properties file not found"
fi