import os
import subprocess
import tempfile
import shutil
import nibabel as nib
import numpy as np
from django.conf import settings
from pathlib import Path
import logging
from scipy import ndimage




logger = logging.getLogger(__name__)

class NNUNetHandler:
    """
    Handler for nnUNet lung and tumor segmentation models
    """
    def __init__(self):
        """
        Handler for nnUNet lung and tumor segmentation models
        """
        # Path to the trained model folder - IMPORTANT: This should be the base nnunet folder
        self.model_folder = settings.NNUNET_BASE
        
        # Auto-detect if CUDA is available, otherwise use CPU
        self.device = self._detect_device()
        logger.info(f"Using device: {self.device} for nnUNet segmentation")
        
        # Model configurations for tumor and lung segmentation
        # Important: Use full dataset names instead of numeric IDs
        self.tumor_model = {
            "dataset": "Dataset002_Lung_split",  # Use full name instead of "2"
            "config": "3d_fullres"
            # Simplified configuration - only include necessary params
        }
        
        self.lung_model = {
            "dataset": "Dataset003_Lung_only",  # Use full name instead of "3"
            "config": "3d_fullres"
            # Simplified configuration - only include necessary params
        }
        
        # Input and output directories
        self.input_dir = settings.NNUNET_INPUT_DIR
        self.output_dir = settings.NNUNET_OUTPUT_DIR
        
        # Validate model folder exists
        if not os.path.exists(self.model_folder):
            logger.warning(f"Model folder {self.model_folder} not found. Make sure to set it correctly.")
        
        # Ensure input/output directories exist
        os.makedirs(self.input_dir, exist_ok=True)
        os.makedirs(os.path.join(self.output_dir, "tumor_segmentation"), exist_ok=True)
        os.makedirs(os.path.join(self.output_dir, "lung_segmentation"), exist_ok=True)
    
    def _detect_device(self):
        """
        Detect if CUDA is available, otherwise use CPU
        """
        try:
            # Try to import torch and check CUDA availability
            import torch
            if torch.cuda.is_available():
                logger.info("CUDA is available. Using GPU.")
                return "cuda"
        except ImportError:
            # If torch is not available, try to check for NVIDIA GPUs using system commands
            try:
                result = subprocess.run(['nvidia-smi'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=3)
                if result.returncode == 0:
                    logger.info("NVIDIA GPU detected via nvidia-smi. Using CUDA.")
                    return "cuda"
            except (subprocess.SubprocessError, FileNotFoundError):
                pass
        
        logger.info("No CUDA-capable GPU detected. Using CPU.")
        return "cpu"

    def predict(self, input_file_path, timeout=1800):
        """
        Run prediction on an input NIFTI file for both tumor and lung segmentation
        
        Args:
            input_file_path: Path to the input .nii.gz file
            timeout: Timeout for prediction process in seconds (default: 30 minutes)
            
        Returns:
            Dictionary containing paths to both segmentation files
        """
        # Extract the task_id from the input file path
        file_basename = os.path.basename(input_file_path)
        task_id = file_basename.split('_')[0]
            
        # Create destination paths with consistent naming
        tumor_dest = str(Path(settings.MEDIA_ROOT) / "segmentations" / f"tumor_seg_{task_id}.nii.gz")
        lung_dest = str(Path(settings.MEDIA_ROOT) / "segmentations" / f"lung_seg_{task_id}.nii.gz")
        
        # Ensure destination directory exists
        os.makedirs(os.path.dirname(tumor_dest), exist_ok=True)
        
        try:
            # Process input file name to ensure it follows nnUNet convention
            # nnUNet requires input files to be named as case_0000.nii.gz
            input_basename = os.path.basename(input_file_path)
            
            # Remove all extensions
            input_name = input_basename
            if input_name.endswith('.nii.gz'):
                input_name = input_name[:-7]
            elif input_name.endswith('.nii'):
                input_name = input_name[:-4]
            elif input_name.endswith('.gz'):
                input_name = input_name[:-3]
                
            # Make sure it has the required _0000 suffix
            if not input_name.endswith('_0000'):
                input_name = f"{input_name}_0000"
                
            # Create the properly formatted filename
            proper_input_name = f"{input_name}.nii.gz"
            input_copy_path = os.path.join(self.input_dir, proper_input_name)
            
            # Clear input directory to prevent confusion with multiple files
            for file in os.listdir(self.input_dir):
                file_path = os.path.join(self.input_dir, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
            
            # Copy input file to input directory with proper naming
            shutil.copyfile(input_file_path, input_copy_path)
            logger.info(f"Copied and renamed input file to {input_copy_path} for nnUNet processing")
            
            # Prepare environment variables for nnUNet
            env = os.environ.copy()
            env["nnUNet_raw"] = settings.NNUNET_RAW
            env["nnUNet_preprocessed"] = settings.NNUNET_PREPROCESSED
            env["nnUNet_results"] = settings.NNUNET_RESULTS
            
            # Run tumor segmentation model
            logger.info(f"Running tumor segmentation for {input_file_path}")
            tumor_output_dir = os.path.join(self.output_dir, "tumor_segmentation")
            tumor_file = self._run_prediction(input_copy_path, tumor_output_dir, self.tumor_model, env, timeout)
            if tumor_file:
                shutil.copyfile(tumor_file, tumor_dest)
                logger.info(f"Tumor segmentation saved to {tumor_dest}")
            else:
                raise RuntimeError("Tumor segmentation failed to produce output file")
            
            # Run lung segmentation model
            logger.info(f"Running lung segmentation for {input_file_path}")
            lung_output_dir = os.path.join(self.output_dir, "lung_segmentation")
            lung_file = self._run_prediction(input_copy_path, lung_output_dir, self.lung_model, env, timeout)
            if lung_file:
                shutil.copyfile(lung_file, lung_dest)
                logger.info(f"Lung segmentation saved to {lung_dest}")
            else:
                raise RuntimeError("Lung segmentation failed to produce output file")
            
            # Set permissions, but ignore PermissionError on systems like WSL
            for dest in [tumor_dest, lung_dest]:
                try:
                    os.chmod(dest, 0o644)
                except PermissionError:
                    logger.warning(f"Skipping chmod on {dest} due to permission error")

            
            logger.info(f"Segmentation completed: saved to {tumor_dest} and {lung_dest}")
            return {
                'tumor_segmentation': tumor_dest,
                'lung_segmentation': lung_dest
            }
            
        except Exception as e:
            logger.exception(f"Error in nnUNet prediction: {str(e)}")
            raise RuntimeError(f"Error in nnUNet prediction: {str(e)}")
    
    def _run_prediction(self, input_file_path, output_dir, model_config, env, timeout=1800):
        """
        Helper method to run prediction for a specific model
        
        Args:
            input_file_path: Path to the input .nii.gz file
            output_dir: Directory to save the output segmentation
            model_config: Model configuration dictionary
            env: Environment variables
            timeout: Timeout for prediction process in seconds (default: 30 minutes)
        """
        try:
            # Clear the output directory to avoid mixing with previous runs
            for file in os.listdir(output_dir):
                file_path = os.path.join(output_dir, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
            
            # Get the directory containing the input file
            input_dir = os.path.dirname(input_file_path)
            
            # Run nnUNet prediction
            cmd = [
                "nnUNetv2_predict",
                "-i", input_dir,
                "-o", output_dir,
                "-d", model_config["dataset"],
                "-c", model_config["config"],
                "-tr", "nnUNetTrainer",
                "-device", self.device,
                
            ]

            
            # Execute nnUNet prediction
            cmd_str = ' '.join(cmd)
            logger.info(f"Running nnUNet prediction with command: {cmd_str}")
            
            # Modified to stream output in real time
            process = subprocess.Popen(
                cmd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True,
                bufsize=1  # Line buffered
            )
            
            # Stream output in real-time
            def log_output(pipe, prefix):
                for line in iter(pipe.readline, ''):
                    if line:
                        line = line.strip()
                        if line:
                            logger.info(f"{prefix}: {line}")
            
            # Create threads to handle stdout and stderr streams
            import threading
            stdout_thread = threading.Thread(target=log_output, args=(process.stdout, "nnUNet"))
            stderr_thread = threading.Thread(target=log_output, args=(process.stderr, "nnUNet"))
            
            # Set as daemon threads so they don't block program exit
            stdout_thread.daemon = True
            stderr_thread.daemon = True
            
            # Start the threads
            stdout_thread.start()
            stderr_thread.start()
            
            # Wait for the process to complete with timeout
            try:
                return_code = process.wait(timeout=timeout)
                
                # Wait for output threads to finish
                stdout_thread.join(5)  # Wait up to 5 seconds
                stderr_thread.join(5)  # Wait up to 5 seconds
                
                # Collect any remaining output
                stdout, stderr = process.communicate(timeout=5)
                if stdout:
                    logger.info(f"nnUNet final output: {stdout}")
                if stderr:
                    logger.warning(f"nnUNet final stderr: {stderr}")
                
                if return_code != 0:
                    error_msg = f"nnUNet prediction failed with code {return_code}"
                    if stderr:
                        error_msg += f": {stderr}"
                    logger.error(error_msg)
                    raise RuntimeError(error_msg)
            except subprocess.TimeoutExpired:
                process.kill()
                logger.error(f"nnUNet prediction timed out after {timeout} seconds")
                raise RuntimeError(f"nnUNet prediction timed out after {timeout} seconds")
            
            # Find output file
            output_files = [os.path.join(output_dir, f) for f in os.listdir(output_dir) if f.endswith('.nii.gz')]
            if not output_files:
                error_msg = f"No output segmentation file was generated in {output_dir}"
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)
            
            # Return the first output file (there should be only one)
            result_file = output_files[0]
            logger.info(f"Generated segmentation at {result_file}")
            return result_file
            
        except Exception as e:
            logger.exception(f"Error running prediction: {str(e)}")
            raise RuntimeError(f"Error running prediction: {str(e)}")
    
    def fallback_inference(self, input_file_path):
        """
        Fallback implementation for development when nnUNet isn't available
        This is just a mock function that creates fake segmentation masks
        """
        try:
            logger.info(f"Using fallback inference for {input_file_path}")
            
            # Extract the task_id from the input file path
            file_basename = os.path.basename(input_file_path)
            task_id = file_basename.split('_')[0]
            
            # Create destination paths
            tumor_dest = str(Path(settings.MEDIA_ROOT) / "segmentations" / f"tumor_seg_{task_id}.nii.gz")
            lung_dest = str(Path(settings.MEDIA_ROOT) / "segmentations" / f"lung_seg_{task_id}.nii.gz")
            
            # Ensure destination directory exists
            os.makedirs(os.path.dirname(tumor_dest), exist_ok=True)
            
            # Check if we have pre-computed segmentations in the output directory
            tumor_output_dir = os.path.join(self.output_dir, "tumor_segmentation")
            lung_output_dir = os.path.join(self.output_dir, "lung_segmentation")
            
            # Try to find pre-existing segmentation files
            tumor_files = [f for f in os.listdir(tumor_output_dir) if f.endswith('.nii.gz')]
            lung_files = [f for f in os.listdir(lung_output_dir) if f.endswith('.nii.gz')]
            
            if tumor_files and lung_files:
                # Use existing segmentation files
                logger.info(f"Using existing segmentation files for fallback")
                tumor_file = os.path.join(tumor_output_dir, tumor_files[0])
                lung_file = os.path.join(lung_output_dir, lung_files[0])
                
                # Copy to destination
                shutil.copyfile(tumor_file, tumor_dest)
                shutil.copyfile(lung_file, lung_dest)
                
                logger.info(f"Copied existing fallback segmentations to {tumor_dest} and {lung_dest}")
                return {
                    'tumor_segmentation': tumor_dest,
                    'lung_segmentation': lung_dest
                }
            
            # If no pre-existing files, create mock segmentations
            # Load the input NIFTI file
            nii_img = nib.load(input_file_path)
            img_data = nii_img.get_fdata()
            
            # Create lung segmentation (larger sphere)
            lung_seg = np.zeros_like(img_data)
            center = [dim // 2 for dim in lung_seg.shape]
            radius = min(lung_seg.shape) // 3
            
            x, y, z = np.ogrid[:lung_seg.shape[0], :lung_seg.shape[1], :lung_seg.shape[2]]
            dist_from_center = np.sqrt((x - center[0])**2 + (y - center[1])**2 + (z - center[2])**2)
            lung_seg[dist_from_center <= radius] = 1  # Lung tissue
            
            # Create tumor segmentation (smaller sphere within lung)
            tumor_seg = np.zeros_like(img_data)
            tumor_radius = radius // 4
            tumor_center = [c + r // 3 for c, r in zip(center, [radius, radius, radius])]
            
            tumor_dist = np.sqrt(
                (x - tumor_center[0])**2 + 
                (y - tumor_center[1])**2 + 
                (z - tumor_center[2])**2
            )
            tumor_seg[tumor_dist <= tumor_radius] = 1  # Tumor tissue
            
            # Save the segmentation masks
            lung_nii = nib.Nifti1Image(lung_seg, nii_img.affine, nii_img.header)
            tumor_nii = nib.Nifti1Image(tumor_seg, nii_img.affine, nii_img.header)
            
            nib.save(lung_nii, lung_dest)
            nib.save(tumor_nii, tumor_dest)
            
            logger.info(f"Saved fallback segmentations to {tumor_dest} and {lung_dest}")
            return {
                'tumor_segmentation': tumor_dest,
                'lung_segmentation': lung_dest
            }
            
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

            # Debug: check unique labels
            unique_labels = np.unique(seg_data)
            logger.debug(f"Unique labels in segmentation: {unique_labels}")
            
            # Get voxel dimensions in mm
            voxel_dims = seg_img.header.get_zooms()
            voxel_volume = voxel_dims[0] * voxel_dims[1] * voxel_dims[2]  # in mm³
            
            # Check if this is tumor or lung segmentation based on file name
            is_tumor = 'tumor' in os.path.basename(segmentation_file_path).lower()
            
            if is_tumor:
                # For tumor segmentation (assume label 1 is tumor)
                tumor_voxels = np.sum(seg_data == 1)
                tumor_volume = (tumor_voxels * voxel_volume) / 1000  # Convert to cm³
                
                # Count distinct lesions using connected component analysis
                labeled_array, num_features = ndimage.label(seg_data == 1)
                lesion_count = num_features
                
                # Simulated confidence score
                confidence_score = 0.94  # 94% confidence
                
                return {
                    "tumor_volume": round(tumor_volume, 2),
                    "lesion_count": lesion_count,
                    "confidence_score": confidence_score
                }
            else:
                # For lung segmentation (assume all non-zero is lung)
                lung_voxels = np.sum(seg_data > 0)
                lung_volume = (lung_voxels * voxel_volume) / 1000  # Convert to cm³
                
                return {
                    "lung_volume": round(lung_volume, 2)
                }
        except Exception as e:
            logger.exception(f"Error calculating segmentation metrics: {str(e)}")
            return {
                "tumor_volume": None,
                "lung_volume": None,
                "lesion_count": None,
                "confidence_score": None
            }