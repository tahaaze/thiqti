import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { strokeWidth?: number };

// Étoile zellige (khatim) : deux carrés imbriqués dont un pivoté à 45°, cœur plein.
export function ZelligeStar({ strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="7" y="7" width="10" height="10" />
      <rect x="7" y="7" width="10" height="10" transform="rotate(45 12 12)" />
      <rect x="10" y="10" width="4" height="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Bouclier Thiqti : bouclier + étoile à 4 branches en cœur.
export function ThiqtiShield({ strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2 L20 5 V11 C20 16.5 16.5 20.5 12 22 C7.5 20.5 4 16.5 4 11 V5 Z" />
      <path
        d="M12 8 L13.2 10.8 L16 12 L13.2 13.2 L12 16 L10.8 13.2 L8 12 L10.8 10.8 Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

// Cœur favoris.
export function FavHeart({ strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 20.5 C7 16.5 3 13 3 8.8 C3 5.9 5.2 4 7.8 4 C9.4 4 11 4.9 12 6.3 C13 4.9 14.6 4 16.2 4 C18.8 4 21 5.9 21 8.8 C21 13 17 16.5 12 20.5 Z" />
    </svg>
  );
}
