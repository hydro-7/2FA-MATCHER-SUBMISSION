export function Swoosh({ className = "" }) {
  return (
    <svg className={`swoosh ${className}`} viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 10 C 60 2, 140 2, 198 9" />
    </svg>
  );
}
