import { memo } from 'react';

const BackgroundPattern = memo(() => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <svg width="100%" height="100%" className="opacity-5">
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
));

BackgroundPattern.displayName = 'BackgroundPattern';

export default BackgroundPattern;