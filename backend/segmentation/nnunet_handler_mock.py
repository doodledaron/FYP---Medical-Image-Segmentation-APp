import os
import nibabel as nib
import numpy as np
from django.conf import settings
from pathlib import Path
import time
from scipy import ndimage

class NNUNetHandlerMock:
    """
    Mock handler for nnUNet lung tumor segmentation model
    This version automatically downsizes the segmentation before sending to frontend
    """

    def __init__(self):
        # Paths to the mock segmentation results
        self.tumor_segmentation_path = "/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/output_dir/tumour_segmentation/lung_001.nii.gz"
        self.lung_segmentation_path = "/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/output_dir/lung_segmentation/lung_001.nii.gz"
        
        # Validate mock segmentation files exist
        for path in [self.tumor_segmentation_path, self.lung_segmentation_path]:
            if not os.path.exists(path):
                print(f"WARNING - Mock segmentation file {path} not found. Make sure to set it correctly.")

    def predict(self, input_file_path, timeout=300):
        """
        Mock prediction that returns both tumor and lung segmentation files
        
        Args:
            input_file_path: Path to the input .nii.gz file
            
        Returns:
            Dictionary containing paths to both segmentation files
        """
        try:
            print(f"INFO - Running mock nnUNet prediction for {input_file_path}")
            
            # Extract the task_id from the input file path
            file_basename = os.path.basename(input_file_path)
            task_id = file_basename.split('_')[0]
            
            # Create destination paths with consistent naming
            tumor_dest = str(Path(settings.MEDIA_ROOT) / "segmentations" / f"tumor_seg_{task_id}.nii.gz")
            lung_dest = str(Path(settings.MEDIA_ROOT) / "segmentations" / f"lung_seg_{task_id}.nii.gz")
            
            # Simulate some processing time for realism
            time.sleep(2)
            
            # Process tumor segmentation
            print(f"INFO - Loading tumor NIFTI file: {self.tumor_segmentation_path}")
            tumor_nifti = nib.load(self.tumor_segmentation_path)
            tumor_data = tumor_nifti.get_fdata()
            print(f"INFO - TUMOR LABELS {np.unique(tumor_data)}")
            
            # Process lung segmentation
            print(f"INFO - Loading lung NIFTI file: {self.lung_segmentation_path}")
            lung_nifti = nib.load(self.lung_segmentation_path)
            lung_data = lung_nifti.get_fdata()
            print(f"INFO - LUNG LABELS {np.unique(lung_data)}")
            
            # No longer downsampling lung segmentation to ensure proper alignment with other volumes
            print(f"INFO - Using original lung segmentation data at shape {lung_data.shape}")
            
            # Ensure destination directory exists
            os.makedirs(os.path.dirname(tumor_dest), exist_ok=True)
            
            # Save both segmentations at original resolution
            print(f"INFO - Saving tumor NIFTI file to: {tumor_dest}")
            nib.save(tumor_nifti, tumor_dest)
            print(f"INFO - Saving lung NIFTI file to: {lung_dest}")
            nib.save(lung_nifti, lung_dest)
            
            # Ensure file permissions are set correctly
            for dest in [tumor_dest, lung_dest]:
                os.chmod(dest, 0o644)
                file_size = os.path.getsize(dest)
                print(f"INFO - Saved file size for {dest}: {file_size} bytes")
                
                # Verify the saved file
                try:
                    test_load = nib.load(dest)
                    test_shape = test_load.shape
                    test_datatype = test_load.get_data_dtype()
                    print(f"INFO - Verification successful for {dest} - NIFTI shape: {test_shape}, datatype: {test_datatype}")
                except Exception as e:
                    print(f"ERROR - Final verification failed for {dest}: {str(e)}")
            
            print(f"INFO - Mock segmentation completed: saved to {tumor_dest} and {lung_dest}")
            return {
                'tumor_segmentation': tumor_dest,
                'lung_segmentation': lung_dest
            }
            
        except Exception as e:
            print(f"ERROR - Error in mock nnUNet prediction: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise RuntimeError(f"Error in mock nnUNet prediction: {str(e)}")
    
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

            # Debug: check unique labels
            unique_labels = np.unique(seg_data)
            print(f"INFO - Unique labels in segmentation: {unique_labels}")
            
            # Get voxel dimensions in mm
            voxel_dims = seg_img.header.get_zooms()
            voxel_volume = voxel_dims[0] * voxel_dims[1] * voxel_dims[2]  # in mm³
            
            # Calculate volumes for both tumor and lung
            tumor_voxels = np.sum(seg_data == 1)  # Assuming 1 is tumor label
            lung_voxels = np.sum(seg_data > 0)    # All non-zero voxels
            
            # Convert to cm³ (cc)
            tumor_volume = (tumor_voxels * voxel_volume) / 1000
            lung_volume = (lung_voxels * voxel_volume) / 1000
            
            # Count distinct lesions using connected component analysis
            labeled_array, num_features = ndimage.label(seg_data == 1)
            lesion_count = num_features
            
            # Simulated confidence score (mock)
            confidence_score = 0.94  # 94% confidence
            
            return {
                "tumor_volume": round(tumor_volume, 2),
                "lung_volume": round(lung_volume, 2),
                "lesion_count": lesion_count,
                "confidence_score": confidence_score
            }
        except Exception as e:
            print(f"ERROR - Error calculating segmentation metrics: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return {
                "tumor_volume": None,
                "lung_volume": None,
                "lesion_count": None,
                "confidence_score": None
            }
