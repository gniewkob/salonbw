import React from 'react';

type Props = {
    fallback: React.ReactNode;
    children: React.ReactNode;
};

type State = {
    hasError: boolean;
};

export default class CustomerErrorBoundary extends React.Component<
    Props,
    State
> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        // Keep this local to avoid cascading failures from logging paths.
        // eslint-disable-next-line no-console
        console.error('[customers] render error', error);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}
