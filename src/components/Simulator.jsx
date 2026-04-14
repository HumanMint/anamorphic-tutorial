import React, { useEffect, useRef, useState, useMemo } from 'react';
import { animate } from 'animejs';
import { BREAKPOINTS, SCALE_FACTORS, ANIMATION, COLORS, RESIZE_DEBOUNCE_MS } from '../utils/constants';

const Simulator = ({ activeMode, squeeze = 1.0, delivery = 1.78, scope90 = false, verticalLens = false }) => {
  const sensorRef = useRef(null);
  const monitorRef = useRef(null);
  const sensorStabilizerRef = useRef(null);
  const sensorSubjectRef = useRef(null);
  const cropRef = useRef(null);
  const widthTextRef = useRef(null);
  const heightTextRef = useRef(null);
  const metricsRef = useRef(null);
  const animationsRef = useRef([]);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const prevModeRef = useRef(activeMode);

  // Dynamic scale based on window width
  const ABSOLUTE_SCALE = useMemo(() => {
    if (windowWidth < BREAKPOINTS.SM) return SCALE_FACTORS.SM;
    if (windowWidth < BREAKPOINTS.MD) return SCALE_FACTORS.MD;
    return SCALE_FACTORS.LG;
  }, [windowWidth]);

  // Virtual format: effective sensor size after desqueeze
  const virtualFormat = useMemo(() => {
    if (!activeMode) return null;
    const effectiveW = scope90 ? activeMode.height : activeMode.width;
    const effectiveH = scope90 ? activeMode.width : activeMode.height;
    if (verticalLens) {
      return { width: effectiveW, height: effectiveH * squeeze };
    }
    return { width: effectiveW * squeeze, height: effectiveH };
  }, [activeMode, squeeze, scope90, verticalLens]);

  // Target / crop calculation: how the desqueezed full image relates to the target ratio
  const targetInfo = useMemo(() => {
    if (!activeMode) return null;
    const effectiveW = scope90 ? activeMode.height : activeMode.width;
    const effectiveH = scope90 ? activeMode.width : activeMode.height;
    const fullAspect = verticalLens
      ? effectiveW / (effectiveH * squeeze)
      : (effectiveW / effectiveH) * squeeze;
    const cropRatio = Math.min(fullAspect, delivery) / Math.max(fullAspect, delivery);
    const cropPct = (1 - cropRatio) * 100;
    const isMatch = cropPct < 0.05;
    return {
      fullAspect,
      target: delivery,
      cropPct,
      isMatch,
      cropAxis: fullAspect > delivery ? 'SIDES' : 'TOP/BTM',
    };
  }, [activeMode, squeeze, delivery, scope90, verticalLens]);

  // Debounced resize handler
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setWindowWidth(window.innerWidth), RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!activeMode) return;

    // Cancel previous animations before starting new ones
    animationsRef.current.forEach(anim => {
      if (anim && typeof anim.pause === 'function') anim.pause();
    });
    animationsRef.current = [];

    // --- SENSOR DIMENSIONS (NATIVE) ---
    const sensorW = activeMode.width * ABSOLUTE_SCALE;
    const sensorH = activeMode.height * ABSOLUTE_SCALE;

    // --- MATH FOR DESQUEEZE ---
    const effectiveCaptureWidth = scope90 ? activeMode.height : activeMode.width;
    const effectiveCaptureHeight = scope90 ? activeMode.width : activeMode.height;

    let monitorW, monitorH;
    if (verticalLens) {
      monitorW = effectiveCaptureWidth * ABSOLUTE_SCALE;
      monitorH = monitorW * (effectiveCaptureHeight / effectiveCaptureWidth) * squeeze;
    } else {
      monitorH = effectiveCaptureHeight * ABSOLUTE_SCALE;
      monitorW = monitorH * (effectiveCaptureWidth / effectiveCaptureHeight) * squeeze;
    }

    const desqueezedAspect = verticalLens
      ? effectiveCaptureWidth / (effectiveCaptureHeight * squeeze)
      : (effectiveCaptureWidth / effectiveCaptureHeight) * squeeze;
    let cropW, cropH;
    if (desqueezedAspect > delivery) {
      cropH = monitorH;
      cropW = monitorH * delivery;
    } else {
      cropW = monitorW;
      cropH = monitorW / delivery;
    }

    // --- ANIMATIONS ---
    const elasticConfig = ANIMATION.ELASTIC;

    // 1. Animate Sensor Box
    animationsRef.current.push(
      animate(sensorRef.current, {
        width: sensorW,
        height: sensorH,
        rotate: scope90 ? 90 : 0,
        ...elasticConfig
      })
    );

    // 2. Animate Stabilizer (Counter-rotation)
    animationsRef.current.push(
      animate(sensorStabilizerRef.current, {
        rotate: scope90 ? -90 : 0,
        ...elasticConfig
      })
    );

    // 3. Animate Subject (The Optical Squeeze)
    animationsRef.current.push(
      animate(sensorSubjectRef.current, {
        scaleX: verticalLens ? 1 : (1 / squeeze),
        scaleY: verticalLens ? (1 / squeeze) : 1,
        ...elasticConfig
      })
    );

    // 4. Animate Metrics Rotation
    animationsRef.current.push(
      animate(metricsRef.current, {
        rotate: scope90 ? 90 : 0,
        ...elasticConfig
      })
    );

    // 5. Animate Monitor Box
    animationsRef.current.push(
      animate(monitorRef.current, {
        width: monitorW,
        height: monitorH,
        ...elasticConfig
      })
    );

    // 6. Animate Crop Box
    animationsRef.current.push(
      animate(cropRef.current, {
        width: cropW,
        height: cropH,
        left: (monitorW - cropW) / 2,
        top: (monitorH - cropH) / 2,
        ...elasticConfig
      })
    );

    // --- REACTIVE TYPOGRAPHY ---
    const animateMetric = (el, current, prev) => {
      if (!el || current === prev) return;
      const isIncrease = current > prev;
      const accentColor = isIncrease ? COLORS.INCREASE : COLORS.DECREASE;
      const targetScale = isIncrease ? 1.4 : 0.7;

      animate(el, {
        scale: targetScale,
        color: accentColor,
        ...ANIMATION.METRIC_POP
      }).then(() => {
        if (!el.isConnected) return;
        return animate(el, {
          scale: 1,
          color: COLORS.TEXT_DEFAULT,
          ...ANIMATION.METRIC_SETTLE
        });
      }).catch(() => {}); // swallow animation interruptions
    };

    if (prevModeRef.current) {
      animateMetric(widthTextRef.current, activeMode.width, prevModeRef.current.width);
      animateMetric(heightTextRef.current, activeMode.height, prevModeRef.current.height);
    }

    prevModeRef.current = activeMode;

    // Cleanup on unmount or before next effect run
    return () => {
      animationsRef.current.forEach(anim => {
        if (anim && typeof anim.pause === 'function') anim.pause();
      });
    };

  }, [activeMode, squeeze, delivery, scope90, verticalLens, ABSOLUTE_SCALE]);

  if (!activeMode) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-[10px] font-bold tracking-[0.4em] text-gray-300 uppercase text-center leading-relaxed">
          Optical System Standby<br/>
          <span className="text-[8px] mt-2 block opacity-50 font-black">Calibration Required</span>
        </div>
      </div>
    );
  }

  const orientationLabel = scope90 ? 'SCOPE_90_MOUNT' : verticalLens ? 'VERTICAL_LENS' : 'STANDARD_MOUNT';
  const configLabel = scope90 ? '90°_DESQUEEZE' : verticalLens ? `${Number(squeeze).toFixed(2)}X_VERTICAL` : `${Number(squeeze).toFixed(2)}X_DESQUEEZE`;

  return (
    <div className="flex-1 bg-[#f2f2f2] flex flex-col lg:flex-row items-stretch p-6 lg:p-10 gap-10 lg:gap-0 border-l-0 lg:border-l border-gray-200 overflow-y-auto lg:overflow-hidden relative">

      {/* STATIC PHYSICAL GRID — calibrated scale reference (10mm minor / 50mm major) */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(rgba(0,0,0,0.13) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.13) 1px, transparent 1px)
          `,
          backgroundSize: `
            ${10 * ABSOLUTE_SCALE}px ${10 * ABSOLUTE_SCALE}px,
            ${10 * ABSOLUTE_SCALE}px ${10 * ABSOLUTE_SCALE}px,
            ${50 * ABSOLUTE_SCALE}px ${50 * ABSOLUTE_SCALE}px,
            ${50 * ABSOLUTE_SCALE}px ${50 * ABSOLUTE_SCALE}px
          `,
          backgroundPosition: 'center center',
        }}
      />

      {/* SCALE LEGEND */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400 tabular-nums pointer-events-none select-none">
        <div className="w-2 h-2 border border-gray-300" /><span>10_MM</span>
        <span className="opacity-40 mx-0.5">/</span>
        <div className="w-3 h-3 border border-gray-500" /><span>50_MM</span>
      </div>

      {/* SECTION 1: SENSOR CAPTURE */}
      <div className="flex flex-col items-center justify-center z-10 w-full lg:flex-1 shrink-0">
        <div className="mb-4 lg:mb-6 flex gap-6 lg:gap-10 items-end w-full max-w-[440px]">
          <div className="flex-1">
            <div className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 lg:mb-2 underline decoration-gray-200 underline-offset-4">01_FOCAL_PLANE</div>
            <div className="text-[10px] lg:text-xs font-bold text-gray-900 tracking-tighter">
                {orientationLabel}
            </div>
          </div>
          <div className="relative">
            <div ref={metricsRef} aria-live="polite" aria-label="Sensor dimensions" className="text-right flex items-baseline gap-1 font-mono text-gray-600 origin-center tabular-nums">
               <div ref={widthTextRef} className="text-xs lg:text-sm font-bold origin-right">{activeMode.width.toFixed(2)}</div>
               <div className="text-[8px] lg:text-[10px] text-gray-300">&times;</div>
               <div ref={heightTextRef} className="text-xs lg:text-sm font-bold origin-right">{activeMode.height.toFixed(2)}</div>
               <div className="text-[8px] lg:text-[10px] ml-1 text-gray-400 font-sans font-black uppercase">MM</div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center min-h-[150px] lg:min-h-[340px] w-full">
          <div
            ref={sensorRef}
            className="bg-white border-[2px] border-gray-900 flex items-center justify-center overflow-hidden relative"
            style={{ width: 100, height: 100 }}
          >
            <div ref={sensorStabilizerRef} className="flex items-center justify-center">
                <div
                  ref={sensorSubjectRef}
                  className="w-20 lg:w-32 h-20 lg:h-32 rounded-full border-[4px] lg:border-[6px] border-[#ff4400]"
                />
            </div>
          </div>
        </div>
      </div>

      {/* VERTICAL DIVIDER (lg+) */}
      <div className="hidden lg:block w-px self-stretch bg-gray-300 mx-4 z-10" aria-hidden="true" />

      {/* SECTION 2: DIGITAL OUTPUT */}
      <div className="flex flex-col items-center justify-center z-10 w-full lg:flex-1 shrink-0">
        <div className="mb-4 lg:mb-6 flex gap-6 lg:gap-10 items-end w-full max-w-[440px]">
          <div className="flex-1">
            <div className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 lg:mb-2 underline decoration-gray-200 underline-offset-4">02_SIGNAL_OUTPUT</div>
            <div className="text-[10px] lg:text-xs font-bold text-gray-900 tracking-tighter">DESQUEEZED_MONITOR</div>
          </div>
          <div className="text-right font-mono flex flex-col items-end tabular-nums">
             <div className="text-[10px] lg:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">CONFIGURATION</div>
             <div className="text-xs lg:text-sm text-gray-900 font-black tracking-tighter leading-none">
                {configLabel}
             </div>
             {virtualFormat && (
               <div className="text-[9px] lg:text-[10px] text-gray-500 font-bold mt-1 tracking-tight">
                 VIRTUAL {virtualFormat.width.toFixed(2)} &times; {virtualFormat.height.toFixed(2)} MM
               </div>
             )}
          </div>
        </div>

        <div className="relative flex items-center justify-center min-h-[150px] lg:min-h-[340px] w-full">
          <div
            ref={monitorRef}
            className="bg-[#111] relative overflow-hidden border border-gray-900"
            style={{ width: 100, height: 100 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 lg:w-32 h-20 lg:h-32 rounded-full border-[3px] lg:border-[5px] border-white opacity-[0.1]" />
            </div>

            <div
              ref={cropRef}
              className="absolute border-[1.5px] border-[#ff4400] z-10"
            >
              <div className="absolute bottom-0 right-0 px-1 py-0.5 lg:px-1.5 lg:py-1 text-[9px] lg:text-[10px] font-black text-[#ff4400] uppercase bg-[#1a1a1a] tracking-widest text-right tabular-nums whitespace-nowrap">
                TARGET_RATIO {delivery.toFixed(2)}:1
              </div>
            </div>
          </div>
        </div>

        {/* CALCULATED READOUT — three mini-cells matching card spec strip */}
        {targetInfo && (
          <div className="mt-5 lg:mt-7 w-full max-w-[420px] grid grid-cols-3 font-mono tabular-nums">
            <div className="flex flex-col px-3">
              <span className="text-gray-400 font-black uppercase tracking-[0.15em] text-[8px] lg:text-[9px] mb-1">CALCULATED</span>
              <span className="text-gray-900 font-bold text-[11px] lg:text-[13px] leading-none">{targetInfo.fullAspect.toFixed(2)}:1</span>
            </div>
            <div className="flex flex-col px-3 border-l border-gray-200">
              <span className="text-gray-400 font-black uppercase tracking-[0.15em] text-[8px] lg:text-[9px] mb-1">TARGET</span>
              <span className="text-gray-900 font-bold text-[11px] lg:text-[13px] leading-none">{targetInfo.target.toFixed(2)}:1</span>
            </div>
            <div className="flex flex-col px-3 border-l border-gray-200">
              <span className="text-gray-400 font-black uppercase tracking-[0.15em] text-[8px] lg:text-[9px] mb-1">CROP_LOSS</span>
              <span className="text-gray-900 font-bold text-[11px] lg:text-[13px] leading-none whitespace-nowrap">
                {targetInfo.isMatch
                  ? 'NATIVE_FIT'
                  : `${targetInfo.cropPct.toFixed(1)}% ${targetInfo.cropAxis}`}
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default React.memo(Simulator);
