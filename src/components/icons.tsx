import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export function RadioEmblem(props: IconProps) {
  return (
    <svg {...base} viewBox="0 0 40 40" {...props}>
      <circle cx="20" cy="20" r="3.6" fill="currentColor" stroke="none" />
      <path d="M13.6 13.6a9 9 0 0 0 0 12.8M26.4 13.6a9 9 0 0 1 0 12.8" strokeWidth="3" />
      <path d="M9.4 9.4a15 15 0 0 0 0 21.2M30.6 9.4a15 15 0 0 1 0 21.2" strokeWidth="3" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4.5v15a.8.8 0 0 0 1.2.7l12-7.5a.8.8 0 0 0 0-1.4l-12-7.5A.8.8 0 0 0 7 4.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5.5" y="5.5" width="13" height="13" rx="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function SpeakerIcon({ muted, ...props }: IconProps & { muted?: boolean }) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      {muted ? (
        <path d="m16 9.5 5 5M21 9.5l-5 5" />
      ) : (
        <path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
      )}
    </svg>
  );
}

export function SwapIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" />
    </svg>
  );
}

export function StarIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base} {...props}>
      <path
        d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}
