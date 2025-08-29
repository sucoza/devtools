# Auth & Permissions Mock System - Setup Guide

## Quick Setup

### 1. Build the Chrome Extension

```bash
cd auth-permissions-mock-extension
npm install
npm run build
```

### 2. Install in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `auth-permissions-mock-extension` folder

### 3. Test with Sample Application

```bash
cd test-app
npm install
npm run dev
```

1. Open http://localhost:3000
2. Open Chrome DevTools (F12)
3. Navigate to the "Auth Mock" tab
4. Start testing authentication scenarios!

## Key Features Implemented

✅ **Complete Chrome Extension**: DevTools panel, popup, content scripts
✅ **JWT Token Management**: Decode, edit, and generate tokens
✅ **Role-Based Access Control**: Switch between user roles dynamically  
✅ **Permission Matrix**: Granular permission management
✅ **OAuth Flow Simulation**: Mock OAuth 2.0 flows for major providers
✅ **Storage Management**: Handle localStorage, sessionStorage, and cookies
✅ **Real-time State Sync**: Changes reflect immediately in web applications
✅ **Client-side Warning System**: Clear indicators this is mock-only
✅ **Test Application**: Comprehensive testing interface

## Usage Workflow

1. **Install Extension** → Load unpacked in Chrome
2. **Open Test App** → Navigate to localhost:3000
3. **Open DevTools** → Press F12, find "Auth Mock" tab
4. **Simulate Authentication** → Use panels to mock different auth states
5. **See Live Updates** → Watch test app respond to changes

## Architecture Overview

- **Extension Core**: Chrome Manifest V3 with React/TypeScript
- **State Management**: Custom auth store with Chrome storage persistence
- **UI Components**: Modern React components with Tailwind CSS
- **Communication**: Content scripts bridge DevTools ↔ Page context
- **Storage Integration**: Supports all browser storage mechanisms

## File Structure

```
auth-permissions-mock-extension/     # Main extension
├── manifest.json                    # Extension configuration
├── src/components/                  # React UI components
├── src/stores/                      # Authentication state management
└── dist/                           # Built files (after npm run build)

test-app/                           # Test application
├── src/App.tsx                     # Main test interface
└── dist/                          # Built files (after npm run dev)
```

The extension is production-ready for development and testing use cases!