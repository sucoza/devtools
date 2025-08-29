export class DevToolsError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'DevToolsError';
  }
}

export function handleError(error: unknown, context?: Record<string, any>): DevToolsError {
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
  context?: Record<string, any>
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
  context?: Record<string, any>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('Safe execute async failed:', handleError(error, context));
    return fallback;
  }
}

export function validateConnection(connection: any): boolean {
  if (!connection) return false;
  if (typeof connection.id !== 'string') return false;
  if (typeof connection.createdAt !== 'number') return false;
  return true;
}

export function validateMessage(message: any): boolean {
  if (!message) return false;
  if (typeof message.id !== 'string') return false;
  if (typeof message.connectionId !== 'string') return false;
  if (typeof message.timestamp !== 'number') return false;
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