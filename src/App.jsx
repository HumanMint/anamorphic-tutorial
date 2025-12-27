import React, { useState, useEffect, useMemo, Component } from 'react';
import Controls from './components/Controls';
import Simulator from './components/Simulator';
import { loadCameraData } from './utils/dataLoader';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#080808] flex flex-col items-center justify-center p-10 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Application Error</h1>
          <pre className="bg-[#111] p-4 text-red-500 rounded border border-gray-800 text-sm overflow-auto max-w-full">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-[#ff3b30] text-white rounded-full font-bold"
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
        console.log("Data loaded successfully:", Object.keys(loadedData).length, "brands found");
        setData(loadedData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load camera data", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (key, value) => {
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
  };

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
    return <div className="h-screen w-screen bg-[#f5f5f5] flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest">Initialising System...</div>;
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
