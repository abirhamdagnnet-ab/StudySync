import { LoaderCircle } from "lucide-react";

function Spinner({ size = 18, label = "Loading", className = "" }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} role="status" aria-label={label}>
      <LoaderCircle size={size} className="animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default Spinner;