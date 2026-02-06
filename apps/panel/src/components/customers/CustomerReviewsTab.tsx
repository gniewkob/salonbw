'use client';

import { useState } from 'react';

interface Props {
    customerId: number;
}

type ReviewSource = 'internal' | 'booksy' | 'google' | 'facebook';

interface CustomerReview {
    id: number;
    rating: number;
    content?: string;
    source: ReviewSource;
    serviceId?: number;
    serviceName?: string;
    employeeId?: number;
    employeeName?: string;
    createdAt: string;
    reply?: {
        content: string;
        createdAt: string;
        authorName: string;
    };
}

const sourceConfig: Record<
    ReviewSource,
    { label: string; icon: string; color: string }
> = {
    internal: {
        label: 'Wewnętrzna',
        icon: '⭐',
        color: 'bg-cyan-100 text-cyan-700',
    },
    booksy: {
        label: 'Booksy',
        icon: '📱',
        color: 'bg-orange-100 text-orange-700',
    },
    google: {
        label: 'Google',
        icon: '🔍',
        color: 'bg-blue-100 text-blue-700',
    },
    facebook: {
        label: 'Facebook',
        icon: '📘',
        color: 'bg-indigo-100 text-indigo-700',
    },
};

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`text-lg ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
export default function CustomerReviewsTab({ customerId }: Props) {
    const [reviews] = useState<CustomerReview[]>([]);
    const [filterSource, setFilterSource] = useState<ReviewSource | 'all'>(
        'all',
    );
    const isLoading = false;

    // TODO: Integrate with API when backend supports customer reviews
    // const { data: reviews, isLoading } = useCustomerReviews(customerId);

    const filteredReviews =
        filterSource === 'all'
            ? reviews
            : reviews.filter((r) => r.source === filterSource);

    const averageRating =
        reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Ładowanie opinii...</div>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="versum-widget">
                    <div className="versum-widget__header flex-between">
                        <span>Opinie klienta</span>
                        {reviews.length > 0 && (
                            <div
                                className="flex-center"
                                style={{ gap: '10px' }}
                            >
                                <StarRating
                                    rating={Math.round(averageRating)}
                                />
                                <span
                                    style={{ fontSize: '11px', color: '#666' }}
                                >
                                    {averageRating.toFixed(1)} / 5.0 (
                                    {reviews.length} opinii)
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="versum-widget__content">
                        {/* Source Filter */}
                        {reviews.length > 0 && (
                            <div
                                style={{
                                    marginBottom: '20px',
                                    borderBottom: '1px solid #eee',
                                    paddingBottom: '10px',
                                }}
                            >
                                <div className="btn-group">
                                    <button
                                        onClick={() => setFilterSource('all')}
                                        className={`btn btn-xs ${filterSource === 'all' ? 'btn-primary' : 'btn-default'}`}
                                    >
                                        Wszystkie
                                    </button>
                                    {Object.entries(sourceConfig).map(
                                        ([key, config]) => {
                                            const count = reviews.filter(
                                                (r) => r.source === key,
                                            ).length;
                                            if (count === 0) return null;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() =>
                                                        setFilterSource(
                                                            key as ReviewSource,
                                                        )
                                                    }
                                                    className={`btn btn-xs ${filterSource === key ? 'btn-primary' : 'btn-default'}`}
                                                >
                                                    {config.label} ({count})
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reviews List */}
                        {filteredReviews.length > 0 ? (
                            <div className="versum-notes-list">
                                {filteredReviews.map((review) => {
                                    const config =
                                        sourceConfig[review.source] ||
                                        sourceConfig.internal;
                                    return (
                                        <div
                                            key={review.id}
                                            style={{
                                                padding: '15px 0',
                                                borderBottom:
                                                    '1px solid #f0f0f0',
                                            }}
                                        >
                                            <div
                                                className="flex-between"
                                                style={{ marginBottom: '8px' }}
                                            >
                                                <div
                                                    className="flex-center"
                                                    style={{ gap: '10px' }}
                                                >
                                                    <StarRating
                                                        rating={review.rating}
                                                    />
                                                    <span
                                                        className="label label-default"
                                                        style={{
                                                            fontWeight: 400,
                                                            fontSize: '10px',
                                                        }}
                                                    >
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: '11px',
                                                        color: '#999',
                                                    }}
                                                >
                                                    {new Date(
                                                        review.createdAt,
                                                    ).toLocaleDateString(
                                                        'pl-PL',
                                                    )}
                                                </span>
                                            </div>

                                            {(review.serviceName ||
                                                review.employeeName) && (
                                                <div
                                                    style={{
                                                        fontSize: '12px',
                                                        color: '#555',
                                                        marginBottom: '8px',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {review.serviceName}
                                                    {review.serviceName &&
                                                        review.employeeName &&
                                                        ' - '}
                                                    {review.employeeName && (
                                                        <span
                                                            style={{
                                                                fontWeight: 400,
                                                                color: '#888',
                                                            }}
                                                        >
                                                            {' '}
                                                            {
                                                                review.employeeName
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {review.content && (
                                                <div
                                                    style={{
                                                        fontSize: '13px',
                                                        color: '#333',
                                                        lineHeight: '1.4',
                                                        fontStyle: 'italic',
                                                    }}
                                                >
                                                    "{review.content}"
                                                </div>
                                            )}

                                            {review.reply && (
                                                <div
                                                    className="versum-panel-sub"
                                                    style={{
                                                        marginTop: '12px',
                                                        padding: '10px',
                                                        background: '#fcfcfc',
                                                    }}
                                                >
                                                    <div
                                                        className="flex-between"
                                                        style={{
                                                            marginBottom: '5px',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    '11px',
                                                                fontWeight: 700,
                                                                color: '#777',
                                                            }}
                                                        >
                                                            Odpowiedź:{' '}
                                                            {
                                                                review.reply
                                                                    .authorName
                                                            }
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    '10px',
                                                                color: '#bbb',
                                                            }}
                                                        >
                                                            {new Date(
                                                                review.reply.createdAt,
                                                            ).toLocaleDateString(
                                                                'pl-PL',
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '12px',
                                                            color: '#666',
                                                        }}
                                                    >
                                                        {review.reply.content}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div
                                className="text-center text-muted"
                                style={{ padding: '60px 0' }}
                            >
                                <div
                                    style={{
                                        fontSize: '32px',
                                        marginBottom: '10px',
                                    }}
                                >
                                    💬
                                </div>
                                <p
                                    style={{
                                        fontSize: '14px',
                                        marginBottom: '5px',
                                    }}
                                >
                                    {filterSource === 'all'
                                        ? 'Brak opinii od tego klienta.'
                                        : `Brak opinii z platformy "${sourceConfig[filterSource as ReviewSource].label}".`}
                                </p>
                                <p style={{ fontSize: '11px' }}>
                                    Opinie są zbierane automatycznie z
                                    połączonych platform (Booksy, Google) oraz
                                    mogą być dodawane ręcznie.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
