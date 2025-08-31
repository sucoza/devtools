import "@testing-library/jest-dom";

// Fix for React 19 and @testing-library/react compatibility
// React 19 requires globalThis.IS_REACT_ACT_ENVIRONMENT to be set
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
