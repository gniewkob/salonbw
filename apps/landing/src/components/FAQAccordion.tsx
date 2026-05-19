'use client';
import { useState } from 'react';

export interface FAQItem {
    question: string;
    answer: string;
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
    const [open, setOpen] = useState<number | null>(null);

    return (
        <div className="faq-accordion">
            {items.map((item, i) => (
                <div key={i} className={`faq-item${open === i ? ' faq-item--open' : ''}`}>
                    <button
                        type="button"
                        onClick={() => setOpen(open === i ? null : i)}
                        className="faq-item__trigger"
                        aria-expanded={open === i}
                    >
                        <span className="faq-item__question">{item.question}</span>
                        <svg
                            className="faq-item__chevron"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                    <div className="faq-item__body">
                        <p className="faq-item__answer">{item.answer}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
