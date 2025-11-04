#!/bin/bash

# GitHub Pages Deployment Script
# Run this after setting up GitHub repo

echo "Setting up GitHub Pages deployment..."

# Add homepage to package.json
npm pkg set homepage="https://yourusername.github.io/piseva-frontend"

# Install gh-pages
npm install --save-dev gh-pages

# Add deploy scripts to package.json
npm pkg set scripts.predeploy="npm run build"
npm pkg set scripts.deploy="gh-pages -d build"

echo "Now run: npm run deploy"
echo "Your app will be live at: https://yourusername.github.io/piseva-frontend"