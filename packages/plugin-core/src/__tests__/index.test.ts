import { describe, it, expect } from 'vitest';
import {
  BaseDevToolsClient,
  createPluginStore,
  MockDevToolsClient,
  createMockStore,
  testPluginHook,
  waitFor,
  mockData,
} from '../index';
import type {
  DevToolsEvent,
  BaseDevToolsStore,
  BasePluginState,
  PluginStoreActions,
  PluginStore,
} from '../index';

describe('plugin-core exports', () => {
  it('exports BaseDevToolsClient class', () => {
    expect(BaseDevToolsClient).toBeTypeOf('function');
  });

  it('exports createPluginStore function', () => {
    expect(createPluginStore).toBeTypeOf('function');
  });

  it('exports testing utilities', () => {
    expect(MockDevToolsClient).toBeTypeOf('function');
    expect(createMockStore).toBeTypeOf('function');
    expect(testPluginHook).toBeTypeOf('function');
    expect(waitFor).toBeTypeOf('function');
    expect(mockData).toBeDefined();
    expect(mockData.generateEvents).toBeTypeOf('function');
    expect(mockData.generatePerformanceData).toBeTypeOf('function');
    expect(mockData.generateFilterOptions).toBeTypeOf('function');
  });
});

describe('createPluginStore', () => {
  const initialState: BasePluginState = {
    isActive: false,
    isMonitoring: false,
    config: {},
    ui: {
      selectedTab: 'main',
      filter: {},
      settings: {},
    },
  };

  it('creates a store with initial state', () => {
    const store = createPluginStore(initialState, 'test-plugin');
    const snapshot = store.getSnapshot();
    expect(snapshot.isActive).toBe(false);
    expect(snapshot.isMonitoring).toBe(false);
  });

  it('has subscribe and getSnapshot methods', () => {
    const store = createPluginStore(initialState, 'test-plugin');
    expect(store.subscribe).toBeTypeOf('function');
    expect(store.getSnapshot).toBeTypeOf('function');
    expect(store.emit).toBeTypeOf('function');
  });
});

describe('MockDevToolsClient', () => {
  it('can be instantiated with a mock store', () => {
    const initialState: BasePluginState = {
      isActive: false,
      isMonitoring: false,
      config: {},
      ui: { selectedTab: 'main', filter: {}, settings: {} },
    };
    const store = createMockStore(initialState);
    const client = new MockDevToolsClient(store);
    expect(client).toBeDefined();
    expect(client.startMonitoring).toBeTypeOf('function');
    expect(client.stopMonitoring).toBeTypeOf('function');
    expect(client.cleanup).toBeTypeOf('function');
  });

  it('records emitted events', () => {
    const initialState: BasePluginState = {
      isActive: false,
      isMonitoring: false,
      config: {},
      ui: { selectedTab: 'main', filter: {}, settings: {} },
    };
    const store = createMockStore(initialState);
    const client = new MockDevToolsClient(store);
    client.startMonitoring();
    const events = client.getEmittedEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('start-monitoring');
  });
});

describe('mockData', () => {
  it('generates events', () => {
    const events = mockData.generateEvents(5);
    expect(events).toHaveLength(5);
    expect(events[0]).toHaveProperty('id');
    expect(events[0]).toHaveProperty('type');
    expect(events[0]).toHaveProperty('timestamp');
    expect(events[0]).toHaveProperty('payload');
  });

  it('generates performance data', () => {
    const data = mockData.generatePerformanceData(3);
    expect(data).toHaveLength(3);
    expect(data[0]).toHaveProperty('timestamp');
    expect(data[0]).toHaveProperty('value');
  });

  it('generates filter options', () => {
    const options = mockData.generateFilterOptions(['Type', 'Status']);
    expect(options).toHaveLength(2);
    expect(options[0].label).toBe('Type');
    expect(options[0].key).toBe('type');
  });
});
