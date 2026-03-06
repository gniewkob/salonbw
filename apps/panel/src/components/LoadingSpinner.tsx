export default function LoadingSpinner({ size = 16 }: { size?: number }) {
    return (
        <span
            aria-label="Loading"
            className="inline-block align-middle border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
            {...({ style: { width: `${size}px`, height: `${size}px` } } as any)}
        />
    );
}
