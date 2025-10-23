#!/bin/bash

# Simple build script for Cloudflare Pages
echo "Building Astro project..."

# Install dependencies
npm install

# Build the project
npm run build

echo "Build complete!"
