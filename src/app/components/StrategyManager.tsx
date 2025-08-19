'use client';

import React, { useState } from 'react';
import { SavedStrategy } from './StrategyBuilder';

interface StrategyManagerProps {
  savedStrategies: SavedStrategy[];
  onSaveCurrent: () => void;
  onLoadStrategy: (strategy: SavedStrategy) => void;
  onDeleteStrategy: (name: string) => void;
}

const StrategyManager: React.FC<StrategyManagerProps> = ({ savedStrategies, onSaveCurrent, onLoadStrategy, onDeleteStrategy }) => {
  const [selectedStrategyName, setSelectedStrategyName] = useState('');

  const handleLoad = () => {
    if (selectedStrategyName) {
      const strategyToLoad = savedStrategies.find(s => s.name === selectedStrategyName);
      if (strategyToLoad) {
        onLoadStrategy(strategyToLoad);
      }
    } else {
      alert("Por favor, selecciona una estrategia para cargar.");
    }
  };

  const handleDelete = () => {
    if (selectedStrategyName) {
      onDeleteStrategy(selectedStrategyName);
      setSelectedStrategyName(''); // Clear selection after deletion
    } else {
      alert("Por favor, selecciona una estrategia para eliminar.");
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-md border">
      <h3 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-600 pb-2 mb-4">Gestionar Estrategias Guardadas</h3>
      
      <div className="mb-4">
        <button onClick={onSaveCurrent} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out">
          Guardar Estrategia Actual
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="load-strategy" className="block text-sm font-medium text-gray-700">Cargar / Eliminar Estrategia:</label>
        <select 
          id="load-strategy" 
          value={selectedStrategyName} 
          onChange={(e) => setSelectedStrategyName(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">-- Seleccionar --</option>
          {savedStrategies.map(s => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
        <div className="flex gap-2 mt-2">
          <button onClick={handleLoad} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out text-sm">
            Cargar
          </button>
          <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out text-sm">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyManager;
