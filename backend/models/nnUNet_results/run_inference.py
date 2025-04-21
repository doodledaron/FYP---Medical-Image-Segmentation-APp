import os
import subprocess
import time

# Set these paths to your actual directories (provide full paths)
nnunet_raw = "/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/nnunet/nnUNet_raw"        # Replace with your actual path
nnunet_preprocessed = "/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/nnunet/nnUNet_preprocessed"  # Replace with your actual path
nnunet_results = "/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/nnunet"

# Input/output folders - also replace with your preferred locations
input_dir = "/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/input_dir"
output_dir = "/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/output_dir"

# Create directories if they don't exist
# os.makedirs(input_dir, exist_ok=True)
# os.makedirs(output_dir, exist_ok=True)

# Path to your test image
test_image = input("Enter path to your NIFTI image: ")

# Copy and rename the file if needed
input_filename = os.path.basename(test_image)
if not input_filename.endswith("_0000.nii.gz"):
    base_name = os.path.splitext(os.path.splitext(input_filename)[0])[0]
    input_filename = f"{base_name}_0000.nii.gz"

import shutil
target_path = os.path.join(input_dir, input_filename)
print(f"Copying {test_image} to {target_path}")
shutil.copy(test_image, target_path)

# Set environment variables
env = os.environ.copy()
env["nnUNet_raw"] = nnunet_raw
env["nnUNet_preprocessed"] = nnunet_preprocessed
env["nnUNet_results"] = nnunet_results

# Run inference command
cmd = [
    "nnUNetv2_predict",
    "-i", input_dir,
    "-o", output_dir,
    "-d", "2",
    "-c", "3d_fullres",
    "-device", "cpu"  # Change to "mps" if you have an M1/M2 Mac
]

print("Starting inference...")
print(f"Command: {' '.join(cmd)}")
start_time = time.time()

process = subprocess.Popen(
    cmd,
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Show output in real-time
while True:
    output = process.stdout.readline()
    if output == '' and process.poll() is not None:
        break
    if output:
        print(output.strip())

stdout, stderr = process.communicate()
if stderr:
    print("Errors:")
    print(stderr)

elapsed_time = time.time() - start_time
print(f"Inference completed in {elapsed_time:.2f} seconds")

# List output files
output_files = os.listdir(output_dir)
print("\nOutput files:")
for f in output_files:
    print(f"  - {f}")

print(f"\nResults saved to: {output_dir}")

# NOTE : use command : nnUNetv2_predict -i /Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/input_dir -o /Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/output_dir -d 2 -c 3d_fullres -device cpu instead

# set environment variables -> run everytime before running nnunet predict 
# export nnUNet_raw="/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/nnunet/nnUNet_raw"
# export nnUNet_preprocessed="/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/nnunet/nnUNet_preprocessed"
# export nnUNet_results="/Users/doodledaron/Documents/MMU/FYP/application/project/backend/models/nnunet"