interface Props {
    title: string;
    value: number | null;
    loading?: boolean;
}

export default function StatsWidget({ title, value, loading }: Props) {
    return (
        <div className="w-100 p-3 bg-white rounded shadow">
            {loading ? (
                <div
                    role="status"
                    className="h-6 bg-secondary bg-opacity-25 rounded"
                />
            ) : (
                <>
                    <div className="small text-muted">{title}</div>
                    <div data-testid="value" className="fs-5 fw-bold">
                        {value}
                    </div>
                </>
            )}
        </div>
    );
}
