import React from 'react';

export default function SkeletonLoading() {
  return (
    <div className="skeleton-container" role="status" aria-live="polite">
      {/* Skeleton controls bar */}
      <div className="skeleton-controls">
        <div className="skeleton-pulse" style={{ height: '48px', width: '30%', borderRadius: '16px' }} />
        <div className="skeleton-pulse" style={{ height: '48px', width: '20%', borderRadius: '16px' }} />
        <div className="skeleton-pulse" style={{ height: '48px', width: '20%', borderRadius: '16px' }} />
      </div>

      <div className="skeleton-chips">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="skeleton-pulse" style={{ height: '32px', width: '100px', borderRadius: '50px' }} />
        ))}
      </div>

      {/* Skeleton Header */}
      <div className="skeleton-header">
        <div className="skeleton-pulse" style={{ height: '24px', width: '180px', borderRadius: '4px' }} />
      </div>

      {/* Skeleton Grid */}
      <div className="matches-grid">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="match-card" style={{ height: '200px', padding: '20px' }}>
            <div className="skeleton-pulse" style={{ height: '14px', width: '60px', marginBottom: '24px', borderRadius: '4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="skeleton-pulse" style={{ height: '30px', width: '40px', borderRadius: '4px' }} />
              <div className="skeleton-pulse" style={{ height: '40px', width: '100px', borderRadius: '8px' }} />
              <div className="skeleton-pulse" style={{ height: '30px', width: '40px', borderRadius: '4px' }} />
            </div>
            <div className="skeleton-pulse" style={{ height: '12px', width: '80%', margin: '0 auto', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
