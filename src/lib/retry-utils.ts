/**
 * Utility functions for handling retries and error recovery
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error: any) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  },
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if condition is not met
      if (!opts.retryCondition(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      );

      // Add jitter to prevent thundering herd
      if (opts.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      console.log(`Retry attempt ${attempt}/${opts.maxAttempts} in ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create a retry wrapper for API functions
 */
export function withRetry<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
) {
  return (...args: TArgs): Promise<TReturn> => {
    return retryWithBackoff(() => fn(...args), options);
  };
}

/**
 * Utility to check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors (no response)
  if (!error.response) {
    return true;
  }

  const status = error.response.status;

  // Server errors (5xx)
  if (status >= 500 && status < 600) {
    return true;
  }

  // Specific client errors that might be temporary
  if (status === 408 || status === 429) { // Timeout or Rate Limited
    return true;
  }

  return false;
}

/**
 * Circuit breaker pattern for API calls
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * Throttle function for API calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}