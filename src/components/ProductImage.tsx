/* eslint-disable @next/next/no-img-element */
const TONES = ["bg-brand-soft text-brand", "bg-accent-soft text-orange", "bg-orange-soft text-brand-dark"];

export function ProductImage({ src, name, className = "" }: { src: string | null; name: string; className?: string }) {
  if (src) return <img src={src} alt={name} className={`object-cover ${className}`} loading="lazy" />;
  const tone = TONES[name.length % TONES.length];
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div aria-hidden className={`flex items-center justify-center font-display text-3xl ${tone} ${className}`}>
      {initials}
    </div>
  );
}
