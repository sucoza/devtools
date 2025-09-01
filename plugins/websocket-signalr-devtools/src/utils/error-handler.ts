export class DevToolsError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DevToolsError';
  }
}

export function handleError(error: unknown, context?: Record<string, unknown>): DevToolsError {
  if (error instanceof DevToolsError) {
    return error;
  }

  if (error instanceof Error) {
    return new DevToolsError(error.message, 'UNKNOWN_ERROR', { 
      ...context, 
      originalError: error.name 
    });
  }

  return new DevToolsError(
    typeof error === 'string' ? error : 'Unknown error occurred',
    'UNKNOWN_ERROR',
    context
  );
}

export function safeExecute<T>(
  fn: () => T,
  fallback: T,
  context?: Record<string, unknown>
): T {
  try {
    return fn();
  } catch (error) {
    console.error('Safe execute failed:', handleError(error, context));
    return fallback;
  }
}

export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('Safe execute async failed:', handleError(error, context));
    return fallback;
  }
}

export function validateConnection(connection: unknown): boolean {
  if (!connection) return false;
  if (typeof (connection as { id?: unknown }).id !== 'string') return false;
  if (typeof (connection as { createdAt?: unknown }).createdAt !== 'number') return false;
  return true;
}

export function validateMessage(message: unknown): boolean {
  if (!message) return false;
  if (typeof (message as { id?: unknown }).id !== 'string') return false;
  if (typeof (message as { connectionId?: unknown }).connectionId !== 'string') return false;
  if (typeof (message as { timestamp?: unknown }).timestamp !== 'number') return false;
  return true;
}

export function createRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): () => Promise<T> {
  return async () => {
    let attempt = 1;
    
    while (attempt <= maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw handleError(error, { attempts: attempt });
        }
        
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
        delay *= 2; // Exponential backoff
      }
    }
    
    throw new DevToolsError('Max retry attempts reached', 'MAX_RETRIES_EXCEEDED');
  };
}