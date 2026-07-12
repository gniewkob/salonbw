import { useEffect, useRef } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';

export interface BookingStepDefinition<TStep extends string> {
    key: TStep;
    label: string;
    heading: string;
    backLabel: string;
}

interface BookingStepHeaderProps<TStep extends string> {
    activeStep: TStep;
    current: BookingStepDefinition<TStep>;
    steps: BookingStepDefinition<TStep>[];
    onBack?: () => void;
}

export default function BookingStepHeader<TStep extends string>({
    activeStep,
    current,
    steps,
    onBack,
}: BookingStepHeaderProps<TStep>) {
    const headingRef = useRef<HTMLHeadingElement>(null);
    const isFirstRender = useRef(true);

    // Move focus to the new step's heading on every transition (Z9) — but
    // not on first mount, so we don't steal the page's initial landing
    // focus from whatever the browser/router already set. Keyed on
    // `current.key` (the real step), not `activeStep` — callers may alias
    // a trailing step onto the same indicator position (e.g. "confirm"
    // shown under the "slot" bullet) while the heading text still changes.
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        headingRef.current?.focus();
    }, [current.key]);

    return (
        <div className="booking-step-header">
            <ol
                className="booking-step-header__steps"
                aria-label="Kroki rezerwacji"
            >
                {steps.map((step, index) => {
                    const isActive = step.key === activeStep;
                    return (
                        <li
                            key={step.key}
                            className={`booking-step-header__step${
                                isActive
                                    ? ' booking-step-header__step--active'
                                    : ''
                            }`}
                            aria-current={isActive ? 'step' : undefined}
                        >
                            <span
                                className="booking-step-header__number"
                                aria-hidden="true"
                            >
                                {index + 1}
                            </span>
                            <span className="booking-step-header__label">
                                {step.label}
                            </span>
                        </li>
                    );
                })}
            </ol>
            {onBack && (
                <button
                    type="button"
                    className="booking-step-header__back"
                    onClick={onBack}
                >
                    <ChevronLeftIcon aria-hidden="true" />
                    {current.backLabel}
                </button>
            )}
            <h2
                ref={headingRef}
                tabIndex={-1}
                className="booking-step-header__heading"
            >
                {current.heading}
            </h2>
        </div>
    );
}
