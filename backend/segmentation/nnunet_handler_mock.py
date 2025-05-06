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
        # Path to the mock segmentation result
        self.mock_segmentation_path = "/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/output_dir/lung_001.nii.gz"
        
        # Validate mock segmentation file exists
        if not os.path.exists(self.mock_segmentation_path):
            print(f"WARNING - Mock segmentation file {self.mock_segmentation_path} not found. Make sure to set it correctly.")

    def predict(self, input_file_path, timeout=300):
        """
        Mock prediction that returns a downsized segmentation file
        
        Args:
            input_file_path: Path to the input .nii.gz file
            
        Returns:
            Path to the output segmentation file
        """
        try:
            print(f"INFO - Running mock nnUNet prediction for {input_file_path}")
            
            # Extract the task_id from the input file path
            # Assumes format: {some_path}/uploads/{task_id}_{original_filename}
            file_basename = os.path.basename(input_file_path)
            task_id = file_basename.split('_')[0]  # Get the first part before the underscore
            
            # Create destination path with consistent naming
            dest_file = str(Path(settings.MEDIA_ROOT) / "segmentations" / f"seg_{task_id}.nii.gz")
            
            # Simulate some processing time for realism
            time.sleep(2)
            
            # Load the original mock segmentation
            print(f"INFO - Loading original NIFTI file: {self.mock_segmentation_path}")
            nifti_img = nib.load(self.mock_segmentation_path)

            mock_data = nifti_img.get_fdata()
            print(f"INFO - LABELS {np.unique(mock_data)}")
            
            # Downsize the segmentation directly (COMMENTED OUT)
            # print(f"INFO - Downsizing segmentation for faster loading")
            # downsized_img = self._downsize_segmentation(nifti_img)
            
            # Ensure destination directory exists
            os.makedirs(os.path.dirname(dest_file), exist_ok=True)
            
            # Save the original image instead of the downsized one
            print(f"INFO - Saving original NIFTI file to: {dest_file}")
            nib.save(nifti_img, dest_file) # Use nifti_img here
            
            # Ensure file permissions are set correctly
            os.chmod(dest_file, 0o644)  # Read/write for owner, read for others
            
            # Add verification to ensure the file was saved correctly
            file_size = os.path.getsize(dest_file)
            print(f"INFO - Saved file size: {file_size} bytes")
            
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
    
    def _downsize_segmentation(self, img, scale_factor=0.5):
        """
        Downsize a NIFTI image for faster loading
        
        Args:
            img: nibabel Nifti1Image object
            scale_factor: Factor to reduce dimensions (0.5 = half size)
            
        Returns:
            Downsized nibabel Nifti1Image object
        """
        # Get original data, shape and header
        data = img.get_fdata()
        original_shape = data.shape
        header = img.header.copy()
        affine = img.affine.copy()
        
        print(f"INFO - Original shape: {original_shape}, datatype: {data.dtype}")
        
        # Calculate new dimensions
        new_shape = tuple(int(dim * scale_factor) for dim in original_shape)
        print(f"INFO - New shape: {new_shape}")
        
        # Resize the data with nearest neighbor interpolation to preserve labels
        resized_data = ndimage.zoom(data, 
                                   (new_shape[0]/original_shape[0], 
                                    new_shape[1]/original_shape[1],
                                    new_shape[2]/original_shape[2]), 
                                   order=0)  # order=0 for nearest neighbor
        
        # Update header with new dimensions
        # Calculate new voxel sizes (inversely proportional to dimension changes)
        zooms = list(header.get_zooms())
        new_zooms = [zoom / scale_factor for zoom in zooms[:3]]
        if len(zooms) > 3:
            new_zooms.extend(zooms[3:])  # Preserve any additional dimensions
        header.set_zooms(new_zooms)
        
        # Update the affine matrix for new voxel sizes
        for i in range(3):
            for j in range(3):
                affine[i, j] = affine[i, j] / scale_factor
        
        # Convert to uint8 to save space (assuming segmentation has few labels)
        resized_data = resized_data.astype(np.uint8)
        
        # Create new image with updated header
        new_img = nib.Nifti1Image(resized_data, affine, header)
        
        print(f"INFO - Downsized segmentation: Original shape {original_shape} → New shape {new_shape}")
        
        return new_img
    
    def fallback_inference(self, input_file_path):
        """
        Fallback implementation - also returns a downsized segmentation
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

            # Debug: check unique labels
            unique_labels = np.unique(seg_data)
            print(f"INFO - Unique labels in segmentation: {unique_labels}")
            
            # Get voxel dimensions in mm
            voxel_dims = seg_img.header.get_zooms()
            voxel_volume = voxel_dims[0] * voxel_dims[1] * voxel_dims[2]  # in mm³
            
            # Since only tumor is labeled (1), no separate lung label
            lesion_voxels = np.sum(seg_data == 1)
            lung_voxels = lesion_voxels  # Entire mask is tumor only
            
            # Convert to cm³ (cc)
            lesion_volume = (lung_voxels * voxel_volume) / 1000
            
            # Count distinct lesions using connected component analysis
            labeled_array, num_features = ndimage.label(seg_data == 1)
            lesion_count = num_features
            
            # Simulated confidence score (mock)
            confidence_score = 0.94  # 94% confidence
            
            return {
                "lesion_volume": round(lesion_volume, 2),
                "lesion_count": lesion_count,
                "confidence_score": confidence_score
            }
        except Exception as e:
            print(f"ERROR - Error calculating segmentation metrics: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return {
                "lesion_volume": None,
                "lesion_count": None,
                "confidence_score": None
            }
