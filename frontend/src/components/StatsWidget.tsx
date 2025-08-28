interface Props {
    title: string;
    value: number | null;
    loading?: boolean;
}

export default function StatsWidget({ title, value, loading }: Props) {
    return (
        <div className="w-full p-4 sm:p-6 bg-white rounded shadow">
            {loading ? (
                <div
                    role="status"
                    className="h-6 bg-gray-200 animate-pulse rounded"
                />
            ) : (
                <>
                    <div className="text-xs sm:text-sm text-gray-500">
                        {title}
                    </div>
                    <div
                        data-testid="value"
                        className="text-xl sm:text-2xl font-bold"
                    >
                        {value}
                    </div>
                </>
            )}
        </div>
    );
}
