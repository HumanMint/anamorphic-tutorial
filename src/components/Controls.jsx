import React, { useMemo } from 'react';

const ControlSection = ({ label, children }) => (
  <div className="mb-10">
    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 border-b border-gray-100 pb-2">
      {label}
    </div>
    <div className="flex flex-col gap-1">
      {children}
    </div>
  </div>
);

const TactileButton = ({ active, onClick, children, label, sublabel }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center justify-between px-4 py-3 rounded-sm transition-all duration-200 text-left
      ${active 
        ? 'bg-[#1a1a1a] text-white' 
        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}
    `}
  >
    <div className="flex flex-col">
      <span className="text-xs font-bold leading-tight">{label}</span>
      {sublabel && <span className={`text-[9px] ${active ? 'text-gray-400' : 'text-gray-400'} font-mono mt-0.5`}>{sublabel}</span>}
    </div>
    {active && <div className="w-1.5 h-1.5 rounded-full bg-[#ff4400]" />}
  </button>
);

const Controls = ({ data, selection, onChange }) => {
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

  const deliveryRatios = [1.78, 1.90, 2.39, 2.76];

  return (
    <div className="w-[340px] bg-white h-full flex flex-col p-8 overflow-y-auto">
      <div className="mb-12">
        <div className="text-xl font-black tracking-tighter text-gray-900 mb-1">
          ANAMORPHIC<span className="text-[#ff4400]">_</span>SIM
        </div>
        <div className="text-[9px] font-bold text-gray-400 tracking-[0.3em] uppercase">
          by Ha Joon Park
        </div>
      </div>

      <ControlSection label="01_Camera System">
        <div className="grid grid-cols-2 gap-1">
          {brands.map(brand => (
            <TactileButton 
              key={brand}
              active={selection.brand === brand}
              onClick={() => onChange('brand', brand)}
              label={brand}
            />
          ))}
        </div>
      </ControlSection>

      {selection.brand && (
        <ControlSection label="02_Sensor Unit">
          <div className="flex flex-col gap-1">
            {models.map(model => (
              <TactileButton 
                key={model}
                active={selection.model === model}
                onClick={() => onChange('model', model)}
                label={model}
              />
            ))}
          </div>
        </ControlSection>
      )}

      {selection.model && (
        <ControlSection label="03_Sensor Mode">
          <div className="flex flex-col gap-1">
            {modes.map(mode => (
              <TactileButton 
                key={mode.name}
                active={selection.mode === mode.name}
                onClick={() => onChange('mode', mode.name)}
                label={mode.name}
                sublabel={mode.resolution}
              />
            ))}
          </div>
        </ControlSection>
      )}

      {selection.mode && (
        <>
          <ControlSection label="04_Lens Squeeze">
            <div className="grid grid-cols-3 gap-1">
              {availableSqueezes.map(s => (
                <TactileButton 
                  key={s}
                  active={selection.squeeze === s}
                  onClick={() => onChange('squeeze', s)}
                  label={`${s}x`}
                />
              ))}
            </div>
          </ControlSection>

          <ControlSection label="05_Output Crop">
            <div className="grid grid-cols-2 gap-1">
              {deliveryRatios.map(r => (
                <TactileButton 
                  key={r}
                  active={selection.delivery === r}
                  onClick={() => onChange('delivery', r)}
                  label={`${r}:1`}
                  sublabel={r === 2.39 ? 'SCOPE' : r === 1.78 ? 'HD' : ''}
                />
              ))}
            </div>
          </ControlSection>

          <ControlSection label="90_Advanced Configuration">
            <button
                onClick={() => onChange('scope90', !selection.scope90)}
                className={`
                    w-full flex items-center justify-between px-4 py-4 rounded-sm transition-all duration-300
                    ${selection.scope90 
                        ? 'bg-[#ff4400] text-white shadow-[0_10px_20px_rgba(255,68,0,0.2)]' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                `}
            >
                <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Feature_Activation</span>
                    <span className="text-xs font-bold leading-tight">ATLAS_SCOPE_90</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${selection.scope90 ? 'bg-white/20' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all duration-300 ${selection.scope90 ? 'left-5' : 'left-1'}`} />
                </div>
            </button>
          </ControlSection>
        </>
      )}

      <div className="mt-auto pt-10 text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-loose">
        designed by ha joon park<br/>
        Inspiration Braun/Rams<br/>
        © 2025
      </div>
    </div>
  );
};

export default Controls;