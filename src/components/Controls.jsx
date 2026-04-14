import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { animate, stagger, createSpring } from 'animejs';
import { Download, ChevronDown } from 'lucide-react';
import { DELIVERY_RATIOS } from '../utils/constants';
import { exportConfigCard } from '../utils/exportCard';

const ControlSection = ({ id, label, collapsed, onToggle, summary, children }) => {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const summaryRef = useRef(null);
  const chevronRef = useRef(null);
  const isFirstRender = useRef(true);

  // Mount animation — section fades + slides in when first revealed
  useEffect(() => {
    if (!sectionRef.current) return;
    animate(sectionRef.current, {
      opacity: [0, 1],
      translateY: [-14, 0],
      duration: 700,
      ease: createSpring({ stiffness: 110, damping: 14 }),
    });
  }, []);

  // Collapse / expand animation
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (isFirstRender.current) {
      // Set initial state without animation
      isFirstRender.current = false;
      el.style.opacity = '1';
      if (collapsed) {
        el.style.maxHeight = '0px';
        el.style.pointerEvents = 'none';
      } else {
        el.style.maxHeight = '9999px';
        el.style.pointerEvents = 'auto';
      }
      return;
    }

    const buttons = Array.from(el.querySelectorAll('button, [role="switch"]'));

    if (collapsed) {
      // Collapsing — measure current height, animate down (no opacity layer)
      const current = el.scrollHeight;
      el.style.maxHeight = `${current}px`;
      void el.offsetHeight;
      el.style.pointerEvents = 'none';
      animate(el, {
        maxHeight: 0,
        duration: 380,
        ease: 'inOutQuart',
      });
    } else {
      // Expanding — only maxHeight on the box; buttons handle their own opacity uniformly
      el.style.maxHeight = '9999px';
      const target = el.scrollHeight;
      el.style.maxHeight = '0px';
      void el.offsetHeight;
      el.style.pointerEvents = 'auto';
      animate(el, {
        maxHeight: target,
        duration: 420,
        ease: 'outExpo',
        onComplete: () => {
          if (el.isConnected) el.style.maxHeight = '9999px';
        },
      });
      if (buttons.length) {
        // Uniform fade — every button comes up together
        animate(buttons, {
          opacity: [0, 1],
          duration: 220,
          ease: 'outQuart',
        });
        // Tight cascade on translateY — all buttons start moving within ~40ms
        const cascadeMs = 40;
        const gap = buttons.length > 1 ? cascadeMs / (buttons.length - 1) : 0;
        animate(buttons, {
          translateY: [10, 0],
          delay: stagger(gap),
          duration: 260,
          ease: 'outQuart',
        });
      }
    }

    // Chevron rotation via anime
    if (chevronRef.current) {
      animate(chevronRef.current, {
        rotate: collapsed ? 0 : 180,
        duration: 500,
        ease: createSpring({ stiffness: 200, damping: 14 }),
      });
    }

    // Summary text fade
    if (summaryRef.current) {
      animate(summaryRef.current, {
        opacity: collapsed ? [0, 1] : [1, 0],
        translateX: collapsed ? [4, 0] : [0, 4],
        duration: 350,
        ease: 'outQuart',
      });
    }
  }, [collapsed]);

  return (
    <div ref={sectionRef} className="mb-6">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={`section-${id}`}
        className="w-full flex items-center justify-between text-left mb-3 border-b border-gray-100 pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4400]"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</span>
        <span className="flex items-center gap-2.5 min-w-0">
          {summary && (
            <span
              ref={summaryRef}
              className="text-[10px] font-bold text-gray-900 tracking-tight uppercase font-mono tabular-nums truncate max-w-[140px]"
              style={{ opacity: collapsed ? 1 : 0 }}
            >
              {summary}
            </span>
          )}
          <span ref={chevronRef} className="inline-flex shrink-0">
            <ChevronDown size={12} strokeWidth={2.5} className="text-gray-400" />
          </span>
        </span>
      </button>
      <div
        ref={contentRef}
        id={`section-${id}`}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const TactileButton = ({ active, onClick, label, sublabel }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={clsx(
      'flex items-center justify-between px-4 py-3 rounded-sm transition-all duration-200 text-left',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4400]',
      active
        ? 'bg-[#1a1a1a] text-white'
        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
    )}
  >
    <div className="flex flex-col">
      <span className="text-xs font-bold leading-tight">{label}</span>
      {sublabel && <span className="text-[9px] text-gray-400 font-mono mt-0.5">{sublabel}</span>}
    </div>
    {active && <div className="w-1.5 h-1.5 rounded-full bg-[#ff4400]" />}
  </button>
);

const Controls = ({ data, selection, onChange, showControls, setShowControls }) => {
  const brands = useMemo(() => Object.keys(data || {}), [data]);

  const models = useMemo(() => {
    if (!selection.brand || !data) return [];
    return Object.keys(data[selection.brand] || {});
  }, [data, selection.brand]);

  const modes = useMemo(() => {
    if (!selection.brand || !selection.model || !data) return [];
    return data[selection.brand][selection.model] || [];
  }, [data, selection.brand, selection.model]);

  const availableSqueezes = useMemo(() => {
    if (!selection.mode) return [];
    const currentMode = modes.find(m => m.name === selection.mode);
    if (!currentMode) return [];
    let squeezes = [1.0, ...currentMode.supportedSqueezes];
    return [...new Set(squeezes)].sort((a, b) => a - b);
  }, [modes, selection.mode]);

  // Collapsed accordion state — auto-progress as user makes selections
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = useCallback((id) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSelect = useCallback((key, value) => {
    onChange(key, value);
    setCollapsed(prev => {
      const next = { ...prev };
      if (key === 'brand') {
        next.camera = true;
        delete next.unit; delete next.mode; delete next.squeeze; delete next.target;
      } else if (key === 'model') {
        next.unit = true;
        delete next.mode; delete next.squeeze; delete next.target;
      } else if (key === 'mode') {
        next.mode = true;
        delete next.squeeze; delete next.target;
      } else if (key === 'squeeze') {
        next.squeeze = true;
      } else if (key === 'delivery') {
        next.target = true;
      }
      // scope90 / verticalLens left expanded — user may toggle multiple
      return next;
    });
  }, [onChange]);

  const advancedSummary = selection.scope90
    ? 'ATLAS_SCOPE_90'
    : selection.verticalLens
      ? 'VERTICAL_LENS'
      : 'STANDARD';

  return (
    <div
      className={clsx(
        'w-full lg:w-[340px] bg-white flex flex-col transition-all duration-500 ease-in-out border-t lg:border-t-0 lg:border-r border-gray-200 shrink-0',
        showControls ? 'max-h-[60vh] lg:max-h-full lg:h-full' : 'h-[80px] lg:h-full'
      )}
    >
      {/* HEADER & MOBILE TOGGLE */}
      <div className="p-6 lg:p-8 flex items-center justify-between shrink-0">
        <div>
          <div className="text-xl font-black tracking-tighter text-gray-900 mb-0.5">
            ANAMORPHIC<span className="text-[#ff4400]">_</span>SIM
          </div>
          <div className="text-[9px] font-bold text-gray-400 tracking-[0.3em] uppercase">
            by Ha Joon Park
          </div>
        </div>

        <button
          onClick={() => setShowControls(!showControls)}
          className="lg:hidden flex flex-col gap-1.5 p-3 group"
          aria-label={showControls ? 'Close controls menu' : 'Open controls menu'}
          aria-expanded={showControls}
          aria-controls="controls-panel"
        >
          <div className={clsx('h-0.5 w-6 bg-gray-900 transition-all duration-300', showControls && 'rotate-45 translate-y-2')} />
          <div className={clsx('h-0.5 w-6 bg-gray-900 transition-all duration-300', showControls && 'opacity-0')} />
          <div className={clsx('h-0.5 w-6 bg-gray-900 transition-all duration-300', showControls && '-rotate-45 -translate-y-2')} />
        </button>
      </div>

      <div
        id="controls-panel"
        role="region"
        aria-label="Camera controls"
        className={clsx(
          'flex-1 overflow-y-auto px-6 lg:px-8 pb-12 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'
        )}
      >
        <ControlSection
          id="camera"
          label="01_Camera System"
          collapsed={!!collapsed.camera && !!selection.brand}
          onToggle={() => toggleSection('camera')}
          summary={selection.brand}
        >
          <div className="grid grid-cols-2 gap-1">
            {brands.map(brand => (
              <TactileButton
                key={brand}
                active={selection.brand === brand}
                onClick={() => handleSelect('brand', brand)}
                label={brand}
              />
            ))}
          </div>
        </ControlSection>

        {selection.brand && (
          <ControlSection
            id="unit"
            label="02_Sensor Unit"
            collapsed={!!collapsed.unit && !!selection.model}
            onToggle={() => toggleSection('unit')}
            summary={selection.model}
          >
            <div className="flex flex-col gap-1">
              {models.map(model => (
                <TactileButton
                  key={model}
                  active={selection.model === model}
                  onClick={() => handleSelect('model', model)}
                  label={model}
                />
              ))}
            </div>
          </ControlSection>
        )}

        {selection.model && (
          <ControlSection
            id="mode"
            label="03_Sensor Mode"
            collapsed={!!collapsed.mode && !!selection.mode}
            onToggle={() => toggleSection('mode')}
            summary={selection.mode}
          >
            <div className="flex flex-col gap-1">
              {modes.map(mode => (
                <TactileButton
                  key={mode.name}
                  active={selection.mode === mode.name}
                  onClick={() => handleSelect('mode', mode.name)}
                  label={mode.name}
                  sublabel={mode.resolution}
                />
              ))}
            </div>
          </ControlSection>
        )}

        {selection.mode && (
          <>
            <ControlSection
              id="squeeze"
              label="04_Lens Squeeze"
              collapsed={!!collapsed.squeeze}
              onToggle={() => toggleSection('squeeze')}
              summary={`${selection.squeeze}\u00D7`}
            >
              <div className="grid grid-cols-3 gap-1">
                {availableSqueezes.map(s => (
                  <TactileButton
                    key={s}
                    active={selection.squeeze === s}
                    onClick={() => handleSelect('squeeze', s)}
                    label={`${s}x`}
                  />
                ))}
              </div>
            </ControlSection>

            <ControlSection
              id="target"
              label="05_Target Ratio"
              collapsed={!!collapsed.target}
              onToggle={() => toggleSection('target')}
              summary={`${selection.delivery.toFixed(2)}:1`}
            >
              <div className="grid grid-cols-2 gap-1">
                {DELIVERY_RATIOS.map(r => (
                  <TactileButton
                    key={r.value}
                    active={selection.delivery === r.value}
                    onClick={() => handleSelect('delivery', r.value)}
                    label={r.label}
                    sublabel={r.sublabel}
                  />
                ))}
              </div>
            </ControlSection>

            <ControlSection
              id="advanced"
              label="90_Advanced Configuration"
              collapsed={!!collapsed.advanced}
              onToggle={() => toggleSection('advanced')}
              summary={advancedSummary}
            >
              <button
                  role="switch"
                  aria-checked={selection.scope90}
                  aria-label="Atlas Scope 90 mode"
                  onClick={() => onChange('scope90', !selection.scope90)}
                  className={clsx(
                      'w-full flex items-center justify-between px-4 py-4 rounded-sm transition-all duration-300',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4400]',
                      selection.scope90
                          ? 'bg-[#ff4400] text-white shadow-[0_10px_20px_rgba(255,68,0,0.2)]'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  )}
              >
                  <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Feature_Activation</span>
                      <span className="text-xs font-bold leading-tight">ATLAS_SCOPE_90</span>
                  </div>
                  <div className={clsx('w-8 h-4 rounded-full relative transition-colors duration-300', selection.scope90 ? 'bg-white/20' : 'bg-gray-300')}>
                      <div className={clsx('absolute top-1 w-2 h-2 rounded-full bg-white transition-all duration-300', selection.scope90 ? 'left-5' : 'left-1')} />
                  </div>
              </button>

              <button
                  role="switch"
                  aria-checked={selection.verticalLens}
                  aria-label="Vertical lens orientation mode"
                  onClick={() => onChange('verticalLens', !selection.verticalLens)}
                  className={clsx(
                      'w-full flex items-center justify-between px-4 py-4 rounded-sm transition-all duration-300 mt-1',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4400]',
                      selection.verticalLens
                          ? 'bg-[#ff4400] text-white shadow-[0_10px_20px_rgba(255,68,0,0.2)]'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  )}
              >
                  <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Feature_Activation</span>
                      <span className="text-xs font-bold leading-tight">VERTICAL_LENS</span>
                  </div>
                  <div className={clsx('w-8 h-4 rounded-full relative transition-colors duration-300', selection.verticalLens ? 'bg-white/20' : 'bg-gray-300')}>
                      <div className={clsx('absolute top-1 w-2 h-2 rounded-full bg-white transition-all duration-300', selection.verticalLens ? 'left-5' : 'left-1')} />
                  </div>
              </button>
            </ControlSection>

            <div className="mb-10">
              <button
                onClick={() => exportConfigCard({
                  camera: { brand: selection.brand, model: selection.model, mode: selection.mode },
                  activeMode: modes.find(m => m.name === selection.mode),
                  squeeze: selection.squeeze,
                  delivery: selection.delivery,
                  scope90: selection.scope90,
                  verticalLens: selection.verticalLens
                })}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4400]"
              >
                <Download size={14} strokeWidth={2.5} />
                <span className="text-[10px] font-black uppercase tracking-widest">Export_Card</span>
              </button>
            </div>
          </>
        )}

        <div className="mt-12 text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-loose">
          designed by ha joon park<br/>
          Inspiration Braun/Rams<br/>
          &copy; 2025
        </div>
      </div>
    </div>
  );
};

export default React.memo(Controls);
