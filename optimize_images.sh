#!/bin/bash

# Script to optimize images over 2MB
set -e

TARGET_SIZE_MB=1.8
MAX_WIDTH=1920
MAX_HEIGHT=1080

echo "Starting image optimization..."

# Function to get file size in MB
get_size_mb() {
    local file="$1"
    stat -c%s "$file" | awk '{print $1/1024/1024}'
}

# Function to optimize image
optimize_image() {
    local file="$1"
    local original_size=$(get_size_mb "$file")
    
    echo "Processing: $file (${original_size}MB)"
    
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
    
    local new_size=$(get_size_mb "$file")
    local reduction=$(echo "scale=1; (($original_size - $new_size) / $original_size) * 100" | bc -l)
    
    echo "Optimized: $file (${new_size}MB, ${reduction}% reduction)"
}

# Find and process all images over 2MB in both public and dist
find ./public ./dist -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \) | while read -r file; do
    size_mb=$(get_size_mb "$file")
    if (( $(echo "$size_mb >= 2.0" | bc -l) )); then
        optimize_image "$file"
    fi
done

echo "Image optimization completed!"
echo "Backups created with .backup extension"