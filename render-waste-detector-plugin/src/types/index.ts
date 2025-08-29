// Export all types
export * from "./render-waste";
export * from "./devtools";
// Note: global.d.ts contains ambient declarations and doesn't need to be exported

// Add missing event client type
export type { RenderWasteDetectorEventClient } from "../core/devtools-client";
