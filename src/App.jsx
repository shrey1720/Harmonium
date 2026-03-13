import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Volume2, Maximize2, Wind, Camera } from 'lucide-react';
import engine from './audio/HarmoniumEngine';
import { useBellows } from './hooks/useBellows';

const Harmonium = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { pressure, videoRef } = useBellows(isCameraActive);
  const [activeKeys, setActiveKeys] = useState(new Set());
  
  // Harmonium Key Mapping
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2', 'D2', 'E2'];
  const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#', 'C#2', 'D#2'];
  
  const keyToNote = {
    'a': 'C', 'w': 'C#', 's': 'D', 'e': 'D#', 'd': 'E', 'f': 'F', 
    't': 'F#', 'g': 'G', 'y': 'G#', 'h': 'A', 'u': 'A#', 'j': 'B',
    'k': 'C2', 'o': 'C#2', 'l': 'D2', 'p': 'D#2', ';': 'E2'
  };

  // Use manual control if camera is off
  const [manualPressure, setManualPressure] = useState(0.5);
  const effectivePressure = isCameraActive ? pressure : manualPressure;

  useEffect(() => {
    engine.setPressure(effectivePressure);
  }, [effectivePressure]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const note = keyToNote[e.key];
      if (note && !e.repeat) {
        setActiveKeys(prev => new Set([...prev, note]));
        engine.startNote(note);
      }
    };
    const handleKeyUp = (e) => {
      const note = keyToNote[e.key];
      if (note) {
        setActiveKeys(prev => {
          const next = new Set(prev);
          next.delete(note);
          return next;
        });
        engine.stopNote(note);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="harmonium-container">
      <header className="harmonium-header">
        <div className="brand">
          <Wind size={24} className="icon-glow" />
          <h1>HARMONIUM<span>PRO</span></h1>
        </div>
        <div className="controls">
          <div className="pressure-meter">
            <div className="meter-label">{isCameraActive ? 'AUTO BELLOWS (CAM)' : 'MANUAL BELLOWS'}</div>
            <div className="meter-bar">
              <motion.div 
                className="meter-fill"
                animate={{ width: `${effectivePressure * 100}%` }}
              />
            </div>
          </div>
          <button 
            className={`icon-btn ${isCameraActive ? 'active-cam' : ''}`}
            onClick={() => setIsCameraActive(!isCameraActive)}
          >
            <Camera size={20} />
          </button>
          <button className="icon-btn"><Volume2 size={20} /></button>
          <button className="icon-btn"><Settings size={20} /></button>
        </div>
      </header>

      <main className="harmonium-body">
        {/* Hidden Video for tracking */}
        <video 
          ref={videoRef} 
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }} 
        />
        
        <div className="wood-grill">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="grill-slot" />
          ))}
        </div>

        <div className="keys-section">
          {!isCameraActive && (
             <div className="bellows-slider">
                <input 
                  type="range" 
                  min="0" max="1" step="0.01" 
                  value={manualPressure} 
                  onChange={(e) => setManualPressure(parseFloat(e.target.value))}
                />
                <span>Adjust Bellows</span>
             </div>
          )}
          <div className="keyboard">
            {whiteKeys.map(note => (
              <div 
                key={note} 
                className={`key white ${activeKeys.has(note) ? 'active' : ''}`}
                onMouseDown={() => {
                  setActiveKeys(prev => new Set([...prev, note]));
                  engine.startNote(note);
                }}
                onMouseUp={() => {
                  setActiveKeys(prev => {
                    const next = new Set(prev);
                    next.delete(note);
                    return next;
                  });
                  engine.stopNote(note);
                }}
              >
                <span className="key-label">{note}</span>
              </div>
            ))}
            <div className="black-keys">
              {blackKeys.map((note, i) => (
                <div 
                  key={note} 
                  className={`key black ${activeKeys.has(note) ? 'active' : ''}`}
                  style={{ left: `${(i < 2 ? i + 0.7 : i < 5 ? i + 1.7 : i + 2.7) * (100 / 10)}%` }}
                  onMouseDown={() => {
                    setActiveKeys(prev => new Set([...prev, note]));
                    engine.startNote(note);
                  }}
                  onMouseUp={() => {
                    setActiveKeys(prev => {
                      const next = new Set(prev);
                      next.delete(note);
                      return next;
                    });
                    engine.stopNote(note);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="harmonium-footer">
        <div className="bellows-visualization">
          <motion.div 
            className="bellows-fold"
            animate={{ 
              scaleX: 1 + (Math.sin(Date.now() / 500) * effectivePressure * 0.1),
              opacity: 0.5 + (effectivePressure * 0.5)
            }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </div>
      </footer>
    </div>
  );
};


export default Harmonium;
