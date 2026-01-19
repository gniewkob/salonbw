'use client';
interface Props {
    onMenu?: () => void;
}

export default function Topbar({ onMenu }: Props) {
    return (
        <header className="bg-gray-800 text-white md:ml-60">
            <div className="flex items-center justify-between p-4 md:p-2">
                <button
                    onClick={onMenu}
                    className="md:hidden p-2 rounded hover:bg-gray-700"
                >
                    <span className="sr-only">Open Menu</span>
                    &#9776;
                </button>
                <h1 className="font-bold">Salon Black &amp; White</h1>
            </div>
        </header>
    );
}
