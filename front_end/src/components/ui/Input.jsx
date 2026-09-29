import { useId } from "react";

function Input({
  label,
  error,
  icon,
  id,
  className = "",
  inputClassName = "",
  ...props
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">{icon}</span>}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${icon ? "pl-10" : ""} ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200"} ${inputClassName}`}
          {...props}
        />
      </div>
      {error && <p id={errorId} className="mt-1.5 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

export default Input;