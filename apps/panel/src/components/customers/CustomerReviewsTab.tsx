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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                    Opinie klienta
                </h3>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                        <StarRating rating={Math.round(averageRating)} />
                        <span className="text-sm text-gray-500">
                            ({averageRating.toFixed(1)} z {reviews.length}{' '}
                            opinii)
                        </span>
                    </div>
                )}
            </div>

            {/* Source Filter */}
            {reviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterSource('all')}
                        className={`rounded-full px-3 py-1 text-sm transition-colors ${
                            filterSource === 'all'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Wszystkie
                    </button>
                    {Object.entries(sourceConfig).map(([key, config]) => {
                        const count = reviews.filter(
                            (r) => r.source === key,
                        ).length;
                        if (count === 0) return null;
                        return (
                            <button
                                key={key}
                                onClick={() =>
                                    setFilterSource(key as ReviewSource)
                                }
                                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                                    filterSource === key
                                        ? 'bg-cyan-600 text-white'
                                        : `${config.color} hover:opacity-80`
                                }`}
                            >
                                {config.icon} {config.label} ({count})
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Reviews List */}
            {filteredReviews.length > 0 ? (
                <div className="space-y-4">
                    {filteredReviews.map((review) => {
                        const config =
                            sourceConfig[review.source] ||
                            sourceConfig.internal;
                        return (
                            <div
                                key={review.id}
                                className="rounded-lg border bg-white p-4 shadow-sm"
                            >
                                {/* Review Header */}
                                <div className="mb-3 flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <StarRating
                                                rating={review.rating}
                                            />
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${config.color}`}
                                            >
                                                {config.icon} {config.label}
                                            </span>
                                        </div>
                                        {(review.serviceName ||
                                            review.employeeName) && (
                                            <p className="mt-1 text-sm text-gray-500">
                                                {review.serviceName && (
                                                    <span>
                                                        {review.serviceName}
                                                    </span>
                                                )}
                                                {review.serviceName &&
                                                    review.employeeName &&
                                                    ' • '}
                                                {review.employeeName && (
                                                    <span>
                                                        {review.employeeName}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(
                                            review.createdAt,
                                        ).toLocaleDateString('pl-PL')}
                                    </span>
                                </div>

                                {/* Review Content */}
                                {review.content && (
                                    <p className="text-gray-700">
                                        {review.content}
                                    </p>
                                )}

                                {/* Reply */}
                                {review.reply && (
                                    <div className="mt-3 rounded-lg bg-gray-50 p-3">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">
                                                Odpowiedź od{' '}
                                                {review.reply.authorName}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(
                                                    review.reply.createdAt,
                                                ).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {review.reply.content}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-lg border bg-gray-50 p-8 text-center">
                    <div className="mb-2 text-4xl">💬</div>
                    <p className="text-gray-500">
                        {filterSource === 'all'
                            ? 'Brak opinii od tego klienta.'
                            : `Brak opinii z platformy "${sourceConfig[filterSource].label}".`}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                        Opinie są zbierane automatycznie z połączonych platform
                        (Booksy, Google) oraz mogą być dodawane ręcznie.
                    </p>
                </div>
            )}
        </div>
    );
}
