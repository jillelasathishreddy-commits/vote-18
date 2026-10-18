import React from 'react';

export default function TopBanner() {
  return (
    <aside aria-label="Academic prototype disclaimer" className="bg-[#18181b] text-[#d4d4d8] text-xs py-2 px-4 text-center tracking-wide font-normal">
      <span>Academic prototype · simulated data only · not affiliated with ECI or UIDAI. For real registration use </span>
      <a
        href="https://voters.eci.gov.in"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white underline hover:text-orange-300 transition-colors inline-flex items-center gap-0.5"
      >
        voters.eci.gov.in
      </a>
    </aside>
  );
}
