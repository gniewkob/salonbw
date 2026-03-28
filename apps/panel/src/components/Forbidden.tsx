export default function Forbidden() {
    return (
        <div className="d-flex h-100 min-h-[300px] flex-column align-items-center justify-content-center gap-2 text-center">
            <p className="fs-1 fw-bold text-dark">403</p>
            <p className="fs-5 text-muted">
                You don&apos;t have permission to access this area.
            </p>
        </div>
    );
}
