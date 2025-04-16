import os
import shutil
import nibabel as nib
import numpy as np
from django.conf import settings
from pathlib import Path
import time

class NNUNetHandlerMock:
    """
    Mock handler for nnUNet lung tumor segmentation model
    This version always returns a pre-generated segmentation mask
    instead of running actual inference
    """

    def __init__(self):
        # Path to the mock segmentation result
        self.mock_segmentation_path = "C:\\MMU\\FYP\\application\\project\\backend\\models\\nnunet\\output\\lung_001.nii.gz"
        
        # Validate mock segmentation file exists
        if not os.path.exists(self.mock_segmentation_path):
            print(f"WARNING - Mock segmentation file {self.mock_segmentation_path} not found. Make sure to set it correctly.")

    def predict(self, input_file_path, timeout=300):
        """
        Mock prediction that returns the pre-generated segmentation file
        
        Args:
            input_file_path: Path to the input .nii.gz file (not used in this mock)
            
        Returns:
            Path to the output segmentation file
        """
        try:
            print(f"INFO - Running mock nnUNet prediction for {input_file_path}")
            
            # Simulate some processing time for realism
            time.sleep(2)
            
            # Create destination path for segmentation result
            dest_file = str(Path(settings.SEGMENTATION_RESULTS_PATH) / f"seg_{os.path.basename(input_file_path)}")
            
            # Method 1: Use nibabel to properly handle .nii.gz files
            # This ensures the NIFTI file structure is preserved
            print(f"INFO - Loading NIFTI file using nibabel: {self.mock_segmentation_path}")
            nifti_img = nib.load(self.mock_segmentation_path)
            
            # Save using nibabel - this correctly handles .nii.gz format
            print(f"INFO - Saving NIFTI file to: {dest_file}")
            nib.save(nifti_img, dest_file)
            
            # Ensure file permissions are set correctly
            os.chmod(dest_file, 0o644)  # Read/write for owner, read for others
            
            # Add verification to ensure the file was saved correctly
            file_size = os.path.getsize(dest_file)
            print(f"INFO - Saved file size: {file_size} bytes")
            
            # Method 2: If the above fails, try direct binary copy
            if not os.path.exists(dest_file) or file_size == 0:
                print("WARNING - nibabel save may have failed, trying binary copy")
                
                with open(self.mock_segmentation_path, 'rb') as src_file:
                    with open(dest_file, 'wb') as dst_file:
                        # Read in chunks to handle large files efficiently
                        chunk_size = 1024 * 1024  # 1MB chunks
                        while True:
                            chunk = src_file.read(chunk_size)
                            if not chunk:
                                break
                            dst_file.write(chunk)
                
                # Re-verify file after binary copy
                if os.path.exists(dest_file):
                    file_size = os.path.getsize(dest_file)
                    print(f"INFO - After binary copy: file size: {file_size} bytes")
            
            # Final verification - can we load the file with nibabel?
            try:
                test_load = nib.load(dest_file)
                test_shape = test_load.shape
                test_datatype = test_load.get_data_dtype()
                print(f"INFO - Verification successful - NIFTI shape: {test_shape}, datatype: {test_datatype}")
            except Exception as e:
                print(f"ERROR - Final verification failed: {str(e)}")
            
            print(f"INFO - Mock segmentation completed: saved to {dest_file}")
            return dest_file
            
        except Exception as e:
            print(f"ERROR - Error in mock nnUNet prediction: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise RuntimeError(f"Error in mock nnUNet prediction: {str(e)}")
    
    def fallback_inference(self, input_file_path):
        """
        Fallback implementation - also returns the same mock segmentation
        """
        return self.predict(input_file_path)
            
    def analyze_segmentation(self, segmentation_file_path):
        """
        Analyze a segmentation result to extract metrics
        
        Args:
            segmentation_file_path: Path to the segmentation NIFTI file
            
        Returns:
            Dictionary with metrics
        """
        try:
            # Load the segmentation file
            seg_img = nib.load(segmentation_file_path)
            seg_data = seg_img.get_fdata()
            
            # Get voxel dimensions in mm
            voxel_dims = seg_img.header.get_zooms()
            voxel_volume = voxel_dims[0] * voxel_dims[1] * voxel_dims[2]  # in mm³
            
            # Calculate volumes
            # Assuming: 0=background, 1=healthy lung, 2=lesion
            lung_voxels = np.sum(seg_data >= 1)
            lesion_voxels = np.sum(seg_data == 2)
            
            # Convert to cm³ (cc)
            lung_volume = (lung_voxels * voxel_volume) / 1000
            lesion_volume = (lesion_voxels * voxel_volume) / 1000
            
            # Count distinct lesions using connected component analysis
            from scipy import ndimage
            labeled_array, num_features = ndimage.label(seg_data == 2)
            lesion_count = num_features
            
            # Simulated confidence score (in a real implementation, this would come from the model)
            confidence_score = 0.94  # 94% confidence
            
            return {
                "lung_volume": round(lung_volume, 2),
                "lesion_volume": round(lesion_volume, 2),
                "lesion_count": lesion_count,
                "confidence_score": confidence_score
            }
        except Exception as e:
            print(f"ERROR - Error calculating segmentation metrics: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return {
                "lung_volume": None,
                "lesion_volume": None,
                "lesion_count": None,
                "confidence_score": None
            }