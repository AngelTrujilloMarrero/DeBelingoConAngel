#!/bin/bash

# Script to optimize images over 2MB
set -e

MAX_WIDTH=1920
MAX_HEIGHT=1080

echo "Starting image optimization..."

# Function to optimize image
optimize_image() {
    local file="$1"
    
    echo "Processing: $file"
    
    # Get file extension
    local ext="${file##*.}"
    local ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
    
    # Create backup
    cp "$file" "${file}.backup"
    
    case "$ext_lower" in
        "jpg"|"jpeg")
            # Optimize JPEG: resize and compress
            convert "$file" -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" -quality 85 -strip "$file.tmp"
            ;;
        "png")
            # Optimize PNG: resize and compress
            convert "$file" -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" -strip "$file.tmp"
            ;;
        "webp")
            # Optimize WebP: resize and compress
            convert "$file" -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" -quality 85 -strip "$file.tmp"
            ;;
        *)
            echo "Unsupported format: $ext"
            return
            ;;
    esac
    
    # Replace original with optimized version
    mv "$file.tmp" "$file"
    
    echo "Optimized: $file"
}

# Find and process all images over 2MB using awk for comparison
find ./public ./dist -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \) -exec ls -lh {} \; | \
awk '{
    size = $5;
    gsub(/M/, "", size);
    gsub(/,/, ".", size);
    if (size >= 2.0) print $9;
}' | while read -r file; do
    if [ -f "$file" ]; then
        optimize_image "$file"
    fi
done

echo "Image optimization completed!"
echo "Backups created with .backup extension"