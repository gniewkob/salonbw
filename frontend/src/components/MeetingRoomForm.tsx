import { FormEvent, useState } from 'react';

interface Props {
  onSubmit: (data: { name: string; equipment: string[] }) => Promise<void>;
  onCancel: () => void;
}

export default function MeetingRoomForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, equipment });
  };

  const toggleEquipment = (value: string) => {
    setEquipment((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-1 w-full"
        placeholder="Room name"
      />
      <div>
        <label htmlFor="equipment-projector" className="inline-flex items-center gap-1">
          <input
            id="equipment-projector"
            type="checkbox"
            name="equipment"
            value="projector"
            checked={equipment.includes('projector')}
            onChange={() => toggleEquipment('projector')}
            className="mr-1"
          />
          Projector
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="border px-2 py-1">
          Cancel
        </button>
        <button type="submit" className="border px-2 py-1">
          Save
        </button>
      </div>
    </form>
  );
}

