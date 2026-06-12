import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ children, className, id, label, ...props }: SelectProps) {
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <select className={['select', className ?? ''].join(' ')} id={id} {...props}>
        {children}
      </select>
    </div>
  );
}
