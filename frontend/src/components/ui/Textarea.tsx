import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ className, id, label, ...props }: TextareaProps) {
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <textarea
        className={['textarea', className ?? ''].join(' ')}
        id={id}
        {...props}
      />
    </div>
  );
}
