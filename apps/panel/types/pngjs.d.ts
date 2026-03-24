declare module 'pngjs' {
    export interface PNGOptions {
        width?: number;
        height?: number;
        checkCRC?: boolean;
        deflateChunkSize?: number;
        deflateLevel?: number;
        deflateStrategy?: number;
        deflateFactory?: unknown;
        filterType?: number | number[];
        colorType?: number;
        inputColorType?: number;
        bitDepth?: number;
        inputHasAlpha?: boolean;
        bgColor?: { red: number; green: number; blue: number };
        skipRescale?: boolean;
        initGrayscaleData?: boolean;
    }

    export class PNG {
        width: number;
        height: number;
        data: Buffer;
        gamma: number;

        constructor(options?: PNGOptions);

        on(event: string, callback: (...args: unknown[]) => void): this;
        pack(): this;
        parse(data: Buffer | string, callback?: (error: Error | null, data: PNG) => void): this;
        pipe(destination: unknown): unknown;

        static sync: {
            read(buffer: Buffer, options?: PNGOptions): PNG;
            write(png: PNG, options?: PNGOptions): Buffer;
        };
    }
}
