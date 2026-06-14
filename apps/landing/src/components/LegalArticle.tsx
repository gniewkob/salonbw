import type { Language } from '@/i18n/translations';
import type { LegalDoc } from '@/i18n/legalContent';

const DATE_LOCALE: Record<Language, string> = {
    pl: 'pl-PL',
    en: 'en-GB',
    de: 'de-DE',
};

/**
 * Renders a localized legal document (Terms / Privacy) from the structured
 * LEGAL content model. PL is the binding version; EN/DE show a review notice.
 */
export default function LegalArticle({
    doc,
    lang,
}: {
    doc: LegalDoc;
    lang: Language;
}) {
    return (
        <div className="legal-page">
            <article className="legal-article">
                <p className="legal-eyebrow">{doc.eyebrow}</p>
                <h1 className="legal-h1">{doc.h1}</h1>

                <p className="legal-lead">{doc.lead}</p>

                {doc.reviewNotice && (
                    <p
                        className="legal-body"
                        role="note"
                        style={{ fontStyle: 'italic', opacity: 0.8 }}
                    >
                        {doc.reviewNotice}
                    </p>
                )}

                {doc.sections.map((section) => (
                    <section key={section.heading}>
                        <h2 className="legal-h2">{section.heading}</h2>
                        {section.blocks.map((block, bi) => {
                            if (block.type === 'p') {
                                return (
                                    <p
                                        key={bi}
                                        className="legal-body"
                                    >
                                        {block.text}
                                    </p>
                                );
                            }
                            const ListTag = block.ordered ? 'ol' : 'ul';
                            return (
                                <ListTag key={bi} className="legal-list">
                                    {block.items.map((item, ii) => (
                                        <li key={ii}>
                                            {item.lead && (
                                                <strong>{item.lead} </strong>
                                            )}
                                            {item.text}
                                        </li>
                                    ))}
                                </ListTag>
                            );
                        })}
                    </section>
                ))}

                <div className="legal-date">
                    {doc.effectiveLabel}{' '}
                    {new Date().toLocaleDateString(DATE_LOCALE[lang])}
                </div>
            </article>
        </div>
    );
}
