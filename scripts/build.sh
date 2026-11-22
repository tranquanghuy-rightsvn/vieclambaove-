#!/bin/sh
# Gom đúng các file của website vào dist/ để deploy lên Cloudflare
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist
cp -R index.html 404.html assets quan-tri dist/
find dist -name .DS_Store -delete
