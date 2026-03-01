import { describe, test, expect, beforeEach } from 'vitest';
import { SignalRInterceptor } from '../signalr-interceptor';

describe('SignalRInterceptor', () => {
  let interceptor: SignalRInterceptor;

  beforeEach(() => {
    interceptor = new SignalRInterceptor();
  });

  describe('updateHubMethodStats running average', () => {
    test('should compute correct incremental average over multiple invocations', () => {
      // Set up a connection so updateHubMethodStats can find it
      const connectionId = 'test-conn';
      (interceptor as any).connectionData.set(connectionId, {
        id: connectionId,
        hubMethods: new Map(),
        errors: [],
        messages: [],
      });

      const updateStats = (methodName: string, startTime: number, endTime?: number) => {
        (interceptor as any).updateHubMethodStats(connectionId, methodName, startTime, endTime);
      };

      // Three calls with execution times of 100, 200, 300
      // Correct average should be (100 + 200 + 300) / 3 = 200
      updateStats('testMethod', 0, 100);    // exec = 100
      updateStats('testMethod', 0, 200);    // exec = 200
      updateStats('testMethod', 0, 300);    // exec = 300

      const connection = (interceptor as any).connectionData.get(connectionId);
      const method = connection.hubMethods.get('testMethod');

      expect(method.invocationCount).toBe(3);
      // With old formula (avg + new) / 2: after 3 calls would give 225, not 200
      // With correct incremental mean: avg + (new - avg) / count = 200
      expect(method.averageExecutionTime).toBeCloseTo(200, 5);
    });

    test('should handle single invocation', () => {
      const connectionId = 'test-conn';
      (interceptor as any).connectionData.set(connectionId, {
        id: connectionId,
        hubMethods: new Map(),
        errors: [],
        messages: [],
      });

      (interceptor as any).updateHubMethodStats(connectionId, 'single', 0, 150);

      const connection = (interceptor as any).connectionData.get(connectionId);
      const method = connection.hubMethods.get('single');

      expect(method.invocationCount).toBe(1);
      expect(method.averageExecutionTime).toBe(150);
    });

    test('should not update average when endTime is not provided', () => {
      const connectionId = 'test-conn';
      (interceptor as any).connectionData.set(connectionId, {
        id: connectionId,
        hubMethods: new Map(),
        errors: [],
        messages: [],
      });

      (interceptor as any).updateHubMethodStats(connectionId, 'noEnd', 100);

      const connection = (interceptor as any).connectionData.get(connectionId);
      const method = connection.hubMethods.get('noEnd');

      expect(method.invocationCount).toBe(1);
      expect(method.averageExecutionTime).toBe(0);
    });

    test('should handle non-existent connection gracefully', () => {
      // Should not throw
      expect(() => {
        (interceptor as any).updateHubMethodStats('non-existent', 'method', 0, 100);
      }).not.toThrow();
    });

    test('should converge to true average over many invocations', () => {
      const connectionId = 'test-conn';
      (interceptor as any).connectionData.set(connectionId, {
        id: connectionId,
        hubMethods: new Map(),
        errors: [],
        messages: [],
      });

      // 10 invocations, each 50ms
      for (let i = 0; i < 10; i++) {
        (interceptor as any).updateHubMethodStats(connectionId, 'uniform', 0, 50);
      }

      const connection = (interceptor as any).connectionData.get(connectionId);
      const method = connection.hubMethods.get('uniform');

      expect(method.invocationCount).toBe(10);
      expect(method.averageExecutionTime).toBeCloseTo(50, 5);
    });
  });
});
