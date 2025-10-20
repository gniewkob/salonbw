export default function Forbidden() {
    return (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center">
            <p className="text-6xl font-bold text-gray-800">403</p>
            <p className="text-lg text-gray-600">
                You don&apos;t have permission to access this area.
            </p>
        </div>
    );
}
