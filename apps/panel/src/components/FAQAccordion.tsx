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
        <div className="gap-2">
            {items.map((item, i) => (
                <div key={i} className="border rounded">
                    <button
                        type="button"
                        onClick={() => toggle(i)}
                        className="w-100 p-2 text-start fw-medium"
                    >
                        {item.question}
                    </button>
                    {open === i && (
                        <div className="p-2 border-top">{item.answer}</div>
                    )}
                </div>
            ))}
        </div>
    );
}
