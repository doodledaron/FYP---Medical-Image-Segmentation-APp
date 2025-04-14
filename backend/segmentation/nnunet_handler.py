import os
import subprocess
import tempfile
import shutil
import nibabel as nib
import numpy as np
from django.conf import settings
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class NNUNetHandler:
    """
    Handler for nnUNet lung tumor segmentation model
    """
    def __init__(self):
        # Path to the trained model folder
        self.model_folder = settings.NNUNET_MODEL_PATH
        self.device = "cpu"
        
        # Task name for lung tumor segmentation
        # Update with your actual task name/number
        self.task_name = "Task001_Lung"
        
        # Model configuration
        self.model_config = {
            "folds": None,  # Use all folds
            "trainer": "nnUNetTrainerV2",
            "cascade": False,
            "checkpoint": "model_final_checkpoint"
        }
        
        # Validate model folder exists
        if not os.path.exists(self.model_folder):
            logger.warning(f"Model folder {self.model_folder} not found. Make sure to set it correctly.")

    def predict(self, input_file_path, timeout=300):
        """
        Run prediction on an input NIFTI file
        
        Args:
            input_file_path: Path to the input .nii.gz file
            
        Returns:
            Path to the output segmentation file
        """
        # Create temporary output directory
        output_dir = tempfile.mkdtemp()
        
        try:
            # Prepare environment variables for nnUNet
            env = os.environ.copy()
            env["nnUNet_raw"] = settings.NNUNET_RAW
            env["nnUNet_preprocessed"] = settings.NNUNET_PREPROCESSED
            env["nnUNet_results"] = settings.NNUNET_RESULTS
            # Run nnUNet prediction
            # This code assumes nnUNet is installed and available in the environment
            cmd = [
                "nnUNetv2_predict",  # Note the v2
                "-i", os.path.dirname(input_file_path),
                "-o", output_dir,
                "-d", "2",  # Dataset ID, not task name in v2
                "-c", "3d_fullres",
                "-device", self.device  # Explicitly set to CPU
            ]
            
            # Add optional configurations
            if self.model_config["folds"]:
                cmd.extend(["-f", str(self.model_config["folds"])])
            if self.model_config["trainer"]:
                cmd.extend(["-tr", self.model_config["trainer"]])
            if self.model_config["checkpoint"]:
                cmd.extend(["-chk", self.model_config["checkpoint"]])
            
            # Execute nnUNet prediction
            logger.info(f"Running nnUNet prediction with command: {' '.join(cmd)}")
            process = subprocess.Popen(
                cmd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                error_msg = f"nnUNet prediction failed: {stderr}"
                logger.error(error_msg)
                raise RuntimeError(error_msg)
            
            # Find output file
            output_files = [os.path.join(output_dir, f) for f in os.listdir(output_dir) if f.endswith('.nii.gz')]
            if not output_files:
                error_msg = "No output segmentation file was generated"
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)
                
            # Move to permanent storage location
            result_file = output_files[0]
            dest_file = str(Path(settings.SEGMENTATION_RESULTS_PATH) / f"seg_{os.path.basename(input_file_path)}")
            shutil.copy(result_file, dest_file)
            
            logger.info(f"Successfully generated segmentation at {dest_file}")
            return dest_file
            
        except Exception as e:
            logger.exception(f"Error in nnUNet prediction: {str(e)}")
            raise RuntimeError(f"Error in nnUNet prediction: {str(e)}")
        finally:
            # Clean up temporary directory
            shutil.rmtree(output_dir, ignore_errors=True)
    
    def fallback_inference(self, input_file_path):
        """
        Fallback implementation for development when nnUNet isn't available
        This is just a mock function that creates a fake segmentation mask
        """
        try:
            logger.info(f"Using fallback inference for {input_file_path}")
            # Load the input NIFTI file
            nii_img = nib.load(input_file_path)
            img_data = nii_img.get_fdata()
            
            # Create a simple mock segmentation (lung sphere in the middle)
            # For actual implementation, this would be replaced by the real model
            segmentation = np.zeros_like(img_data)
            
            # Create a simple sphere in the middle representing a "lung"
            center = [dim // 2 for dim in segmentation.shape]
            radius = min(segmentation.shape) // 3
            
            x, y, z = np.ogrid[:segmentation.shape[0], :segmentation.shape[1], :segmentation.shape[2]]
            dist_from_center = np.sqrt((x - center[0])**2 + (y - center[1])**2 + (z - center[2])**2)
            segmentation[dist_from_center <= radius] = 1  # Lung tissue
            
            # Create a smaller sphere representing a "lesion"
            lesion_radius = radius // 4
            lesion_center = [c + r // 3 for c, r in zip(center, [radius, radius, radius])]
            
            lesion_dist = np.sqrt(
                (x - lesion_center[0])**2 + 
                (y - lesion_center[1])**2 + 
                (z - lesion_center[2])**2
            )
            segmentation[lesion_dist <= lesion_radius] = 2  # Lesion
            
            # Save the segmentation mask
            seg_nii = nib.Nifti1Image(segmentation, nii_img.affine, nii_img.header)
            
            # Save to results path
            output_file = str(Path(settings.SEGMENTATION_RESULTS_PATH) / f"seg_{os.path.basename(input_file_path)}")
                
            nib.save(seg_nii, output_file)
            logger.info(f"Saved fallback segmentation to {output_file}")
            return output_file
            
        except Exception as e:
            logger.exception(f"Error in fallback inference: {str(e)}")
            raise RuntimeError(f"Error in fallback inference: {str(e)}")
            
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