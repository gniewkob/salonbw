'use client';
interface Props {
    onMenu?: () => void;
}

export default function Topbar({ onMenu }: Props) {
    return (
        <header className="bg-dark text-white">
            <div className="d-flex align-items-center justify-content-between p-3">
                <button onClick={onMenu} className="p-2 rounded">
                    <span className="visually-hidden">Open Menu</span>
                    &#9776;
                </button>
                <h1 className="fw-bold">Salon Black &amp; White</h1>
            </div>
        </header>
    );
}
