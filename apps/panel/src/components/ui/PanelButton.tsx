import Link from 'next/link';
import type {
    AnchorHTMLAttributes,
    ButtonHTMLAttributes,
    ReactNode,
} from 'react';

type PanelButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type PanelButtonSize = 'sm' | 'md';

type SharedPanelButtonProps = {
    children: ReactNode;
    className?: string;
    icon?: ReactNode;
    size?: PanelButtonSize;
    variant?: PanelButtonVariant;
};

type NativeButtonProps = SharedPanelButtonProps &
    ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: never;
    };

type LinkButtonProps = SharedPanelButtonProps &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
        href: string;
    };

export type PanelButtonProps = NativeButtonProps | LinkButtonProps;

export function panelButtonClassName({
    className,
    size = 'md',
    variant = 'secondary',
}: Pick<SharedPanelButtonProps, 'className' | 'size' | 'variant'>) {
    return [
        'panel-button',
        `panel-button--${variant}`,
        `panel-button--${size}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');
}

export default function PanelButton(props: PanelButtonProps) {
    if ('href' in props && props.href) {
        const {
            children,
            className,
            href,
            icon,
            size = 'md',
            variant = 'secondary',
            ...linkProps
        } = props;
        const classes = panelButtonClassName({ className, size, variant });
        const content = (
            <>
                {icon ? (
                    <span className="panel-button__icon">{icon}</span>
                ) : null}
                <span>{children}</span>
            </>
        );

        return (
            <Link href={href} className={classes} {...linkProps}>
                {content}
            </Link>
        );
    }

    const {
        children,
        className,
        icon,
        size = 'md',
        variant = 'secondary',
        // Niepodany type wewnątrz <form> = submit — wymuszamy bezpieczny default.
        type = 'button',
        ...rest
    } = props as NativeButtonProps;
    const classes = panelButtonClassName({ className, size, variant });
    const content = (
        <>
            {icon ? <span className="panel-button__icon">{icon}</span> : null}
            <span>{children}</span>
        </>
    );

    return (
        <button type={type} className={classes} {...rest}>
            {content}
        </button>
    );
}
