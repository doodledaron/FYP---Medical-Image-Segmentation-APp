#!/bin/bash
# Script to copy mock NIFTI files to the public directory

# Source directories
SOURCE_LUNG_IMAGE="/Users/doodledaron/Documents/MMU/FYP/application/project/frontend/output_dir/lung_image/lung_001.nii.gz"
SOURCE_LUNG_SEG="/Users/doodledaron/Documents/MMU/FYP/application/project/frontend/output_dir/lung_segmentation/lung_001.nii.gz"
SOURCE_TUMOR_SEG="/Users/doodledaron/Documents/MMU/FYP/application/project/frontend/output_dir/tumour_segmentation/lung_001.nii.gz"

# Target directory
TARGET_DIR="frontend/public"

# Make sure target directory exists
mkdir -p $TARGET_DIR

# Copy files with new names
cp "$SOURCE_LUNG_IMAGE" "$TARGET_DIR/mock_lung_scan.nii.gz"
cp "$SOURCE_LUNG_SEG" "$TARGET_DIR/mock_lung_segmentation.nii.gz" 
cp "$SOURCE_TUMOR_SEG" "$TARGET_DIR/mock_tumor_segmentation.nii.gz"

echo "Mock files have been copied to $TARGET_DIR" 