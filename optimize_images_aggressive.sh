#!/bin/bash

# Script to optimize images over 2MB
set -e

MAX_WIDTH=1920
MAX_HEIGHT=1080

echo "Starting aggressive image optimization..."

# Function to optimize image
optimize_image() {
    local file="$1"
    
    echo "Processing: $file"
    
    # Get file extension
    local ext="${file##*.}"
    local ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
    local base_name="${file%.*}"
    
    # Create backup
    cp "$file" "${file}.backup"
    
    case "$ext_lower" in
        "jpg"|"jpeg")
            # For JPEGs: resize, compress to 80% quality, and strip metadata
            convert "$file" -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" -quality 80 -strip "$file"
            ;;
        "png")
            # For PNGs: convert to JPEG for better compression, keep original as backup
            convert "$file" -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" -quality 85 -strip "${base_name}.jpg"
            # Replace the PNG with the new JPEG
            mv "${base_name}.jpg" "$file"
            ;;
        "webp")
            # For WebP: resize, compress to 80% quality, and strip metadata
            convert "$file" -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" -quality 80 -strip "$file"
            ;;
        *)
            echo "Unsupported format: $ext"
            return
            ;;
    esac
    
    echo "Optimized: $file"
}

# Find and process all images over 2MB using awk for comparison
find ./public ./dist -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \) -exec ls -lh {} \; | \
awk '{
    size = $5;
    if (index(size, "M") > 0) {
        gsub(/M/, "", size);
        gsub(/,/, ".", size);
        if (size >= 2.0) print $9;
    }
}' | while read -r file; do
    if [ -f "$file" ]; then
        optimize_image "$file"
    fi
done

echo "Image optimization completed!"
echo "Backups created with .backup extension"

# Show summary
echo ""
echo "=== OPTIMIZATION SUMMARY ==="
echo "Total optimized images:"
find ./public ./dist -name "*.backup" | wc -l

echo ""
echo "Largest remaining images:"
find ./public ./dist -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \) -exec ls -lh {} \; | \
grep -E "[0-9]+,[0-9]+M|[0-9]+\.[0-9]+M" | sort -k5 -hr | head -10