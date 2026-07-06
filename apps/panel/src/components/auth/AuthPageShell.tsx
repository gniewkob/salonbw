import Link from 'next/link';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface AuthPageShellProps {
    title: string;
    children: ReactNode;
    footerPrompt: string;
    footerHref: string;
    footerLabel: string;
}

export function AuthPageShell({
    title,
    children,
    footerPrompt,
    footerHref,
    footerLabel,
}: AuthPageShellProps) {
    return (
        <div className="auth-page">
            <span className="auth-page__watermark" aria-hidden>
                B&amp;W
            </span>
            <main className="auth-page__panel">
                <div className="auth-page__brand">
                    <p className="auth-page__eyebrow">
                        Akademia Zdrowych Włosów
                    </p>
                    <h1 className="auth-page__title">{title}</h1>
                    <div className="auth-page__rule" aria-hidden />
                </div>

                {children}

                <p className="auth-page__switch">
                    {footerPrompt}{' '}
                    <Link
                        href={footerHref}
                        prefetch={false}
                        className="auth-page__link"
                    >
                        {footerLabel}
                    </Link>
                </p>

                <p className="auth-page__footer">
                    Salon Black &amp; White · Bytom
                </p>
            </main>
        </div>
    );
}

interface AuthFieldProps {
    id: string;
    label: string;
    optional?: boolean;
    spacious?: boolean;
    error?: string;
    children: ReactNode;
}

export function AuthField({
    id,
    label,
    optional = false,
    spacious = false,
    error,
    children,
}: AuthFieldProps) {
    return (
        <div className={`auth-field ${spacious ? 'auth-field--spacious' : ''}`}>
            <label htmlFor={id} className="auth-field__label">
                {label}
                {optional ? (
                    <span className="auth-field__optional"> (opcjonalnie)</span>
                ) : null}
            </label>
            {children}
            {error ? (
                <p role="alert" className="auth-field__error">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

interface AuthTextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    invalid?: boolean;
}

export function AuthTextInput({
    invalid = false,
    ...props
}: AuthTextInputProps) {
    return (
        <input
            {...props}
            className={`auth-input ${props.className ?? ''}`.trim()}
            aria-invalid={invalid ? 'true' : undefined}
        />
    );
}

export function AuthSubmitButton({
    children,
    disabled,
}: {
    children: ReactNode;
    disabled?: boolean;
}) {
    return (
        <button type="submit" disabled={disabled} className="auth-submit">
            {children}
        </button>
    );
}

export function AuthStatus({ children }: { children: ReactNode }) {
    if (!children) return null;
    return (
        <p role="alert" className="auth-page__status">
            {children}
        </p>
    );
}

export function AuthConsentLabel({
    children,
    muted = false,
}: {
    children: ReactNode;
    muted?: boolean;
}) {
    return (
        <label className={`auth-consent ${muted ? 'auth-consent--muted' : ''}`}>
            {children}
        </label>
    );
}
