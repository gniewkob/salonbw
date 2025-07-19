import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationList() {
  const { data } = useNotifications();
  return (
    <ul className="space-y-2">
      {data.map((n) => (
        <li key={n.id} className="border p-2">
          <div>{n.message}</div>
          <div className="text-xs text-gray-500">
            {new Date(n.createdAt).toLocaleString()}
          </div>
        </li>
      ))}
    </ul>
  );
}
