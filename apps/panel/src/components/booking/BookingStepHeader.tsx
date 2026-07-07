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
            <h2 className="booking-step-header__heading">{current.heading}</h2>
        </div>
    );
}
