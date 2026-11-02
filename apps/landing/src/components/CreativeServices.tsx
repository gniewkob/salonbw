import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const SERVICE_ROUTES = [
    '/services?offer=hairdressing',
    '/services?offer=care',
    '/services?offer=extensions',
] as const;
const SERVICE_IMAGES = [
    '/images/hero/DSC_9584-card.jpg',
    '/images/hero/DSC_9576.jpg',
    '/images/hero/DSC_9583.jpg',
] as const;

export default function CreativeServices() {
    const { T } = useLanguage();

    return (
        <section className="creative-services" aria-labelledby="creative-services-heading">
            <div className="creative-services__intro">
                <div className="creative-services__intro-copy">
                    <span className="creative-services__eyebrow">{T.services.eyebrow} / 01—03</span>
                    <h2 id="creative-services-heading">{T.services.title}</h2>
                </div>
                <p>{T.services.teaserSubtitle}</p>
            </div>
            <div className="creative-services__collection">
                {T.services.items.slice(0, 3).map((item, index) => (
                    <Link
                        key={SERVICE_ROUTES[index]}
                        href={SERVICE_ROUTES[index]}
                        className="creative-services__item"
                    >
                        <div className="creative-services__media">
                            <Image
                                src={SERVICE_IMAGES[index]}
                                alt=""
                                fill
                                sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 34vw"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        <div className="creative-services__item-body">
                            <span className="creative-services__number">0{index + 1}</span>
                            <div className="creative-services__item-text">
                                <h3>{item.title}</h3>
                                <p>{item.subtitle}</p>
                            </div>
                            <span className="creative-services__arrow" aria-hidden="true">↗</span>
                        </div>
                    </Link>
                ))}
            </div>
            <Link href="/services" className="creative-services__all">
                {T.services.viewAll} <span aria-hidden="true">↗</span>
            </Link>
        </section>
    );
}
