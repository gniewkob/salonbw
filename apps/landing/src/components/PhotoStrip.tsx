import Image from 'next/image';
import { SALON_GALLERY } from '@/config/content';

type StripItem = { id: number; image: string; alt: string; caption: string };

const STRIP_ITEMS = (SALON_GALLERY as unknown as StripItem[]).slice(0, 5);

export default function PhotoStrip() {
    return (
        <div className="photo-strip" aria-hidden="true">
            {STRIP_ITEMS.map((item) => (
                <div key={item.id} className="photo-strip__item">
                    <Image
                        src={item.image}
                        alt={item.alt}
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                        sizes="(max-width: 768px) 65vw, 20vw"
                    />
                    <div className="photo-strip__overlay" />
                    <span className="photo-strip__index">{String(item.id).padStart(2, '0')}</span>
                </div>
            ))}
        </div>
    );
}
