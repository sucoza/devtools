import { useState, useEffect, useRef } from 'react';
import { createFeatureFlagDevToolsClient } from '../core';
import { 
  FeatureFlagDevToolsClient, 
  FeatureFlagDevToolsState, 
  EvaluationContext,
  FlagOverride
} from '../types';

export interface UseFeatureFlagManagerOptions {
  /**
   * Whether to create a client automatically
   */
  autoCreate?: boolean;
  
  /**
   * Initial evaluation context
   */
  initialContext?: EvaluationContext;
  
  /**
   * Callback when client is ready
   */
  onReady?: (client: FeatureFlagDevToolsClient) => void;
  
  /**
   * Callback when state changes
   */
  onStateChange?: (state: FeatureFlagDevToolsState) => void;
}

export interface UseFeatureFlagManagerReturn {
  /**
   * The DevTools client instance
   */
  client: FeatureFlagDevToolsClient | null;
  
  /**
   * Current state of the feature flag system
   */
  state: FeatureFlagDevToolsState | null;
  
  /**
   * Whether the client is ready for use
   */
  isReady: boolean;
  
  /**
   * Whether the client is loading/initializing
   */
  isLoading: boolean;
  
  /**
   * Any error that occurred during initialization
   */
  error: Error | null;
  
  // Convenience methods
  /**
   * Evaluate a flag with the current context
   */
  evaluateFlag: (flagId: string, context?: EvaluationContext) => Promise<any>;
  
  /**
   * Toggle a boolean flag on/off
   */
  toggleFlag: (flagId: string) => Promise<void>;
  
  /**
   * Set an override for a flag
   */
  setOverride: (flagId: string, value: any, reason?: string) => Promise<void>;
  
  /**
   * Remove an override for a flag
   */
  removeOverride: (flagId: string) => Promise<void>;
  
  /**
   * Update the evaluation context
   */
  setContext: (context: EvaluationContext) => Promise<void>;
  
  /**
   * Refresh all flags from providers
   */
  refreshFlags: () => Promise<void>;
}

/**
 * React hook for managing feature flags in development
 */
export function useFeatureFlagManager(
  options: UseFeatureFlagManagerOptions = {}
): UseFeatureFlagManagerReturn {
  const {
    autoCreate = true,
    initialContext,
    onReady,
    onStateChange
  } = options;

  const [client, setClient] = useState<FeatureFlagDevToolsClient | null>(null);
  const [state, setState] = useState<FeatureFlagDevToolsState | null>(null);
  const [isLoading, setIsLoading] = useState(autoCreate);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize client
  useEffect(() => {
    if (!autoCreate) return undefined;

    let mounted = true;

    const initializeClient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const newClient = createFeatureFlagDevToolsClient();
        
        if (!mounted) return;

        // Set initial context if provided
        if (initialContext) {
          await newClient.setEvaluationContext(initialContext);
        }

        // Subscribe to state changes
        const unsubscribe = newClient.subscribe((newState) => {
          if (mounted) {
            setState(newState);
            onStateChange?.(newState);
          }
        });

        unsubscribeRef.current = unsubscribe;
        setClient(newClient);
        setIsLoading(false);
        
        onReady?.(newClient);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
        }
      }
    };

    initializeClient();

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [autoCreate, initialContext, onReady, onStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (client) {
        client.cleanup?.();
      }
    };
  }, [client]);

  // Convenience methods
  const evaluateFlag = async (flagId: string, context?: EvaluationContext) => {
    if (!client) throw new Error('Client not initialized');
    const evaluation = await client.evaluateFlag(flagId, context);
    return evaluation.value;
  };

  const toggleFlag = async (flagId: string) => {
    if (!client || !state) throw new Error('Client not initialized');
    
    const flag = state.flags.get(flagId);
    if (!flag || flag.type !== 'boolean') {
      throw new Error('Flag must be a boolean type to toggle');
    }
    
    const currentValue = state.overrides.get(flagId)?.value ?? flag.value;
    await setOverride(flagId, !currentValue, 'Toggled via useFeatureFlagManager');
  };

  const setOverride = async (flagId: string, value: any, reason = 'Override via useFeatureFlagManager') => {
    if (!client || !state) throw new Error('Client not initialized');
    
    const override: FlagOverride = {
      flagId,
      value,
      reason,
      userId: state.currentContext.userId
    };
    
    await client.setOverride(override);
  };

  const removeOverride = async (flagId: string) => {
    if (!client) throw new Error('Client not initialized');
    await client.removeOverride(flagId);
  };

  const setContext = async (context: EvaluationContext) => {
    if (!client) throw new Error('Client not initialized');
    await client.setEvaluationContext(context);
  };

  const refreshFlags = async () => {
    if (!client) throw new Error('Client not initialized');
    await client.refreshFlags();
  };

  return {
    client,
    state,
    isReady: !!client && !!state && !isLoading,
    isLoading,
    error,
    evaluateFlag,
    toggleFlag,
    setOverride,
    removeOverride,
    setContext,
    refreshFlags
  };
}