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
      endPoint: process.env.MINIO_ENDPOINT || 'minio',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
      secretKey: process.env.MINIO_SECRET_KEY || 'password',
    });

    // Initialize buckets asynchronously (fire and forget)
    this.initializeBuckets().catch((error) => {
      console.error('Failed to initialize MinIO buckets:', error);
    });
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
   * Uses the same logic as party logos - generate presigned URL with correct host for browser access
   */
  async getPresignedUrl(
    bucket: string,
    objectPath: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    // Verify object exists before generating presigned URL
    try {
      await this.client.statObject(bucket, objectPath);
    } catch (error: any) {
      // MinIO/S3 uses different error codes - check common ones
      if (
        error.code === 'NotFound' ||
        error.code === 'NoSuchKey' ||
        error.message?.includes('not found') ||
        error.message?.includes('NoSuchKey')
      ) {
        console.error(`Object not found in MinIO: ${bucket}/${objectPath}`);
        throw new Error(`File not found: ${objectPath}`);
      }
      // If it's a connection error, log but continue - might be a network issue
      console.warn(
        `Error checking object existence for ${bucket}/${objectPath}: ${error.message || error.code || error}`
      );
    }

    // Generate presigned URL with the correct host for browser access
    // Use the same approach as party logos - use MINIO_PRESIGNED_ENDPOINT or LAN IP
    // This matches infrastructure/storage/minio.service.ts which uses 192.168.178.72 for LAN access
    const endPoint = process.env.MINIO_PRESIGNED_ENDPOINT || '192.168.178.72';
    const port = parseInt(process.env.MINIO_PORT || '9000');
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    // Create a temporary client with the correct endpoint for presigned URLs
    // This matches the logic used in infrastructure/storage/minio.service.ts for party logos
    const presignedClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
      secretKey: process.env.MINIO_SECRET_KEY || 'password',
    });

    return await presignedClient.presignedGetObject(
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
