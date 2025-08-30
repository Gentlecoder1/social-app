# utils.py
import os
import uuid
import logging
import tempfile
from django.conf import settings
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# ✅ Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


# ----------------------------
#  Filename + Folder Utilities
# ----------------------------
def generate_unique_filename(filename: str) -> str:
    """Generate a unique filename using UUID to avoid collisions."""
    ext = os.path.splitext(filename)[1].lower()
    return f"{uuid.uuid4().hex}{ext}"


def get_bucket_folder(file_type: str) -> str:
    """Return the correct Supabase folder based on file type."""
    mapping = {
        "profile": "profile_pics/",
        "cover": "cover_photos/",
        "post": "post_media/",
    }
    return mapping.get(file_type, "misc/")  # fallback folder


def cleanup_temp_file(path: str) -> None:
    """Remove temporary file if it exists."""
    try:
        if os.path.exists(path):
            os.remove(path)
            logger.debug(f"Deleted temp file: {path}")
    except Exception as e:
        logger.warning(f"Could not delete temp file {path}: {str(e)}")


# ----------------------------
#  Upload to Supabase
# ----------------------------
def upload_to_supabase(file, folder_key: str) -> str:
    """
    Upload a file to Supabase storage and return its public URL.
    
    Args:
        file: Django InMemoryUploadedFile (from request.FILES)
        folder_key: 'profile', 'cover', or 'post'
    
    Returns:
        str: Public URL of uploaded file
    """
    folder = get_bucket_folder(folder_key)
    unique_name = generate_unique_filename(file.name)
    path_in_bucket = f"{folder}{unique_name}"

    logger.debug(f"Uploading {file.name} -> {path_in_bucket}")

    # Save temporarily
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, unique_name)

    try:
        # Write file temporarily
        with open(temp_path, "wb+") as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)

        # Upload to Supabase
        res = supabase.storage.from_(settings.SUPABASE_BUCKET_NAME).upload(
            path_in_bucket, temp_path, {"upsert": False}
        )

        if res is None:
            raise Exception("Supabase upload failed, got None response")

        logger.info(f"Uploaded file to Supabase: {path_in_bucket}")

        # Build public URL
        public_url = (
            f"{settings.SUPABASE_URL}/storage/v1/object/public/"
            f"{settings.SUPABASE_BUCKET_NAME}/{path_in_bucket}"
        )

        return public_url

    except Exception as e:
        logger.error(f"Supabase upload failed: {str(e)}")
        raise

    finally:
        cleanup_temp_file(temp_path)
