import os
import shutil
import nibabel as nib
import numpy as np
from django.conf import settings
from pathlib import Path
import logging
import time

logger = logging.getLogger(__name__)

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
            logger.warning(f"Mock segmentation file {self.mock_segmentation_path} not found. Make sure to set it correctly.")

    def predict(self, input_file_path, timeout=300):
        """
        Mock prediction that returns the pre-generated segmentation file
        
        Args:
            input_file_path: Path to the input .nii.gz file (not used in this mock)
            
        Returns:
            Path to the output segmentation file
        """
        try:
            logger.info(f"Running mock nnUNet prediction for {input_file_path}")
            
            # Simulate some processing time for realism
            time.sleep(2)
            
            # OPTION 1: Simply return the original mock file path
            # This is the simplest approach and avoids any file corruption issues
            logger.info(f"Mock segmentation completed: using original file {self.mock_segmentation_path}")
            return self.mock_segmentation_path
            
            # OPTION 2 (commented out): If you need a unique file per request, uncomment this
            # and comment out the return statement above
            """
            # Create destination path for segmentation result
            dest_file = str(Path(settings.SEGMENTATION_RESULTS_PATH) / f"seg_{os.path.basename(input_file_path)}")
            
            # Load and save the NIFTI file using nibabel to ensure integrity
            nifti_img = nib.load(self.mock_segmentation_path)
            nib.save(nifti_img, dest_file)
            
            logger.info(f"Mock segmentation completed: saved to {dest_file}")
            return dest_file
            """
            
        except Exception as e:
            logger.exception(f"Error in mock nnUNet prediction: {str(e)}")
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
            logger.exception(f"Error calculating segmentation metrics: {str(e)}")
            return {
                "lung_volume": None,
                "lesion_volume": None,
                "lesion_count": None,
                "confidence_score": None
            }