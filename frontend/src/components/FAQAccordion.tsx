'use client';
import { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpen(index === open ? null : index);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border rounded">
          <button
            type="button"
            onClick={() => toggle(i)}
            className="w-full p-2 text-left font-medium"
          >
            {item.question}
          </button>
          {open === i && <div className="p-2 border-t">{item.answer}</div>}
        </div>
      ))}
    </div>
  );
}
