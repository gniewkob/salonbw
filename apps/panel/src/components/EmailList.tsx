import { useEmails } from '@/hooks/useEmails';

export default function EmailList() {
    const { data } = useEmails();
    return (
        <ul className="gap-2">
            {data.map((e) => (
                <li key={e.id} className="border p-2">
                    <div>{e.subject}</div>
                    <div className="small text-muted">{e.recipient}</div>
                    <div className="small text-muted">{e.status}</div>
                    <div className="small text-muted">
                        {new Date(e.sentAt).toLocaleString()}
                    </div>
                </li>
            ))}
        </ul>
    );
}
