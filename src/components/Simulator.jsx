import React, { useEffect, useRef, useState, useMemo } from 'react';
import { animate } from 'animejs';
import { BREAKPOINTS, SCALE_FACTORS, ANIMATION, COLORS, RESIZE_DEBOUNCE_MS } from '../utils/constants';

const Simulator = ({ activeMode, squeeze = 1.0, delivery = 1.78, scope90 = false }) => {
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

    const monitorH = effectiveCaptureHeight * ABSOLUTE_SCALE;
    const monitorW = monitorH * (effectiveCaptureWidth / effectiveCaptureHeight) * squeeze;

    const desqueezedAspect = (effectiveCaptureWidth / effectiveCaptureHeight) * squeeze;
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
        scaleX: 1 / squeeze,
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

  }, [activeMode, squeeze, delivery, scope90, ABSOLUTE_SCALE]);

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

  return (
    <div className="flex-1 bg-[#f2f2f2] flex flex-col items-center justify-start lg:justify-center p-6 lg:p-12 gap-12 lg:gap-16 border-l-0 lg:border-l border-gray-200 overflow-y-auto lg:overflow-hidden relative">

      {/* STATIC PHYSICAL GRID */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: `${10 * ABSOLUTE_SCALE}px ${10 * ABSOLUTE_SCALE}px`,
          backgroundPosition: 'center center'
        }}
      />

      {/* SECTION 1: SENSOR CAPTURE */}
      <div className="flex flex-col items-center z-10 w-full shrink-0">
        <div className="mb-4 lg:mb-6 flex gap-6 lg:gap-12 items-end w-full max-w-[500px]">
          <div className="flex-1">
            <div className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 lg:mb-2 underline decoration-gray-200 underline-offset-4">01_Focal_Plane</div>
            <div className="text-[10px] lg:text-xs font-bold text-gray-900 tracking-tighter">
                {scope90 ? 'SCOPE_90_MOUNT' : 'OPTICAL_CAPTURE'}
            </div>
          </div>
          <div className="relative">
            <div ref={metricsRef} aria-live="polite" aria-label="Sensor dimensions" className="text-right flex items-baseline gap-1 font-mono text-gray-600 origin-center">
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
            className="bg-white border-[2px] border-gray-900 shadow-[20px_20px_60px_rgba(0,0,0,0.05)] flex items-center justify-center overflow-hidden relative"
            style={{ width: 100, height: 100 }}
          >
            <div ref={sensorStabilizerRef} className="flex items-center justify-center">
                <div
                  ref={sensorSubjectRef}
                  className="w-20 lg:w-32 h-20 lg:h-32 rounded-full border-[4px] lg:border-[6px] border-[#ff4400]"
                />
            </div>
          </div>
          <div className="absolute -left-12 lg:-left-20 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] lg:text-[11px] font-black uppercase tracking-[0.5em] text-gray-400 pointer-events-none whitespace-nowrap">
            {scope90 ? 'SCOPE_90_MOUNT' : 'Standard_Mount'}
          </div>
        </div>
      </div>

      {/* SECTION 2: DIGITAL OUTPUT */}
      <div className="flex flex-col items-center z-10 w-full shrink-0">
        <div className="mb-4 lg:mb-6 flex gap-6 lg:gap-12 items-end w-full max-w-[500px]">
          <div className="flex-1">
            <div className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 lg:mb-2 underline decoration-gray-200 underline-offset-4">02_Signal_Output</div>
            <div className="text-[10px] lg:text-xs font-bold text-gray-900 tracking-tighter">DESQUEEZED_MONITOR</div>
          </div>
          <div className="text-right font-mono flex flex-col items-end">
             <div className="text-[10px] lg:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Configuration</div>
             <div className="text-xs lg:text-sm text-[#ff4400] font-black tracking-tighter leading-none">
                {scope90 ? '90\u00B0 DESQ' : `${Number(squeeze).toFixed(2)}X`}
             </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center min-h-[150px] lg:min-h-[340px] w-full">
          <div
            ref={monitorRef}
            className="bg-[#111] shadow-2xl relative overflow-hidden ring-1 ring-white/10"
            style={{ width: 100, height: 100 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 lg:w-32 h-20 lg:h-32 rounded-full border-[3px] lg:border-[5px] border-white opacity-[0.1]" />
            </div>

            <div
              ref={cropRef}
              className="absolute border-[1px] border-[#ff4400]/80 shadow-[0_0_20px_rgba(255,68,0,0.4)] z-10"
            >
              <div className="absolute bottom-0 right-0 p-1 lg:p-1.5 text-[10px] lg:text-[11px] font-black text-[#ff4400] uppercase bg-gray-900/90 tracking-widest text-right">
                {delivery.toFixed(2)}:1_OUT
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default React.memo(Simulator);
