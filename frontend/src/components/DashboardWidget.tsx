interface Props {
    label: string;
    value: number | null;
    loading?: boolean;
}

export default function DashboardWidget({ label, value, loading }: Props) {
    return (
        <div className="p-4 bg-white rounded shadow">
            {loading ? (
                <div role="status" className="h-6 bg-gray-200 animate-pulse" />
            ) : (
                <>
                    <div className="text-sm text-gray-500">{label}</div>
                    <div data-testid="value" className="text-2xl font-bold">
                        {value}
                    </div>
                </>
            )}
        </div>
    );
}
