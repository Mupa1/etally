/**
 * MinIO Service for File Storage
 * General-purpose file storage wrapper
 */

import * as Minio from 'minio';

const parseEndpoint = (
  value: string | undefined,
  fallbackHost: string,
  fallbackPort: number
) => {
  if (!value || value.trim().length === 0) {
    return { host: fallbackHost, port: fallbackPort };
  }

  const sanitized = value
    .replace(/^https?:\/\//i, '')
    .replace(/^tcp:\/\//i, '')
    .split('/')[0];

  const [host, portString] = sanitized.split(':');
  const port = portString ? Number(portString) : fallbackPort;

  return {
    host: host || fallbackHost,
    port: Number.isNaN(port) ? fallbackPort : port,
  };
};

class MinIOService {
  private static instance: MinIOService;
  private client: Minio.Client;
  private buckets = {
    partyLogos: 'party-logos',
    observerDocs: 'observer-documents',
    form34A: 'form-34a-photos',
  };

  private constructor() {
    // Use the internal Docker network name for internal operations
    const fallbackPort = parseInt(process.env.MINIO_PORT || '9000', 10);
    const { host: endPoint, port } = parseEndpoint(
      process.env.MINIO_ENDPOINT,
      'minio',
      fallbackPort
    );

    this.client = new Minio.Client({
      endPoint,
      port,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
      secretKey: process.env.MINIO_SECRET_KEY || 'password',
    });

    this.initializeBuckets();
  }

  static getInstance(): MinIOService {
    if (!MinIOService.instance) {
      MinIOService.instance = new MinIOService();
    }
    return MinIOService.instance;
  }

  /**
   * Initialize buckets if they don't exist
   */
  private async initializeBuckets(): Promise<void> {
    try {
      for (const bucket of Object.values(this.buckets)) {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
          await this.client.makeBucket(bucket, 'us-east-1');
          console.log(`✓ Created MinIO bucket: ${bucket}`);
        }
      }
    } catch (error) {
      console.error('Error initializing MinIO buckets:', error);
    }
  }

  /**
   * Upload file to MinIO
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

    if (process.env.MINIO_ENABLE_ENCRYPTION === 'true') {
      metadata['x-amz-server-side-encryption'] = 'AES256';
    }

    await this.client.putObject(bucket, objectPath, file, metadata);
  }

  /**
   * Get presigned URL for file viewing
   */
  async getPresignedUrl(
    bucket: string,
    objectPath: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    // Generate presigned URL with the correct host for LAN access
    // Use the LAN IP for presigned URLs so they work from other devices
    const fallbackPort = parseInt(process.env.MINIO_PORT || '9000', 10);
    const { host: endPoint, port } = parseEndpoint(
      process.env.MINIO_PRESIGNED_ENDPOINT,
      '192.168.178.72',
      fallbackPort
    );
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    // Create a temporary client with the correct endpoint for presigned URLs
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
   * Delete file from MinIO
   */
  async deleteFile(bucket: string, objectPath: string): Promise<void> {
    await this.client.removeObject(bucket, objectPath);
  }

  /**
   * Upload party logo
   */
  async uploadPartyLogo(
    partyId: string,
    file: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    // Ensure bucket exists before upload
    const bucketExists = await this.client.bucketExists(
      this.buckets.partyLogos
    );
    if (!bucketExists) {
      await this.client.makeBucket(this.buckets.partyLogos, 'us-east-1');
      console.log(`✓ Created MinIO bucket: ${this.buckets.partyLogos}`);
    }

    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    const objectPath = `${partyId}/${timestamp}-logo.${extension}`;

    await this.uploadFile(this.buckets.partyLogos, objectPath, file, mimeType);

    return objectPath;
  }

  /**
   * Get party logo URL
   */
  async getPartyLogoUrl(objectPath: string): Promise<string> {
    return await this.getPresignedUrl(
      this.buckets.partyLogos,
      objectPath,
      7 * 24 * 3600 // 7 days
    );
  }

  /**
   * Delete party logo
   */
  async deletePartyLogo(objectPath: string): Promise<void> {
    await this.deleteFile(this.buckets.partyLogos, objectPath);
  }

  /**
   * Check if bucket exists
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    return await this.client.bucketExists(bucketName);
  }
}

export default MinIOService;
