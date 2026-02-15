'use client';
import Image from 'next/image';
import { FOUNDER_MESSAGE } from '@/config/content';

export default function FounderMessage() {
    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <blockquote className="text-center">
                        <div className="mb-8">
                            {FOUNDER_MESSAGE.photo && (
                                <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                                    <Image
                                        src={FOUNDER_MESSAGE.photo}
                                        alt={`Zdjęcie ${FOUNDER_MESSAGE.name}`}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        sizes="128px"
                                    />
                                </div>
                            )}
                            <p className="text-lg md:text-xl text-gray-700 italic leading-relaxed mb-6">
                                &ldquo;{FOUNDER_MESSAGE.quote}&rdquo;
                            </p>
                        </div>
                        <footer className="flex flex-col items-center">
                            <cite
                                className="not-italic font-tangerine text-4xl md:text-5xl text-brand-gold"
                                style={{ fontFamily: 'Tangerine, cursive' }}
                            >
                                {FOUNDER_MESSAGE.name}
                            </cite>
                            <span className="text-sm text-gray-500 mt-2">
                                Założycielka Salon Black & White
                            </span>
                        </footer>
                    </blockquote>
                </div>
            </div>
        </section>
    );
}
