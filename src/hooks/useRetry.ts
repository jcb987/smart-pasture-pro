import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
  retryCondition?: (error: Error) => boolean;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  lastError: Error | null;
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
    retryCondition = () => true,
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const execute = useCallback(async (): Promise<T | null> => {
    // Cancel any ongoing retry
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState({ isRetrying: false, attempt: 0, lastError: null });

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setState(prev => ({ ...prev, attempt, isRetrying: attempt > 0 }));
        
        const result = await fn();
        
        setState({ isRetrying: false, attempt: 0, lastError: null });
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({ ...prev, lastError: err }));

        // Check if we should retry
        if (attempt < maxRetries && retryCondition(err)) {
          const delayTime = Math.min(
            initialDelay * Math.pow(backoffMultiplier, attempt),
            maxDelay
          );

          onRetry?.(attempt + 1, err);

          // Show toast only on first retry
          if (attempt === 0) {
            toast({
              title: 'Reintentando...',
              description: `Error de conexión. Reintento ${attempt + 1} de ${maxRetries}`,
            });
          }

          await delay(delayTime);
        } else {
          setState({ isRetrying: false, attempt: 0, lastError: err });
          throw err;
        }
      }
    }

    return null;
  }, [fn, maxRetries, initialDelay, maxDelay, backoffMultiplier, onRetry, retryCondition, toast]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({ isRetrying: false, attempt: 0, lastError: null });
  }, []);

  return {
    execute,
    cancel,
    ...state,
  };
}

// Utility function for simple retry with fetch
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: Omit<RetryOptions, 'onRetry'> = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = () => true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries && retryCondition(lastError)) {
        const delayTime = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }
    }
  }

  throw lastError;
}

// Check if error is retryable (network errors, 5xx errors)
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('econnreset')
  ) {
    return true;
  }

  // Server errors (5xx)
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
    return true;
  }

  return false;
}
