'use client';
import Image from 'next/image';
import { FOUNDER_MESSAGE } from '@/config/content';

type FounderData = { name: string; quote: string; photo?: string };

interface FounderMessageProps {
    founder?: FounderData;
}

export default function FounderMessage({ founder }: FounderMessageProps) {
    const data = founder ?? (FOUNDER_MESSAGE as FounderData);
    return (
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <blockquote className="text-center">
                        <div className="mb-8">
                            {data.photo && (
                                <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                                    <Image
                                        src={data.photo}
                                        alt={`Zdjęcie ${data.name}`}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        sizes="128px"
                                    />
                                </div>
                            )}
                            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6">
                                &ldquo;{data.quote}&rdquo;
                            </p>
                        </div>
                        <footer className="flex flex-col items-center">
                            <cite
                                className="not-italic font-tangerine text-4xl md:text-5xl text-brand-gold"
                                style={{ fontFamily: 'Tangerine, cursive' }}
                            >
                                {data.name}
                            </cite>
                            <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Założycielka Salon Black & White
                            </span>
                        </footer>
                    </blockquote>
                </div>
            </div>
        </section>
    );
}
