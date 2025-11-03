import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';
import {
    ReadableStream,
    WritableStream,
    TransformStream,
} from 'web-streams-polyfill';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost';

declare global {
    interface BroadcastChannel {
        readonly name: string;
        postMessage(message: unknown): void;
        close(): void;
        addEventListener(
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions,
        ): void;
        removeEventListener(
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | EventListenerOptions,
        ): void;
    }

    interface GlobalThis {
        TextEncoder: typeof import('util').TextEncoder;
        TextDecoder: typeof import('util').TextDecoder;
        ReadableStream: typeof import('web-streams-polyfill').ReadableStream;
        WritableStream: typeof import('web-streams-polyfill').WritableStream;
        TransformStream: typeof import('web-streams-polyfill').TransformStream;
        BroadcastChannel: {
            new (name: string): BroadcastChannel;
        };
        matchMedia: (query: string) => {
            media: string;
            matches: boolean;
            addEventListener: () => void;
            removeEventListener: () => void;
        };
    }
}

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;
global.BroadcastChannel = class {
    constructor(public readonly name: string) {}
    postMessage(_message: unknown) {
        void _message;
    }
    close() {}
    addEventListener(
        _type: string,
        _listener: EventListenerOrEventListenerObject,
        _options?: boolean | AddEventListenerOptions,
    ) {
        void _type;
        void _listener;
        void _options;
    }
    removeEventListener(
        _type: string,
        _listener: EventListenerOrEventListenerObject,
        _options?: boolean | EventListenerOptions,
    ) {
        void _type;
        void _listener;
        void _options;
    }
};

// polyfill window.matchMedia used by react-hot-toast
global.matchMedia = ((query: string) => ({
    media: query,
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
})) as typeof globalThis.matchMedia;

jest.mock('next/router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// Mock Sentry to avoid accessing Next router internals in tests
jest.mock('@sentry/nextjs', () => ({
    init: jest.fn(),
    metrics: { distribution: jest.fn() },
}));
