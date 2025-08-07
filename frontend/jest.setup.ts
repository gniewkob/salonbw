import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost';

declare global {
  interface BroadcastChannel {
    readonly name: string;
    postMessage(message: any): void;
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

// polyfill for msw/node
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;
global.BroadcastChannel = class {
  constructor(public readonly name: string) {}
  postMessage(message: any) {}
  close() {}
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {}
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) {}
};

// polyfill window.matchMedia used by react-hot-toast
global.matchMedia = (query: string) => ({
  media: query,
  matches: false,
  addEventListener: () => {},
  removeEventListener: () => {},
});

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
