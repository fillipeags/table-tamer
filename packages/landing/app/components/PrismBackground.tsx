'use client';

import dynamic from 'next/dynamic';

const Prism = dynamic(() => import('./Prism'), { ssr: false });

export function PrismBackground() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: 0.25 }}>
        <Prism
          animationType="rotate"
          timeScale={0.3}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0}
          glow={0.8}
          suspendWhenOffscreen={false}
        />
      </div>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 0%, #0c0e14 75%)' }}
      />
    </>
  );
}
