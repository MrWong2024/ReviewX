import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  size?: 'default' | 'small';
  variant?: ButtonVariant;
};

export function Button({
  children,
  className,
  size = 'default',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  const classes = [
    'button',
    `button-${variant}`,
    size === 'small' ? 'button-small' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type="button" {...props}>
      {children}
    </button>
  );
}
