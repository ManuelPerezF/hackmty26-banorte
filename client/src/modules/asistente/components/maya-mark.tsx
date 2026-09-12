export function MayaMark({ className = '' }: { className?: string }) {
  return (
    <img
      className={`maya-mark ${className}`}
      src="/branding/maya-mark.png"
      width={64}
      height={64}
      alt=""
      aria-hidden="true"
    />
  );
}
