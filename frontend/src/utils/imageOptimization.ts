/**
 * Image Optimization Utilities
 * Provides image compression, resizing, and format conversion
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxSize?: number; // in bytes
}

export interface OptimizedImageResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  url: string;
}

/**
 * Optimize image file
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    maxSize = 2 * 1024 * 1024, // 2MB
  } = options;

  // Check if file is already small enough
  if (file.size <= maxSize && quality >= 0.8) {
    return {
      file,
      originalSize: file.size,
      optimizedSize: file.size,
      compressionRatio: 1,
      url: URL.createObjectURL(file),
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // Add memory management
    let objectURL: string | null = null;

    img.onload = () => {
      try {
        // Calculate new dimensions with more conservative limits for mobile
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          Math.min(maxWidth, 800), // Limit to 800px for mobile
          Math.min(maxHeight, 600) // Limit to 600px for mobile
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with error handling
        canvas.toBlob(
          (blob) => {
            // Clean up object URL
            if (objectURL) {
              URL.revokeObjectURL(objectURL);
            }

            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Create optimized file
            const optimizedFile = new File(
              [blob],
              getOptimizedFileName(file.name, format),
              { type: `image/${format}` }
            );

            // Check if size is acceptable
            if (optimizedFile.size > maxSize && quality > 0.3) {
              // If still too large, reduce quality further (but not recursively)
              const reducedQuality = Math.max(0.3, quality - 0.2);
              canvas.toBlob(
                (reducedBlob) => {
                  if (!reducedBlob) {
                    // If even the reduced quality fails, return the original
                    resolve({
                      file,
                      originalSize: file.size,
                      optimizedSize: file.size,
                      compressionRatio: 1,
                      url: URL.createObjectURL(file),
                    });
                    return;
                  }

                  const finalFile = new File(
                    [reducedBlob],
                    getOptimizedFileName(file.name, format),
                    { type: `image/${format}` }
                  );

                  const finalUrl = URL.createObjectURL(finalFile);

                  resolve({
                    file: finalFile,
                    originalSize: file.size,
                    optimizedSize: finalFile.size,
                    compressionRatio: finalFile.size / file.size,
                    url: finalUrl,
                  });
                },
                `image/${format}`,
                reducedQuality
              );
              return;
            }

            // Create object URL
            const url = URL.createObjectURL(optimizedFile);

            resolve({
              file: optimizedFile,
              originalSize: file.size,
              optimizedSize: optimizedFile.size,
              compressionRatio: optimizedFile.size / file.size,
              url,
            });
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        // Clean up object URL on error
        if (objectURL) {
          URL.revokeObjectURL(objectURL);
        }
        reject(error);
      }
    };

    img.onerror = () => {
      // Clean up object URL on error
      if (objectURL) {
        URL.revokeObjectURL(objectURL);
      }
      reject(new Error('Failed to load image'));
    };

    // Load image
    objectURL = URL.createObjectURL(file);
    img.src = objectURL;
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if necessary
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Get optimized file name with new format
 */
function getOptimizedFileName(originalName: string, format: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}_optimized.${format}`;
}

/**
 * Create thumbnail from image
 */
export async function createThumbnail(
  file: File,
  size: number = 150
): Promise<OptimizedImageResult> {
  return optimizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'jpeg',
  });
}

/**
 * Batch optimize multiple images
 */
export async function batchOptimizeImages(
  files: File[],
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult[]> {
  const results: OptimizedImageResult[] = [];

  for (const file of files) {
    try {
      const result = await optimizeImage(file, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to optimize ${file.name}:`, error);
      // Return original file if optimization fails
      results.push({
        file,
        originalSize: file.size,
        optimizedSize: file.size,
        compressionRatio: 1,
        url: URL.createObjectURL(file),
      });
    }
  }

  return results;
}

/**
 * Check if image needs optimization
 */
export function needsOptimization(
  file: File,
  options: ImageOptimizationOptions = {}
): boolean {
  const { maxSize = 2 * 1024 * 1024 } = options;
  return file.size > maxSize;
}

/**
 * Get image dimensions
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if device has low memory
 */
export function isLowMemory(): boolean {
  // Check if device memory API is available
  if ('deviceMemory' in navigator) {
    const memory = (navigator as any).deviceMemory;
    return memory && memory < 4; // Less than 4GB RAM
  }

  // Check user agent for low-end devices
  const userAgent = navigator.userAgent.toLowerCase();
  const lowEndIndicators = [
    'android 4.',
    'android 5.',
    'android 6.',
    'iphone os 9_',
    'iphone os 10_',
    'iphone os 11_',
    'mobile safari/5',
    'mobile safari/6',
    'mobile safari/7',
  ];

  return lowEndIndicators.some((indicator) => userAgent.includes(indicator));
}

/**
 * Get optimal image settings based on device capabilities
 */
export function getOptimalImageSettings(): ImageOptimizationOptions {
  const lowMemory = isLowMemory();

  if (lowMemory) {
    return {
      maxWidth: 400,
      maxHeight: 300,
      quality: 0.6,
      format: 'jpeg',
      maxSize: 500 * 1024, // 500KB
    };
  }

  return {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    format: 'jpeg',
    maxSize: 2 * 1024 * 1024, // 2MB
  };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only images are allowed.',
    };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit.',
    };
  }

  return { isValid: true };
}
