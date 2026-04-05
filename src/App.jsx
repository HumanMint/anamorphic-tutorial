import React, { useState, useEffect, useMemo, useCallback, Component } from 'react';
import Controls from './components/Controls';
import Simulator from './components/Simulator';
import { loadCameraData } from './utils/dataLoader';
import { BREAKPOINTS } from './utils/constants';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#f2f2f2] flex flex-col items-center justify-center p-10 text-center">
          <h1 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-2">Application Error</h1>
          <p className="text-xs text-gray-400 max-w-md mb-6">
            An unexpected error occurred. Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#1a1a1a] text-white text-xs font-bold rounded-sm uppercase tracking-widest"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [selection, setSelection] = useState({
    brand: '',
    model: '',
    mode: '',
    squeeze: 1.0,
    delivery: 2.39,
    scope90: false
  });

  useEffect(() => {
    loadCameraData()
      .then(loadedData => {
        setData(loadedData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load camera data", err);
        setError(err);
        setLoading(false);
      });
  }, []);

  const handleChange = useCallback((key, value) => {
    setSelection(prev => {
      const newSelection = { ...prev, [key]: value };

      if (key === 'brand') {
        newSelection.model = '';
        newSelection.mode = '';
        newSelection.squeeze = 1.0;
        newSelection.scope90 = false;
      }
      if (key === 'model') {
        newSelection.mode = '';
        newSelection.squeeze = 1.0;
        newSelection.scope90 = false;
      }
      if (key === 'mode') {
         newSelection.squeeze = 1.0;
         newSelection.scope90 = false;
      }

      return newSelection;
    });

    // Auto-collapse controls on mobile after mode selection
    if (key === 'mode' && window.innerWidth < BREAKPOINTS.LG) {
      setShowControls(false);
    }
  }, []);

  const activeMode = useMemo(() => {
    if (!data || !selection.brand || !selection.model || !selection.mode) return null;
    try {
        const brandModels = data[selection.brand];
        if (!brandModels) return null;
        const modelModes = brandModels[selection.model];
        if (!modelModes) return null;
        return modelModes.find(m => m.name === selection.mode);
    } catch (e) {
        console.error("Error finding active mode:", e);
        return null;
    }
  }, [data, selection]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#f2f2f2] flex flex-col items-center justify-center gap-4">
        <div className="text-xl font-black tracking-tighter text-gray-900">
          ANAMORPHIC<span className="text-[#ff4400]">_</span>SIM
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#ff4400] loading-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <div className="text-[9px] font-bold text-gray-400 tracking-[0.3em] uppercase">
          Loading Camera Database
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-[#f2f2f2] flex flex-col items-center justify-center p-8 text-center">
        <div className="text-sm font-black uppercase tracking-widest text-gray-900 mb-2">
          Data Unavailable
        </div>
        <div className="text-xs text-gray-400 max-w-md mb-6">
          Camera database could not be loaded. Check your connection and try again.
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[#1a1a1a] text-white text-xs font-bold rounded-sm uppercase tracking-widest"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
        <div className="flex flex-col-reverse lg:flex-row h-screen w-screen bg-[#f2f2f2] text-gray-800 font-sans overflow-hidden">
        <Controls
            data={data}
            selection={selection}
            onChange={handleChange}
            showControls={showControls}
            setShowControls={setShowControls}
        />
        <Simulator
            activeMode={activeMode}
            squeeze={selection.squeeze}
            delivery={selection.delivery}
            scope90={selection.scope90}
        />
        </div>
    </ErrorBoundary>
  );
}

export default App;
