/**
 * Bundle Optimization Utilities
 * Provides utilities for optimizing bundle size and performance
 */

/**
 * Dynamic import utility for code splitting
 */
export async function dynamicImport<T>(modulePath: string): Promise<T> {
  try {
    const module = await import(modulePath);
    return module.default || module;
  } catch (error) {
    console.error(`Failed to dynamically import ${modulePath}:`, error);
    throw error;
  }
}

/**
 * Lazy load component with loading state
 */
export function lazyLoadComponent<T>(
  importFn: () => Promise<T>,
  fallback?: () => T
): () => Promise<T> {
  return async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Failed to lazy load component:', error);
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoization utility for expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Intersection Observer for lazy loading
 */
export class LazyLoadManager {
  private observer: IntersectionObserver | null = null;
  private elements = new Map<Element, () => void>();

  constructor(
    private options: IntersectionObserverInit = {
      rootMargin: '50px',
      threshold: 0.1,
    }
  ) {}

  observe(element: Element, callback: () => void): void {
    if (!this.observer) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = this.elements.get(entry.target);
            if (callback) {
              callback();
              this.unobserve(entry.target);
            }
          }
        });
      }, this.options);
    }

    this.elements.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
      this.elements.delete(element);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.elements.clear();
    }
  }
}

/**
 * Image lazy loading utility
 */
export class ImageLazyLoader {
  private lazyLoadManager: LazyLoadManager;

  constructor() {
    this.lazyLoadManager = new LazyLoadManager();
  }

  loadImage(img: HTMLImageElement, src: string, placeholder?: string): void {
    // Set placeholder
    if (placeholder) {
      img.src = placeholder;
    }

    // Load actual image when in viewport
    this.lazyLoadManager.observe(img, () => {
      img.src = src;
      img.classList.add('loaded');
    });
  }

  destroy(): void {
    this.lazyLoadManager.disconnect();
  }
}

/**
 * Resource preloader
 */
export class ResourcePreloader {
  private preloadedResources = new Set<string>();

  async preloadImage(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  async preloadCSS(href: string): Promise<void> {
    if (this.preloadedResources.has(href)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      link.onload = () => {
        this.preloadedResources.add(href);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  async preloadJS(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number>();

  mark(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  measure(name: string, startMark: string, endMark?: string): number {
    if ('performance' in window && 'measure' in performance) {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measure = performance.getEntriesByName(name, 'measure')[0];
      const duration = measure ? measure.duration : 0;
      this.measures.set(name, duration);
      return duration;
    }

    return 0;
  }

  getMarks(): Map<string, number> {
    return new Map(this.marks);
  }

  getMeasures(): Map<string, number> {
    return new Map(this.measures);
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();

    if ('performance' in window && 'clearMarks' in performance) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

/**
 * Bundle size analyzer utility
 */
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  analyzeBundleSize(): {
    totalSize: number;
    jsSize: number;
    cssSize: number;
    imageSize: number;
    otherSize: number;
  } {
    const scripts = document.querySelectorAll('script[src]');
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    const images = document.querySelectorAll('img[src]');

    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;

    // Note: This is a simplified analysis
    // In a real application, you would need to fetch the actual file sizes

    scripts.forEach(() => {
      jsSize += 100000; // Estimated size
    });

    stylesheets.forEach(() => {
      cssSize += 50000; // Estimated size
    });

    images.forEach(() => {
      imageSize += 200000; // Estimated size
    });

    const totalSize = jsSize + cssSize + imageSize;

    return {
      totalSize,
      jsSize,
      cssSize,
      imageSize,
      otherSize: 0,
    };
  }

  getPerformanceMetrics(): {
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
  } {
    if (!('performance' in window)) {
      return {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
      };
    }

    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      loadTime: navigation
        ? navigation.loadEventEnd - navigation.loadEventStart
        : 0,
      domContentLoaded: navigation
        ? navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart
        : 0,
      firstPaint: paint.find((p) => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint:
        paint.find((p) => p.name === 'first-contentful-paint')?.startTime || 0,
    };
  }
}

// Export singleton instances
export const lazyLoadManager = new LazyLoadManager();
export const imageLazyLoader = new ImageLazyLoader();
export const resourcePreloader = new ResourcePreloader();
export const performanceMonitor = new PerformanceMonitor();
export const bundleAnalyzer = BundleAnalyzer.getInstance();
