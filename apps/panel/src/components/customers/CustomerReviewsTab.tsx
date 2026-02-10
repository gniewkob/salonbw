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
                            <div className="flex-center gap-10">
                                <StarRating
                                    rating={Math.round(averageRating)}
                                />
                                <span className="fz-11 text-666">
                                    {averageRating.toFixed(1)} / 5.0 (
                                    {reviews.length} opinii)
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="versum-widget__content">
                        {/* Source Filter */}
                        {reviews.length > 0 && (
                            <div className="mb-20 border-bottom-eee pb-10">
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
                                            className="py-15 border-bottom-f0"
                                        >
                                            <div className="flex-between mb-8">
                                                <div className="flex-center gap-10">
                                                    <StarRating
                                                        rating={review.rating}
                                                    />
                                                    <span className="label label-default fw-400 fz-10">
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <span className="fz-11 text-999">
                                                    {new Date(
                                                        review.createdAt,
                                                    ).toLocaleDateString(
                                                        'pl-PL',
                                                    )}
                                                </span>
                                            </div>

                                            {(review.serviceName ||
                                                review.employeeName) && (
                                                <div className="fz-12 text-555 mb-8 fw-600">
                                                    {review.serviceName}
                                                    {review.serviceName &&
                                                        review.employeeName &&
                                                        ' - '}
                                                    {review.employeeName && (
                                                        <span className="fw-400 text-888">
                                                            {' '}
                                                            {
                                                                review.employeeName
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {review.content && (
                                                <div className="fz-13 text-333 lh-14 italic">
                                                    &quot;{review.content}&quot;
                                                </div>
                                            )}

                                            {review.reply && (
                                                <div className="versum-panel-sub mt-12 p-10 bg-fcfc">
                                                    <div className="flex-between mb-5">
                                                        <span className="fz-11 fw-700 text-777">
                                                            Odpowiedź:{' '}
                                                            {
                                                                review.reply
                                                                    .authorName
                                                            }
                                                        </span>
                                                        <span className="fz-10 text-bbb">
                                                            {new Date(
                                                                review.reply.createdAt,
                                                            ).toLocaleDateString(
                                                                'pl-PL',
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="fz-12 text-666">
                                                        {review.reply.content}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center text-muted py-60-0">
                                <div className="fz-32 mb-10">💬</div>
                                <p className="fz-14 mb-5">
                                    {filterSource === 'all'
                                        ? 'Brak opinii od tego klienta.'
                                        : `Brak opinii z platformy "${sourceConfig[filterSource as ReviewSource].label}".`}
                                </p>
                                <p className="fz-11">
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
