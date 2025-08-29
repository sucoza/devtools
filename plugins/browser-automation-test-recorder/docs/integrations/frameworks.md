# Framework Integration Guide

Learn how to integrate the Browser Automation Test Recorder Plugin with popular web frameworks including React, Vue, Angular, Svelte, and others.

## Table of Contents

1. [React Integration](#react-integration)
2. [Vue Integration](#vue-integration)
3. [Angular Integration](#angular-integration)
4. [Svelte Integration](#svelte-integration)
5. [Next.js Integration](#nextjs-integration)
6. [Nuxt.js Integration](#nuxtjs-integration)
7. [Framework-Agnostic Setup](#framework-agnostic-setup)
8. [Best Practices](#best-practices)

## React Integration

### Basic Setup

```typescript
// src/DevTools.tsx
import React from 'react';
import { BrowserAutomationPanel } from '@tanstack/browser-automation-test-recorder';

export function DevTools() {
  return (
    <div className="devtools-container">
      <BrowserAutomationPanel 
        theme="auto"
        defaultTab="recorder"
        onEvent={(event) => console.log('Browser automation event:', event)}
      />
    </div>
  );
}
```

### Integration with React DevTools

```typescript
// src/App.tsx
import React from 'react';
import { DevTools } from './DevTools';

function App() {
  return (
    <div className="App">
      {/* Your app content */}
      <main>
        <h1 data-testid="app-title">My React App</h1>
        {/* More components */}
      </main>
      
      {/* DevTools integration */}
      {process.env.NODE_ENV === 'development' && <DevTools />}
    </div>
  );
}

export default App;
```

### Custom React Hooks

Create custom hooks for better integration:

```typescript
// hooks/useBrowserAutomation.ts
import { useCallback, useEffect, useState } from 'react';
import { 
  createBrowserAutomationEventClient,
  EventRecorder,
  SelectorEngine 
} from '@tanstack/browser-automation-test-recorder';

export function useBrowserAutomation() {
  const [eventClient] = useState(() => createBrowserAutomationEventClient());
  const [recorder, setRecorder] = useState<EventRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  useEffect(() => {
    const selectorEngine = new SelectorEngine({
      preferredAttributes: ['data-testid', 'data-cy', 'id'],
      enableHealing: true
    });
    
    const recorder = new EventRecorder(selectorEngine, eventClient);
    setRecorder(recorder);
    
    // Listen to recording state changes
    const unsubscribe = eventClient.subscribe((state) => {
      setIsRecording(state.recording.isRecording);
    });
    
    return unsubscribe;
  }, [eventClient]);
  
  const startRecording = useCallback(async (options = {}) => {
    if (!recorder) return;
    
    try {
      await recorder.start({
        captureScreenshots: true,
        captureConsole: true,
        ...options
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [recorder]);
  
  const stopRecording = useCallback(async () => {
    if (!recorder) return [];
    
    try {
      return await recorder.stop();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return [];
    }
  }, [recorder]);
  
  return {
    eventClient,
    recorder,
    isRecording,
    startRecording,
    stopRecording
  };
}
```

### React Testing Integration

```typescript
// tests/utils/test-utils.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserAutomationTestProvider } from '../providers/BrowserAutomationTestProvider';

export function renderWithBrowserAutomation(ui: React.ReactElement) {
  return render(
    <BrowserAutomationTestProvider>
      {ui}
    </BrowserAutomationTestProvider>
  );
}

// Component test with browser automation
import { screen, userEvent } from '@testing-library/react';
import { renderWithBrowserAutomation } from '../utils/test-utils';
import { LoginForm } from '../LoginForm';

test('login form interaction', async () => {
  const user = userEvent.setup();
  
  renderWithBrowserAutomation(<LoginForm />);
  
  // These interactions will be recorded
  await user.type(screen.getByTestId('email-input'), 'user@example.com');
  await user.type(screen.getByTestId('password-input'), 'password123');
  await user.click(screen.getByTestId('login-button'));
  
  // Assert results
  expect(screen.getByTestId('welcome-message')).toBeInTheDocument();
});
```

### React Context Provider

```typescript
// providers/BrowserAutomationProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useBrowserAutomation } from '../hooks/useBrowserAutomation';

const BrowserAutomationContext = createContext<ReturnType<typeof useBrowserAutomation> | null>(null);

interface Props {
  children: ReactNode;
}

export function BrowserAutomationProvider({ children }: Props) {
  const browserAutomation = useBrowserAutomation();
  
  return (
    <BrowserAutomationContext.Provider value={browserAutomation}>
      {children}
    </BrowserAutomationContext.Provider>
  );
}

export function useBrowserAutomationContext() {
  const context = useContext(BrowserAutomationContext);
  if (!context) {
    throw new Error('useBrowserAutomationContext must be used within BrowserAutomationProvider');
  }
  return context;
}
```

## Vue Integration

### Basic Setup

```typescript
// plugins/browser-automation.ts
import { createBrowserAutomationEventClient } from '@tanstack/browser-automation-test-recorder';
import type { App } from 'vue';

export default {
  install(app: App) {
    const eventClient = createBrowserAutomationEventClient();
    app.provide('browserAutomationEventClient', eventClient);
    app.config.globalProperties.$browserAutomation = eventClient;
  }
};
```

### Vue 3 Composition API

```vue
<!-- components/DevToolsPanel.vue -->
<template>
  <div class="devtools-panel">
    <BrowserAutomationPanel
      :theme="theme"
      :default-tab="defaultTab"
      @event="handleEvent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted } from 'vue';
import { BrowserAutomationPanel } from '@tanstack/browser-automation-test-recorder';
import type { BrowserAutomationEventClient } from '@tanstack/browser-automation-test-recorder';

const theme = ref<'light' | 'dark' | 'auto'>('auto');
const defaultTab = ref('recorder');

const eventClient = inject<BrowserAutomationEventClient>('browserAutomationEventClient');

const handleEvent = (event: any) => {
  console.log('Browser automation event:', event);
};

onMounted(() => {
  if (eventClient) {
    eventClient.on('recording-started', handleRecordingStarted);
    eventClient.on('recording-stopped', handleRecordingStopped);
  }
});

onUnmounted(() => {
  if (eventClient) {
    eventClient.off('recording-started', handleRecordingStarted);
    eventClient.off('recording-stopped', handleRecordingStopped);
  }
});

const handleRecordingStarted = (data: any) => {
  console.log('Recording started:', data);
};

const handleRecordingStopped = (data: any) => {
  console.log('Recording stopped:', data);
};
</script>
```

### Vue 3 Composable

```typescript
// composables/useBrowserAutomation.ts
import { ref, inject, onMounted, onUnmounted } from 'vue';
import { 
  EventRecorder,
  SelectorEngine,
  type BrowserAutomationEventClient 
} from '@tanstack/browser-automation-test-recorder';

export function useBrowserAutomation() {
  const eventClient = inject<BrowserAutomationEventClient>('browserAutomationEventClient');
  
  const recorder = ref<EventRecorder | null>(null);
  const isRecording = ref(false);
  const events = ref([]);
  
  onMounted(() => {
    if (!eventClient) {
      console.error('Browser automation event client not found');
      return;
    }
    
    const selectorEngine = new SelectorEngine({
      preferredAttributes: ['data-testid', 'data-cy', 'id'],
      enableHealing: true
    });
    
    recorder.value = new EventRecorder(selectorEngine, eventClient);
    
    // Subscribe to state changes
    const unsubscribe = eventClient.subscribe((state) => {
      isRecording.value = state.recording.isRecording;
      events.value = state.recording.events;
    });
    
    onUnmounted(unsubscribe);
  });
  
  const startRecording = async (options = {}) => {
    if (!recorder.value) return;
    
    try {
      await recorder.value.start({
        captureScreenshots: true,
        captureConsole: true,
        ...options
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };
  
  const stopRecording = async () => {
    if (!recorder.value) return [];
    
    try {
      return await recorder.value.stop();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return [];
    }
  };
  
  return {
    recorder,
    isRecording,
    events,
    startRecording,
    stopRecording
  };
}
```

### Vue Router Integration

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { createBrowserAutomationEventClient } from '@tanstack/browser-automation-test-recorder';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Your routes
  ]
});

// Record navigation events
const eventClient = createBrowserAutomationEventClient();

router.beforeEach((to, from) => {
  eventClient.emit('navigation-event', {
    from: from.fullPath,
    to: to.fullPath,
    timestamp: Date.now()
  });
});

export default router;
```

## Angular Integration

### Service Setup

```typescript
// services/browser-automation.service.ts
import { Injectable } from '@angular/core';
import { 
  createBrowserAutomationEventClient,
  EventRecorder,
  SelectorEngine,
  type BrowserAutomationEventClient,
  type RecordedEvent
} from '@tanstack/browser-automation-test-recorder';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BrowserAutomationService {
  private eventClient: BrowserAutomationEventClient;
  private recorder: EventRecorder;
  private _isRecording$ = new BehaviorSubject<boolean>(false);
  private _events$ = new BehaviorSubject<RecordedEvent[]>([]);
  
  constructor() {
    this.eventClient = createBrowserAutomationEventClient();
    
    const selectorEngine = new SelectorEngine({
      preferredAttributes: ['data-testid', 'data-cy', 'id'],
      enableHealing: true
    });
    
    this.recorder = new EventRecorder(selectorEngine, this.eventClient);
    
    // Subscribe to state changes
    this.eventClient.subscribe((state) => {
      this._isRecording$.next(state.recording.isRecording);
      this._events$.next(state.recording.events);
    });
  }
  
  get isRecording$(): Observable<boolean> {
    return this._isRecording$.asObservable();
  }
  
  get events$(): Observable<RecordedEvent[]> {
    return this._events$.asObservable();
  }
  
  async startRecording(options: any = {}): Promise<void> {
    try {
      await this.recorder.start({
        captureScreenshots: true,
        captureConsole: true,
        ...options
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }
  
  async stopRecording(): Promise<RecordedEvent[]> {
    try {
      return await this.recorder.stop();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }
  
  getEventClient(): BrowserAutomationEventClient {
    return this.eventClient;
  }
}
```

### Component Integration

```typescript
// components/devtools-panel.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { BrowserAutomationService } from '../services/browser-automation.service';
import type { RecordedEvent } from '@tanstack/browser-automation-test-recorder';

@Component({
  selector: 'app-devtools-panel',
  template: `
    <div class="devtools-panel">
      <div class="controls">
        <button 
          [disabled]="isRecording"
          (click)="startRecording()"
          data-testid="start-recording-btn"
        >
          Start Recording
        </button>
        
        <button 
          [disabled]="!isRecording"
          (click)="stopRecording()"
          data-testid="stop-recording-btn"
        >
          Stop Recording
        </button>
      </div>
      
      <div class="events-list">
        <h3>Recorded Events ({{ events.length }})</h3>
        <div *ngFor="let event of events; trackBy: trackByEventId" class="event-item">
          <strong>{{ event.type }}</strong> - {{ event.target.selector }}
          <small>{{ event.timestamp | date:'medium' }}</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .devtools-panel {
      padding: 1rem;
      border: 1px solid #ccc;
      margin: 1rem;
    }
    
    .controls button {
      margin-right: 0.5rem;
      padding: 0.5rem 1rem;
    }
    
    .events-list {
      margin-top: 1rem;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .event-item {
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }
  `]
})
export class DevToolsPanelComponent implements OnInit, OnDestroy {
  isRecording = false;
  events: RecordedEvent[] = [];
  
  private subscriptions: Subscription[] = [];
  
  constructor(private browserAutomation: BrowserAutomationService) {}
  
  ngOnInit() {
    this.subscriptions.push(
      this.browserAutomation.isRecording$.subscribe(isRecording => {
        this.isRecording = isRecording;
      }),
      
      this.browserAutomation.events$.subscribe(events => {
        this.events = events;
      })
    );
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  async startRecording() {
    try {
      await this.browserAutomation.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }
  
  async stopRecording() {
    try {
      await this.browserAutomation.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }
  
  trackByEventId(index: number, event: RecordedEvent): string {
    return event.id;
  }
}
```

### Angular Router Integration

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { BrowserAutomationService } from './services/browser-automation.service';

const routes: Routes = [
  // Your routes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  constructor(
    private router: Router,
    private browserAutomation: BrowserAutomationService
  ) {
    // Record navigation events
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const eventClient = this.browserAutomation.getEventClient();
        eventClient.emit('navigation-event', {
          url: event.url,
          timestamp: Date.now()
        });
      }
    });
  }
}
```

### Testing Integration

```typescript
// components/login.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { BrowserAutomationService } from '../services/browser-automation.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let browserAutomation: BrowserAutomationService;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      providers: [BrowserAutomationService]
    }).compileComponents();
    
    browserAutomation = TestBed.inject(BrowserAutomationService);
  });
  
  it('should record login interaction', async () => {
    // Start recording
    await browserAutomation.startRecording();
    
    // Simulate user interactions
    const compiled = fixture.debugElement.nativeElement;
    const emailInput = compiled.querySelector('[data-testid="email-input"]');
    const passwordInput = compiled.querySelector('[data-testid="password-input"]');
    const loginButton = compiled.querySelector('[data-testid="login-button"]');
    
    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));
    
    passwordInput.value = 'password123';
    passwordInput.dispatchEvent(new Event('input'));
    
    loginButton.click();
    
    // Stop recording and verify events
    const events = await browserAutomation.stopRecording();
    expect(events.length).toBeGreaterThan(0);
    expect(events.some(e => e.type === 'input')).toBeTruthy();
    expect(events.some(e => e.type === 'click')).toBeTruthy();
  });
});
```

## Svelte Integration

### Store Setup

```typescript
// stores/browserAutomation.ts
import { writable, derived } from 'svelte/store';
import { 
  createBrowserAutomationEventClient,
  EventRecorder,
  SelectorEngine,
  type RecordedEvent 
} from '@tanstack/browser-automation-test-recorder';

// Create event client
const eventClient = createBrowserAutomationEventClient();

// Create selector engine
const selectorEngine = new SelectorEngine({
  preferredAttributes: ['data-testid', 'data-cy', 'id'],
  enableHealing: true
});

// Create recorder
const recorder = new EventRecorder(selectorEngine, eventClient);

// Reactive stores
export const isRecording = writable(false);
export const events = writable<RecordedEvent[]>([]);

// Subscribe to event client state changes
eventClient.subscribe((state) => {
  isRecording.set(state.recording.isRecording);
  events.set(state.recording.events);
});

// Derived stores
export const eventCount = derived(events, ($events) => $events.length);
export const lastEvent = derived(events, ($events) => 
  $events.length > 0 ? $events[$events.length - 1] : null
);

// Actions
export const browserAutomation = {
  async startRecording(options = {}) {
    try {
      await recorder.start({
        captureScreenshots: true,
        captureConsole: true,
        ...options
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  },
  
  async stopRecording() {
    try {
      return await recorder.stop();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  },
  
  getEventClient() {
    return eventClient;
  },
  
  getRecorder() {
    return recorder;
  }
};
```

### Component Usage

```svelte
<!-- DevToolsPanel.svelte -->
<script lang="ts">
  import { isRecording, events, eventCount, browserAutomation } from '../stores/browserAutomation';
  
  async function handleStartRecording() {
    try {
      await browserAutomation.startRecording();
    } catch (error) {
      console.error('Recording failed:', error);
    }
  }
  
  async function handleStopRecording() {
    try {
      const recordedEvents = await browserAutomation.stopRecording();
      console.log('Recording completed:', recordedEvents);
    } catch (error) {
      console.error('Stop recording failed:', error);
    }
  }
</script>

<div class="devtools-panel">
  <div class="controls">
    <button 
      on:click={handleStartRecording} 
      disabled={$isRecording}
      data-testid="start-recording"
    >
      Start Recording
    </button>
    
    <button 
      on:click={handleStopRecording} 
      disabled={!$isRecording}
      data-testid="stop-recording"
    >
      Stop Recording
    </button>
  </div>
  
  <div class="status">
    {#if $isRecording}
      <span class="recording-indicator">🔴 Recording... ({$eventCount} events)</span>
    {:else}
      <span>Ready to record</span>
    {/if}
  </div>
  
  <div class="events-list">
    <h3>Recorded Events</h3>
    {#each $events as event (event.id)}
      <div class="event-item">
        <strong>{event.type}</strong> - {event.target.selector}
        <small>{new Date(event.timestamp).toLocaleTimeString()}</small>
      </div>
    {/each}
  </div>
</div>

<style>
  .devtools-panel {
    padding: 1rem;
    border: 1px solid #ccc;
    margin: 1rem;
  }
  
  .controls button {
    margin-right: 0.5rem;
    padding: 0.5rem 1rem;
  }
  
  .recording-indicator {
    color: red;
    font-weight: bold;
  }
  
  .events-list {
    margin-top: 1rem;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .event-item {
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }
</style>
```

### SvelteKit Integration

```typescript
// app.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%sveltekit.assets%/favicon.png" />
  <meta name="viewport" content="width=device-width" />
  %sveltekit.head%
</head>
<body data-sveltekit-preload-data="hover">
  <div style="display: contents">%sveltekit.body%</div>
  
  <!-- DevTools in development -->
  {#if dev}
    <div id="devtools-mount"></div>
  {/if}
</body>
</html>
```

```typescript
// hooks.client.ts
import { dev } from '$app/environment';
import { browserAutomation } from './stores/browserAutomation';

if (dev) {
  // Initialize browser automation in development
  const eventClient = browserAutomation.getEventClient();
  
  // Mount DevTools panel
  import('./components/DevToolsPanel.svelte').then(({ default: DevToolsPanel }) => {
    new DevToolsPanel({
      target: document.getElementById('devtools-mount')
    });
  });
}
```

## Next.js Integration

### Custom Hook

```typescript
// hooks/useBrowserAutomation.ts
'use client';

import { useEffect, useState } from 'react';
import { 
  createBrowserAutomationEventClient,
  EventRecorder,
  SelectorEngine,
  type BrowserAutomationEventClient
} from '@tanstack/browser-automation-test-recorder';

export function useBrowserAutomation() {
  const [eventClient, setEventClient] = useState<BrowserAutomationEventClient | null>(null);
  const [recorder, setRecorder] = useState<EventRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  useEffect(() => {
    // Only initialize in browser
    if (typeof window === 'undefined') return;
    
    const client = createBrowserAutomationEventClient();
    const selectorEngine = new SelectorEngine({
      preferredAttributes: ['data-testid', 'data-cy', 'id'],
      enableHealing: true
    });
    
    const rec = new EventRecorder(selectorEngine, client);
    
    setEventClient(client);
    setRecorder(rec);
    
    // Subscribe to state changes
    const unsubscribe = client.subscribe((state) => {
      setIsRecording(state.recording.isRecording);
    });
    
    return unsubscribe;
  }, []);
  
  return { eventClient, recorder, isRecording };
}
```

### DevTools Component

```typescript
// components/DevTools.tsx
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const BrowserAutomationPanel = dynamic(
  () => import('@tanstack/browser-automation-test-recorder').then(mod => ({
    default: mod.BrowserAutomationPanel
  })),
  { 
    ssr: false,
    loading: () => <div>Loading DevTools...</div>
  }
);

export function DevTools() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrowserAutomationPanel />
    </Suspense>
  );
}
```

### Layout Integration

```typescript
// app/layout.tsx
import { DevTools } from '../components/DevTools';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* DevTools in development */}
        {process.env.NODE_ENV === 'development' && (
          <DevTools />
        )}
      </body>
    </html>
  );
}
```

### API Route Integration

```typescript
// app/api/browser-automation/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();
    
    // Process recorded events
    // Generate test code, save to database, etc.
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process events' },
      { status: 500 }
    );
  }
}
```

## Nuxt.js Integration

### Plugin Setup

```typescript
// plugins/browser-automation.client.ts
import { createBrowserAutomationEventClient } from '@tanstack/browser-automation-test-recorder';

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (process.server) return;
  
  const eventClient = createBrowserAutomationEventClient();
  
  return {
    provide: {
      browserAutomation: eventClient
    }
  };
});
```

### Composable

```typescript
// composables/useBrowserAutomation.ts
export const useBrowserAutomation = () => {
  const { $browserAutomation } = useNuxtApp();
  
  const isRecording = ref(false);
  const events = ref([]);
  
  const recorder = ref(null);
  
  onMounted(async () => {
    const { EventRecorder, SelectorEngine } = await import('@tanstack/browser-automation-test-recorder');
    
    const selectorEngine = new SelectorEngine({
      preferredAttributes: ['data-testid', 'data-cy', 'id'],
      enableHealing: true
    });
    
    recorder.value = new EventRecorder(selectorEngine, $browserAutomation);
    
    // Subscribe to state changes
    $browserAutomation.subscribe((state) => {
      isRecording.value = state.recording.isRecording;
      events.value = state.recording.events;
    });
  });
  
  const startRecording = async (options = {}) => {
    if (!recorder.value) return;
    
    await recorder.value.start({
      captureScreenshots: true,
      captureConsole: true,
      ...options
    });
  };
  
  const stopRecording = async () => {
    if (!recorder.value) return [];
    return await recorder.value.stop();
  };
  
  return {
    isRecording: readonly(isRecording),
    events: readonly(events),
    startRecording,
    stopRecording
  };
};
```

### Component Usage

```vue
<!-- components/DevToolsPanel.vue -->
<template>
  <ClientOnly>
    <div class="devtools-panel">
      <div class="controls">
        <button 
          @click="startRecording"
          :disabled="isRecording"
        >
          Start Recording
        </button>
        <button 
          @click="stopRecording"
          :disabled="!isRecording"
        >
          Stop Recording
        </button>
      </div>
      
      <div class="events">
        <h3>Events: {{ events.length }}</h3>
        <div v-for="event in events" :key="event.id">
          {{ event.type }} - {{ event.target.selector }}
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
const { isRecording, events, startRecording, stopRecording } = useBrowserAutomation();
</script>
```

## Framework-Agnostic Setup

For frameworks not specifically covered, here's a generic integration approach:

### Generic Integration

```typescript
// browser-automation-integration.ts
import { 
  createBrowserAutomationEventClient,
  EventRecorder,
  SelectorEngine 
} from '@tanstack/browser-automation-test-recorder';

class BrowserAutomationIntegration {
  private eventClient;
  private recorder;
  private isInitialized = false;
  
  constructor() {
    this.eventClient = createBrowserAutomationEventClient();
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    const selectorEngine = new SelectorEngine({
      preferredAttributes: ['data-testid', 'data-cy', 'id'],
      enableHealing: true
    });
    
    this.recorder = new EventRecorder(selectorEngine, this.eventClient);
    this.isInitialized = true;
  }
  
  async startRecording(options = {}) {
    await this.initialize();
    return await this.recorder.start(options);
  }
  
  async stopRecording() {
    if (!this.isInitialized) return [];
    return await this.recorder.stop();
  }
  
  getEventClient() {
    return this.eventClient;
  }
  
  onRecordingStateChange(callback) {
    return this.eventClient.subscribe(callback);
  }
}

// Singleton instance
export const browserAutomation = new BrowserAutomationIntegration();

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  browserAutomation.initialize();
}
```

### Global Usage

```javascript
// main.js (or your framework's entry point)
import { browserAutomation } from './browser-automation-integration';

// Make available globally
window.browserAutomation = browserAutomation;

// Development-only DevTools UI
if (process.env.NODE_ENV === 'development') {
  // Create simple UI
  const devToolsContainer = document.createElement('div');
  devToolsContainer.id = 'browser-automation-devtools';
  devToolsContainer.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    background: white;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 4px;
  `;
  
  devToolsContainer.innerHTML = `
    <div>
      <button id="start-recording">Start Recording</button>
      <button id="stop-recording" disabled>Stop Recording</button>
    </div>
    <div id="event-count">Events: 0</div>
  `;
  
  document.body.appendChild(devToolsContainer);
  
  // Wire up controls
  const startBtn = document.getElementById('start-recording');
  const stopBtn = document.getElementById('stop-recording');
  const countDisplay = document.getElementById('event-count');
  
  let eventCount = 0;
  
  startBtn.addEventListener('click', async () => {
    await browserAutomation.startRecording();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });
  
  stopBtn.addEventListener('click', async () => {
    const events = await browserAutomation.stopRecording();
    console.log('Recorded events:', events);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    eventCount = 0;
    countDisplay.textContent = 'Events: 0';
  });
  
  // Update event count
  browserAutomation.onRecordingStateChange((state) => {
    if (state.recording.isRecording) {
      eventCount = state.recording.events.length;
      countDisplay.textContent = `Events: ${eventCount}`;
    }
  });
}
```

## Best Practices

### 1. Test ID Management

Use consistent test ID strategies across frameworks:

```typescript
// test-id-utils.ts
export const testIds = {
  // Navigation
  navHome: 'nav-home',
  navProducts: 'nav-products',
  navProfile: 'nav-profile',
  
  // Forms
  emailInput: 'email-input',
  passwordInput: 'password-input',
  submitButton: 'submit-button',
  
  // Product components
  productCard: 'product-card',
  addToCartButton: 'add-to-cart-button',
  productPrice: 'product-price'
};

// Usage in React
<button data-testid={testIds.submitButton}>Submit</button>

// Usage in Vue
<button :data-testid="testIds.submitButton">Submit</button>

// Usage in Angular
<button [attr.data-testid]="testIds.submitButton">Submit</button>
```

### 2. Environment Configuration

```typescript
// config/browser-automation.ts
interface BrowserAutomationConfig {
  enabled: boolean;
  recordingOptions: {
    captureScreenshots: boolean;
    captureConsole: boolean;
    captureNetwork: boolean;
  };
  selectorOptions: {
    preferredAttributes: string[];
    enableHealing: boolean;
    confidenceThreshold: number;
  };
}

const configs: Record<string, BrowserAutomationConfig> = {
  development: {
    enabled: true,
    recordingOptions: {
      captureScreenshots: true,
      captureConsole: true,
      captureNetwork: true
    },
    selectorOptions: {
      preferredAttributes: ['data-testid', 'data-cy', 'id'],
      enableHealing: true,
      confidenceThreshold: 0.8
    }
  },
  
  production: {
    enabled: false,
    recordingOptions: {
      captureScreenshots: false,
      captureConsole: false,
      captureNetwork: false
    },
    selectorOptions: {
      preferredAttributes: ['data-testid'],
      enableHealing: false,
      confidenceThreshold: 0.9
    }
  }
};

export function getBrowserAutomationConfig(): BrowserAutomationConfig {
  const env = process.env.NODE_ENV || 'development';
  return configs[env] || configs.development;
}
```

### 3. Performance Optimization

```typescript
// Lazy load browser automation features
const loadBrowserAutomation = async () => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  const [
    { createBrowserAutomationEventClient },
    { EventRecorder },
    { SelectorEngine }
  ] = await Promise.all([
    import('@tanstack/browser-automation-test-recorder'),
    import('@tanstack/browser-automation-test-recorder'),
    import('@tanstack/browser-automation-test-recorder')
  ]);
  
  return {
    createBrowserAutomationEventClient,
    EventRecorder,
    SelectorEngine
  };
};

// Use dynamic imports to avoid bundling in production
export const initBrowserAutomation = async () => {
  const modules = await loadBrowserAutomation();
  if (!modules) return null;
  
  const eventClient = modules.createBrowserAutomationEventClient();
  const selectorEngine = new modules.SelectorEngine();
  const recorder = new modules.EventRecorder(selectorEngine, eventClient);
  
  return { eventClient, recorder };
};
```

### 4. Framework-Specific Testing

```typescript
// Framework-specific test helpers
export const testHelpers = {
  react: {
    renderWithBrowserAutomation: (component) => {
      return render(
        <BrowserAutomationProvider>
          {component}
        </BrowserAutomationProvider>
      );
    }
  },
  
  vue: {
    mountWithBrowserAutomation: (component) => {
      return mount(component, {
        global: {
          provide: {
            browserAutomationEventClient: createBrowserAutomationEventClient()
          }
        }
      });
    }
  },
  
  angular: {
    configureTestingModule: () => {
      return TestBed.configureTestingModule({
        providers: [BrowserAutomationService]
      });
    }
  }
};
```

By following these framework-specific integration patterns, you can seamlessly incorporate the Browser Automation Test Recorder Plugin into any web application, regardless of the underlying framework or architecture.

---

*Continue to [Cloud Deployment Guide](./cloud-deployment.md) to learn about deploying and scaling browser automation testing in the cloud.*