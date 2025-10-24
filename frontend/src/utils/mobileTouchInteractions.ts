/**
 * Mobile Touch Interaction Utilities
 * Provides enhanced touch interactions and gestures for mobile devices
 */

export interface TouchGestureOptions {
  threshold?: number;
  timeout?: number;
  preventDefault?: boolean;
}

export interface SwipeGestureOptions extends TouchGestureOptions {
  direction?: 'horizontal' | 'vertical' | 'both';
  minDistance?: number;
  maxDistance?: number;
}

export interface TapGestureOptions extends TouchGestureOptions {
  maxDuration?: number;
  maxMovement?: number;
}

export class TouchGestureManager {
  private element: HTMLElement;
  private options: TouchGestureOptions;
  private touchStart: Touch | null = null;
  private touchStartTime: number = 0;
  private touchStartPosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(element: HTMLElement, options: TouchGestureOptions = {}) {
    this.element = element;
    this.options = {
      threshold: options.threshold || 10,
      timeout: options.timeout || 300,
      preventDefault: options.preventDefault || false,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    });
    this.element.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    this.element.addEventListener('touchend', this.handleTouchEnd, {
      passive: false,
    });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, {
      passive: false,
    });
  }

  private handleTouchStart = (event: TouchEvent): void => {
    if (this.options.preventDefault) {
      event.preventDefault();
    }

    this.touchStart = event.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartPosition = {
      x: this.touchStart.clientX,
      y: this.touchStart.clientY,
    };
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (this.options.preventDefault) {
      event.preventDefault();
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (this.options.preventDefault) {
      event.preventDefault();
    }

    if (!this.touchStart) return;

    const touchEnd = event.changedTouches[0];
    const touchEndTime = Date.now();
    const touchEndPosition = {
      x: touchEnd.clientX,
      y: touchEnd.clientY,
    };

    const duration = touchEndTime - this.touchStartTime;
    const distance = Math.sqrt(
      Math.pow(touchEndPosition.x - this.touchStartPosition.x, 2) +
        Math.pow(touchEndPosition.y - this.touchStartPosition.y, 2)
    );

    // Detect tap gesture
    if (duration < this.options.timeout && distance < this.options.threshold) {
      this.handleTap(event);
    }

    // Reset
    this.touchStart = null;
  };

  private handleTouchCancel = (event: TouchEvent): void => {
    this.touchStart = null;
  };

  private handleTap(event: TouchEvent): void {
    const tapEvent = new CustomEvent('tap', {
      detail: {
        originalEvent: event,
        position: {
          x: this.touchStartPosition.x,
          y: this.touchStartPosition.y,
        },
      },
    });

    this.element.dispatchEvent(tapEvent);
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
  }
}

export class SwipeGestureManager {
  private element: HTMLElement;
  private options: SwipeGestureOptions;
  private touchStart: Touch | null = null;
  private touchStartPosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(element: HTMLElement, options: SwipeGestureOptions = {}) {
    this.element = element;
    this.options = {
      threshold: options.threshold || 10,
      timeout: options.timeout || 300,
      preventDefault: options.preventDefault || false,
      direction: options.direction || 'both',
      minDistance: options.minDistance || 50,
      maxDistance: options.maxDistance || 300,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    });
    this.element.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    this.element.addEventListener('touchend', this.handleTouchEnd, {
      passive: false,
    });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, {
      passive: false,
    });
  }

  private handleTouchStart = (event: TouchEvent): void => {
    if (this.options.preventDefault) {
      event.preventDefault();
    }

    this.touchStart = event.touches[0];
    this.touchStartPosition = {
      x: this.touchStart.clientX,
      y: this.touchStart.clientY,
    };
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (this.options.preventDefault) {
      event.preventDefault();
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (this.options.preventDefault) {
      event.preventDefault();
    }

    if (!this.touchStart) return;

    const touchEnd = event.changedTouches[0];
    const touchEndPosition = {
      x: touchEnd.clientX,
      y: touchEnd.clientY,
    };

    const deltaX = touchEndPosition.x - this.touchStartPosition.x;
    const deltaY = touchEndPosition.y - this.touchStartPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (
      distance >= this.options.minDistance &&
      distance <= this.options.maxDistance
    ) {
      this.handleSwipe(event, deltaX, deltaY, distance);
    }

    // Reset
    this.touchStart = null;
  };

  private handleTouchCancel = (event: TouchEvent): void => {
    this.touchStart = null;
  };

  private handleSwipe(
    event: TouchEvent,
    deltaX: number,
    deltaY: number,
    distance: number
  ): void {
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

    let direction = '';
    if (this.options.direction === 'horizontal' && isHorizontal) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else if (this.options.direction === 'vertical' && isVertical) {
      direction = deltaY > 0 ? 'down' : 'up';
    } else if (this.options.direction === 'both') {
      if (isHorizontal) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else if (isVertical) {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }

    if (direction) {
      const swipeEvent = new CustomEvent('swipe', {
        detail: {
          originalEvent: event,
          direction,
          distance,
          deltaX,
          deltaY,
          startPosition: this.touchStartPosition,
          endPosition: {
            x: event.changedTouches[0].clientX,
            y: event.changedTouches[0].clientY,
          },
        },
      });

      this.element.dispatchEvent(swipeEvent);
    }
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
  }
}

/**
 * Haptic feedback utility
 */
export class HapticFeedback {
  private static instance: HapticFeedback;

  static getInstance(): HapticFeedback {
    if (!HapticFeedback.instance) {
      HapticFeedback.instance = new HapticFeedback();
    }
    return HapticFeedback.instance;
  }

  /**
   * Check if haptic feedback is supported
   */
  isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Trigger haptic feedback
   */
  vibrate(pattern: number | number[] = 50): void {
    if (this.isSupported()) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Light haptic feedback (for taps)
   */
  light(): void {
    this.vibrate(10);
  }

  /**
   * Medium haptic feedback (for selections)
   */
  medium(): void {
    this.vibrate(25);
  }

  /**
   * Heavy haptic feedback (for errors)
   */
  heavy(): void {
    this.vibrate([50, 25, 50]);
  }

  /**
   * Success haptic feedback
   */
  success(): void {
    this.vibrate([25, 10, 25]);
  }

  /**
   * Error haptic feedback
   */
  error(): void {
    this.vibrate([100, 50, 100]);
  }

  /**
   * Warning haptic feedback
   */
  warning(): void {
    this.vibrate([50, 25, 50, 25, 50]);
  }
}

/**
 * Touch interaction helpers
 */
export function addTouchInteractions(
  element: HTMLElement,
  options: TouchGestureOptions = {}
): TouchGestureManager {
  return new TouchGestureManager(element, options);
}

export function addSwipeInteractions(
  element: HTMLElement,
  options: SwipeGestureOptions = {}
): SwipeGestureManager {
  return new SwipeGestureManager(element, options);
}

export function addHapticFeedback(
  element: HTMLElement,
  feedbackType:
    | 'light'
    | 'medium'
    | 'heavy'
    | 'success'
    | 'error'
    | 'warning' = 'light'
): void {
  const haptic = HapticFeedback.getInstance();

  element.addEventListener('touchstart', () => {
    haptic[feedbackType]();
  });
}

/**
 * Mobile-specific CSS classes
 */
export function addMobileTouchClasses(element: HTMLElement): void {
  element.classList.add('mobile-touch-target');

  // Add touch-friendly styles
  const style = document.createElement('style');
  style.textContent = `
    .mobile-touch-target {
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
    }
    
    .mobile-touch-target:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }
    
    .mobile-touch-target.mobile-touch-pressed {
      transform: scale(0.95);
    }
  `;

  if (!document.head.querySelector('style[data-mobile-touch]')) {
    style.setAttribute('data-mobile-touch', 'true');
    document.head.appendChild(style);
  }
}

// Export singleton instances
export const hapticFeedback = HapticFeedback.getInstance();
