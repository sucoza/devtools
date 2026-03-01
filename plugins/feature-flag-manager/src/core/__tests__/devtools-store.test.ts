/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeatureFlagDevToolsStore } from '../devtools-store';
import type { FlagEvaluation, Experiment } from '../../types';

describe('FeatureFlagDevToolsStore — immutable state updates', () => {
  let store: FeatureFlagDevToolsStore;

  beforeEach(() => {
    localStorage.clear();
    store = new FeatureFlagDevToolsStore();
  });

  it('creates a new evaluationHistory array reference on addEvaluation (the fix)', () => {
    const stateBefore = store.getState();
    const historyBefore = stateBefore.evaluationHistory;

    const evaluation: FlagEvaluation = {
      flagId: 'flag-1',
      value: true,
      reason: 'default',
    };

    store.addEvaluation(evaluation);

    const stateAfter = store.getState();
    // The array reference must differ — proves immutable update
    expect(stateAfter.evaluationHistory).not.toBe(historyBefore);
    expect(stateAfter.evaluationHistory[0]).toEqual(evaluation);
  });

  it('prepends evaluations and respects maxHistorySize', () => {
    const settings = store.getState().settings;
    const maxSize = settings.maxHistorySize;

    // Add maxSize + 5 evaluations
    for (let i = 0; i < maxSize + 5; i++) {
      store.addEvaluation({
        flagId: `flag-${i}`,
        value: true,
        reason: 'default',
      });
    }

    const history = store.getState().evaluationHistory;
    expect(history.length).toBeLessThanOrEqual(maxSize);
    // Most recent evaluation should be first (unshift-like prepend)
    expect(history[0].flagId).toBe(`flag-${maxSize + 4}`);
  });

  it('creates a new events array reference on addEvaluation (the fix)', () => {
    const eventsBefore = store.getState().events;

    store.addEvaluation({
      flagId: 'flag-1',
      value: true,
      reason: 'default',
    });

    const eventsAfter = store.getState().events;
    // Events array reference must differ — addEvaluation also calls addEvent internally
    expect(eventsAfter).not.toBe(eventsBefore);
    expect(eventsAfter.length).toBeGreaterThan(eventsBefore.length);
  });

  it('creates a new experiments array on updateExperiment — new experiment (the fix)', () => {
    const experimentsBefore = store.getState().experiments;

    const experiment: Experiment = {
      id: 'exp-1',
      name: 'Test Experiment',
      description: 'Testing',
      flagId: 'flag-1',
      variants: [],
      status: 'draft',
      metrics: [],
    };

    store.updateExperiment(experiment);

    const experimentsAfter = store.getState().experiments;
    expect(experimentsAfter).not.toBe(experimentsBefore);
    expect(experimentsAfter.find(e => e.id === 'exp-1')).toEqual(experiment);
  });

  it('creates a new experiments array on updateExperiment — existing experiment (the fix)', () => {
    const experiment: Experiment = {
      id: 'exp-1',
      name: 'Test Experiment',
      description: 'Testing',
      flagId: 'flag-1',
      variants: [],
      status: 'draft',
      metrics: [],
    };

    store.updateExperiment(experiment);
    const experimentsAfterAdd = store.getState().experiments;

    const updated = { ...experiment, status: 'running' as const };
    store.updateExperiment(updated);

    const experimentsAfterUpdate = store.getState().experiments;
    // Reference must change
    expect(experimentsAfterUpdate).not.toBe(experimentsAfterAdd);
    expect(experimentsAfterUpdate.find(e => e.id === 'exp-1')?.status).toBe('running');
    expect(experimentsAfterUpdate.length).toBe(1);
  });
});
