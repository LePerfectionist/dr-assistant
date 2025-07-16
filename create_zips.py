import os
import shutil
from datetime import datetime

# --- Configuration ---
# List of folders you want to zip.
# The script assumes these folders are in the same directory as the script itself.
FOLDERS_TO_ZIP = ["backend\\app", "frontend\\dr-assistant-react\\src"] 

# The folder where you want to save the final zip files.
# This folder will be created if it doesn't exist.
DESTINATION_FOLDER = "C:\Users\meafigmaadmin\Projects\dr-assistant-zips"

# --- Main Script Logic ---
def zip_project_folders():
    """
    Zips specified project folders and saves them to a destination directory
    with a timestamped filename.
    """
    print("Starting the zipping process...")

    # 1. Create the destination folder if it doesn't exist
    try:
        os.makedirs(DESTINATION_FOLDER, exist_ok=True)
        print(f"Destination folder '{DESTINATION_FOLDER}' is ready.")
    except OSError as e:
        print(f"Error: Could not create destination folder '{DESTINATION_FOLDER}'. {e}")
        return

    # 2. Get a unique timestamp for the filenames
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    # 3. Loop through each folder and create a zip file for it
    for folder_name in FOLDERS_TO_ZIP:
        source_path = os.path.abspath(folder_name)
        
        # Check if the source folder actually exists
        if not os.path.isdir(source_path):
            print(f"Warning: Source folder '{source_path}' not found. Skipping.")
            continue

        # Define the name and path for the output zip file
        zip_filename_without_ext = f"{folder_name}_{timestamp}"
        zip_filepath = os.path.join(DESTINATION_FOLDER, zip_filename_without_ext)
        
        print(f"Zipping '{folder_name}'...")
        
        try:
            # The 'make_archive' function is powerful.
            # It takes the destination path (without extension), the format ('zip'),
            # and the source directory to archive.
            shutil.make_archive(zip_filepath, 'zip', source_path)
            print(f"  -> Successfully created '{zip_filepath}.zip'")
        except Exception as e:
            print(f"  -> Error: Failed to create zip for '{folder_name}'. {e}")

    print("\nProcess finished!")


# This allows the script to be run directly from the command line
if __name__ == "__main__":
    zip_project_folders()