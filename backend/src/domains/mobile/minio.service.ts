/**
 * MinIO Service for Observer Documents
 * Wrapper for document and photo storage
 */

import * as Minio from 'minio';

export class ObserverMinIOService {
  private client: Minio.Client;
  private observerBucket = 'observer-documents';
  private form34ABucket = 'form-34a-photos';

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
      secretKey: process.env.MINIO_SECRET_KEY || 'password',
    });

    this.initializeBuckets();
  }

  /**
   * Initialize buckets if they don't exist
   */
  private async initializeBuckets(): Promise<void> {
    try {
      const buckets = [this.observerBucket, this.form34ABucket];

      for (const bucket of buckets) {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
          await this.client.makeBucket(bucket, 'us-east-1');
          console.log(`Created MinIO bucket: ${bucket}`);
        }
      }
    } catch (error) {
      console.error('Error initializing MinIO buckets:', error);
    }
  }

  /**
   * Upload observer document (ID, photo)
   */
  async uploadFile(
    bucket: string,
    objectPath: string,
    file: Buffer,
    mimeType: string
  ): Promise<void> {
    const metadata: Record<string, string> = {
      'Content-Type': mimeType,
      'x-amz-meta-uploaded-at': new Date().toISOString(),
    };

    // Only enable server-side encryption if MinIO is configured for it
    if (process.env.MINIO_ENABLE_ENCRYPTION === 'true') {
      metadata['x-amz-server-side-encryption'] = 'AES256';
    }

    await this.client.putObject(bucket, objectPath, file, metadata);
  }

  /**
   * Get presigned URL for document viewing
   */
  async getPresignedUrl(
    bucket: string,
    objectPath: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    return await this.client.presignedGetObject(
      bucket,
      objectPath,
      expirySeconds
    );
  }

  /**
   * Upload Form 34A photo
   */
  async uploadForm34APhoto(
    electionId: string,
    pollingStationId: string,
    photo: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    const timestamp = Date.now();
    const objectPath = `${electionId}/${pollingStationId}/${timestamp}-${fileName}`;

    await this.uploadFile(this.form34ABucket, objectPath, photo, mimeType);

    return objectPath;
  }

  /**
   * Delete document (for cleanup)
   */
  async deleteFile(bucket: string, objectPath: string): Promise<void> {
    await this.client.removeObject(bucket, objectPath);
  }

  /**
   * Check if bucket exists
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    return await this.client.bucketExists(bucketName);
  }
}
