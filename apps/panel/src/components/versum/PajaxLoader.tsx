'use client';

import { usePajaxLoading } from '@/hooks/usePajaxLoading';

/**
 * Globalny loader dla PAJAX nawigacji
 * Pokazuje pasek postępu podczas zmiany stron
 */
export default function PajaxLoader() {
    const isLoading = usePajaxLoading();

    if (!isLoading) return null;

    return (
        <div className="pajax-loader-container">
            <div className="pajax-loader-bar">
                <div className="pajax-loader-progress" />
            </div>
            <style jsx>{`
                .pajax-loader-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 9999;
                    pointer-events: none;
                }
                .pajax-loader-bar {
                    height: 3px;
                    background: rgba(0, 139, 180, 0.1);
                    overflow: hidden;
                }
                .pajax-loader-progress {
                    height: 100%;
                    width: 30%;
                    background: linear-gradient(
                        90deg,
                        #008bb4,
                        #00a8d9,
                        #008bb4
                    );
                    animation: pajax-loading 1s ease-in-out infinite;
                }
                @keyframes pajax-loading {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(400%);
                    }
                }
            `}</style>
        </div>
    );
}
