import { useId } from "react";

function BrandLogo({ className = "h-10 w-10", showWordmark = false }) {
  const gradientId = useId();

  return (
    <span className={`inline-flex items-center gap-2.5 ${showWordmark ? "" : "justify-center"}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="18" fill={`url(#${gradientId})`} />
        <path
          d="M18 19.5c0-3.59 2.91-6.5 6.5-6.5h18.8c3.37 0 6.2 2.53 6.57 5.88l2.13 19.2C52.46 42.24 49.2 46 45.02 46H23.6C20.5 46 18 43.5 18 40.4V19.5Z"
          fill="white"
          fillOpacity="0.94"
        />
        <path
          d="M23 23h21.8M23 31h16.5M23 39h12.5"
          stroke="#0F766E"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M41.8 35.2 47 30l5.2 5.2M47 31v15"
          stroke="#F59E0B"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M31.5 16v23"
          stroke="#0F766E"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray="1 6"
        />
        <circle cx="47" cy="47" r="6.5" fill="#0F766E" />
        <path
          d="M44.2 45.1h5.6M44.2 47h5.6M46.3 45.1c2.6 0 2.6 3.7-.1 3.7h-2"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id={gradientId} x1="10" y1="7" x2="56" y2="59" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0D9488" />
            <stop offset="0.52" stopColor="#10B981" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
      {showWordmark && (
        <span className="leading-none">
          <span className="block text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            Spending Calculator
          </span>
          <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">
            Carry-Forward Daily Budgeting
          </span>
        </span>
      )}
    </span>
  );
}

export default BrandLogo;
