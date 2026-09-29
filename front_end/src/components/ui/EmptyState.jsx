import { BookOpen } from "lucide-react";

function EmptyState({
  icon = <BookOpen size={22} />,
  title = "Nothing here yet",
  description,
  action,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">{icon}</div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;