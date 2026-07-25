import os
import boto3
from botocore.exceptions import ClientError
from typing import Optional

class CloudflareR2Client:
    def __init__(self):
        self.endpoint_url = os.getenv("AWS_ENDPOINT_URL")
        self.access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("AWS_BUCKET")
        
        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name="auto" # Cloudflare R2 uses 'auto'
        )

    def upload_file(self, file_path: str, object_name: str) -> Optional[str]:
        """
        Uploads a file to R2 and returns the object path.
        """
        try:
            self.s3_client.upload_file(file_path, self.bucket_name, object_name)
            return object_name
        except ClientError as e:
            print(f"Failed to upload to R2: {e}")
            return None
