import { useEmails } from '@/hooks/useEmails';

export default function EmailList() {
    const { data } = useEmails();
    return (
        <ul className="space-y-2">
            {data.map((e) => (
                <li key={e.id} className="border p-2">
                    <div>{e.subject}</div>
                    <div className="text-xs text-gray-500">{e.recipient}</div>
                    <div className="text-xs text-gray-500">{e.status}</div>
                    <div className="text-xs text-gray-500">
                        {new Date(e.sentAt).toLocaleString()}
                    </div>
                </li>
            ))}
        </ul>
    );
}
