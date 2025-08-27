import os
from django.core.files.storage import Storage
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


class SupabaseStorage(Storage):
    bucket_name = "media"  # <-- change to your Supabase bucket name

    def _save(self, name, content):
        """Upload file to Supabase instead of local media/"""
        path = f"{name}"

        # Ensure file is open in binary mode
        content.open("rb")
        file_bytes = content.read()
        content.close()

        data = supabase.storage.from_(self.bucket_name).upload(path, file_bytes)

        # Handle errors depending on client version
        if isinstance(data, dict) and "error" in data and data["error"]:
            raise Exception(f"Supabase upload failed: {data['error']['message']}")

        if hasattr(data, "error") and data.error:
            raise Exception(f"Supabase upload failed: {data.error.message}")

        return name

    def url(self, name):
        """Return public URL (or generate signed URL if bucket is private)."""
        return supabase.storage.from_(self.bucket_name).get_public_url(name)
