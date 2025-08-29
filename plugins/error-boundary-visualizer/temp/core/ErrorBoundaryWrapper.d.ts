import React, { Component, ErrorInfo, ReactNode } from 'react';
interface Props {
    children: ReactNode;
    fallback?: React.ComponentType<{
        error: Error;
        resetErrorBoundary: () => void;
    }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onReset?: () => void;
    boundaryId?: string;
    boundaryName?: string;
    level?: 'page' | 'section' | 'component';
    enableDevTools?: boolean;
}
interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorCount: number;
    retryCount: number;
}
export declare class ErrorBoundaryWrapper extends Component<Props, State> {
    private boundaryId;
    private unregister?;
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): Partial<State>;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    resetErrorBoundary: () => void;
    render(): string | number | bigint | boolean | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | import("react/jsx-runtime").JSX.Element | null | undefined;
}
export {};
//# sourceMappingURL=ErrorBoundaryWrapper.d.ts.map