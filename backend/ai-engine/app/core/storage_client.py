import os
import boto3
import hashlib
from botocore.exceptions import ClientError
from typing import Optional

class StorageClient:
    def __init__(self):
        self.access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.endpoint_url = os.getenv("AWS_ENDPOINT_URL") # Crucial for Cloudflare R2
        self.bucket_name = os.getenv("AWS_BUCKET")
        self.region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
        
        # We only initialize if credentials exist, to avoid breaking tests when keys are missing
        self.client = None
        if self.access_key and self.secret_key and self.bucket_name:
            self.client = boto3.client(
                's3',
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region
            )

    def calculate_checksum(self, file_path: str) -> str:
        """Calculate SHA256 checksum of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def upload_document(self, file_path: str, ticker: str, financial_year: int, doc_type: str = "annual_report") -> Optional[str]:
        """
        Uploads a PDF to R2 and returns the S3 Key.
        Prevents overwriting by appending a hash if needed, or structured naming.
        """
        if not self.client:
            print("StorageClient not fully configured. Skipping upload.")
            return None
            
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        checksum = self.calculate_checksum(file_path)
        
        # Example key: ARADEL/2024/annual_report_abc123.pdf
        s3_key = f"{ticker.upper()}/{financial_year}/{doc_type}_{checksum[:8]}.pdf"
        
        try:
            # Check if object already exists to prevent duplicate uploads
            try:
                self.client.head_object(Bucket=self.bucket_name, Key=s3_key)
                print(f"File {s3_key} already exists in storage. Skipping upload.")
                return s3_key
            except ClientError as e:
                # If a 404 is returned, it means the object does not exist, which is what we want
                if e.response['Error']['Code'] != '404':
                    raise

            # Upload the file
            print(f"Uploading {file_path} to R2 bucket {self.bucket_name} as {s3_key}...")
            self.client.upload_file(file_path, self.bucket_name, s3_key)
            return s3_key
            
        except Exception as e:
            print(f"Failed to upload {file_path} to storage: {str(e)}")
            return None
