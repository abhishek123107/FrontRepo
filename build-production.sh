#!/bin/bash

# Production Build and Deploy Script
echo "🚀 Building Angular for Production..."

# Install dependencies
npm install

# Build for production
ng build --configuration production

echo "✅ Build completed!"
echo "📁 Build files are in: dist/library-seat-bookig"
echo "🌐 Ready for deployment to Render!"
