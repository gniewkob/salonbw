import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost';

// polyfill for msw/node
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;
(global as any).ReadableStream = ReadableStream;
(global as any).WritableStream = WritableStream;
(global as any).TransformStream = TransformStream;
(global as any).BroadcastChannel = class {
  constructor(public name: string) {}
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
