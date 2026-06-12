import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className, id, label, ...props }: InputProps) {
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <input className={['input', className ?? ''].join(' ')} id={id} {...props} />
    </div>
  );
}
