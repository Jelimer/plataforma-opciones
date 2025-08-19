'use client';

import React, { useState, useEffect } from 'react';
import StrategyForm from './StrategyForm';
import LegsList from './LegsList';
import PayoffChart from './PayoffChart';
import Summary from './Summary';
import PnLTable from './PnLTable';
import StrategyManager from './StrategyManager';
import GreeksDisplay from './GreeksDisplay';

// Main data structures
export interface Leg {
  id: number;
  action: 'buy' | 'sell';
  type: 'call' | 'put' | 'underlying';
  strike: number;
  premium: number;
  quantity: number;
  active: boolean;
  comment?: string;
  groupId: string;
}

export interface GroupSettings {
    name: string;
    isEnabled: boolean;
}

export interface ModelParameters {
    timeToExpiry: number;
    riskFreeRate: number;
    volatility: number;
}

export interface SavedStrategy {
    name: string;
    legs: Leg[];
    underlyingPrice: number;
    groupSettings: Record<string, GroupSettings>;
    modelParameters: ModelParameters;
}

// Pre-defined strategy templates
const strategyTemplates: StrategyTemplate[] = [
    {
        name: "Long Call",
        legs: [{ action: 'buy', type: 'call', strike: 100, premium: 5, quantity: 1, groupId: '1' }]
    },
    {
        name: "Long Put",
        legs: [{ action: 'buy', type: 'put', strike: 100, premium: 5, quantity: 1, groupId: '1' }]
    },
    {
        name: "Covered Call",
        legs: [
            { action: 'buy', type: 'underlying', strike: 0, premium: 100, quantity: 1, groupId: '1' },
            { action: 'sell', type: 'call', strike: 105, premium: 2, quantity: 1, groupId: '1' }
        ]
    },
    {
        name: "Long Straddle",
        legs: [
            { action: 'buy', type: 'call', strike: 100, premium: 3, quantity: 1, groupId: '1' },
            { action: 'buy', type: 'put', strike: 100, premium: 3, quantity: 1, groupId: '1' }
        ]
    },
    {
        name: "Iron Condor",
        legs: [
            { action: 'sell', type: 'put', strike: 95, premium: 2, quantity: 1, groupId: '1' },
            { action: 'buy', type: 'put', strike: 90, premium: 1, quantity: 1, groupId: '1' },
            { action: 'sell', type: 'call', strike: 105, premium: 2, quantity: 1, groupId: '1' },
            { action: 'buy', type: 'call', strike: 110, premium: 1, quantity: 1, groupId: '1' }
        ]
    }
];

interface StrategyTemplate {
    name: string;
    legs: Omit<Leg, 'id' | 'active' | 'comment'>[];
}

const StrategyBuilder: React.FC = () => {
  // Core strategy state
  const [strategyName, setStrategyName] = useState('Mi Estrategia');
  const [legs, setLegs] = useState<Leg[]>([]);
  const [underlyingPrice, setUnderlyingPrice] = useState(100);
  const [editingLeg, setEditingLeg] = useState<Leg | null>(null);
  
  // Group settings state
  const [groupSettings, setGroupSettings] = useState<Record<string, GroupSettings>>({});

  // Black-Scholes model parameters state
  const [modelParameters, setModelParameters] = useState<ModelParameters>({ 
    timeToExpiry: 30, 
    riskFreeRate: 5, 
    volatility: 20 
  });

  // Saved strategies state
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);

  // Load all data from localStorage on initial render
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('optionsCurrentStrategy');
      if (savedState) {
        const { name, legs, price, groups, params } = JSON.parse(savedState);
        if (name) setStrategyName(name);
        if (legs) setLegs(legs);
        if (price) setUnderlyingPrice(price);
        if (groups) setGroupSettings(groups);
        if (params) setModelParameters(params);
      }
      const savedAll = localStorage.getItem('optionsSavedStrategies');
      if (savedAll) setSavedStrategies(JSON.parse(savedAll));
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        localStorage.removeItem('optionsCurrentStrategy');
        localStorage.removeItem('optionsSavedStrategies');
    }
  }, []);

  // Sync group settings with legs to add new groups automatically
  useEffect(() => {
    const newSettings = { ...groupSettings };
    let needsUpdate = false;
    legs.forEach(leg => {
        if (!newSettings[leg.groupId]) {
            newSettings[leg.groupId] = { name: `Grupo ${leg.groupId}`, isEnabled: true };
            needsUpdate = true;
        }
    });
    if (needsUpdate) setGroupSettings(newSettings);
  }, [legs, groupSettings]);

  // Save current strategy to localStorage whenever any part of it changes
  useEffect(() => {
    const currentState = {
        name: strategyName,
        legs: legs,
        price: underlyingPrice,
        groups: groupSettings,
        params: modelParameters
    };
    localStorage.setItem('optionsCurrentStrategy', JSON.stringify(currentState));
    localStorage.setItem('optionsSavedStrategies', JSON.stringify(savedStrategies));
  }, [strategyName, legs, underlyingPrice, groupSettings, modelParameters, savedStrategies]);

  // --- Handlers ---
  const handleSaveLeg = (legData: Omit<Leg, 'id' | 'active' | 'comment'>) => {
    if (editingLeg) {
      setLegs(legs.map(l => l.id === editingLeg.id ? { ...editingLeg, ...legData } : l));
      setEditingLeg(null);
    } else {
      setLegs([...legs, { ...legData, id: Date.now(), active: true, comment: '' }]);
    }
  };

  const updateLeg = (id: number, updatedProperties: Partial<Omit<Leg, 'id'>>) => {
    setLegs(legs.map(leg => leg.id === id ? { ...leg, ...updatedProperties } : leg));
  };

  const handleUpdateGroupSettings = (groupId: string, newSettings: Partial<GroupSettings>) => {
    setGroupSettings(prev => ({ ...prev, [groupId]: { ...prev[groupId], ...newSettings } }));
  };

  const handleSetEditingLeg = (leg: Leg) => setEditingLeg(leg);
  const handleCancelEdit = () => setEditingLeg(null);
  const deleteLeg = (id: number) => setLegs(legs.filter(leg => leg.id !== id));

  const applyTemplate = (templateLegs: Omit<Leg, 'id' | 'active' | 'comment'>[]) => {
    const newLegs: Leg[] = templateLegs.map(leg => ({ ...leg, id: Date.now() + Math.random(), active: true, comment: '' }));
    setLegs(newLegs);
    setEditingLeg(null);
    setStrategyName("Estrategia de Plantilla");
    const newSettings: Record<string, GroupSettings> = {};
    newLegs.forEach(leg => {
        if (!newSettings[leg.groupId]) {
            newSettings[leg.groupId] = { name: `Grupo ${leg.groupId}`, isEnabled: true };
        }
    });
    setGroupSettings(newSettings);
  };

  const saveCurrentStrategy = () => {
    const name = prompt("Introduce un nombre para guardar la estrategia:", strategyName);
    if (name && name.trim() !== '') {
        const newSavedStrategy: SavedStrategy = { name: name.trim(), legs, underlyingPrice, groupSettings, modelParameters };
        setSavedStrategies(prev => {
            const existingIndex = prev.findIndex(s => s.name === name.trim());
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = newSavedStrategy;
                return updated;
            } else {
                return [...prev, newSavedStrategy];
            }
        });
        alert(`Estrategia '${name.trim()}' guardada.`);
    }
  };

  const loadStrategy = (strategyToLoad: SavedStrategy) => {
    setStrategyName(strategyToLoad.name);
    setLegs(strategyToLoad.legs);
    setUnderlyingPrice(strategyToLoad.underlyingPrice);
    setGroupSettings(strategyToLoad.groupSettings || {});
    setModelParameters(strategyToLoad.modelParameters || { timeToExpiry: 30, riskFreeRate: 5, volatility: 20 });
    setEditingLeg(null);
    alert(`Estrategia '${strategyToLoad.name}' cargada.`);
  };

  const deleteStrategy = (name: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la estrategia '${name}'?`)) {
        setSavedStrategies(prev => prev.filter(s => s.name !== name));
        alert(`Estrategia '${name}' eliminada.`);
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 w-full gap-4">
      <div className="w-full md:max-w-md p-4 bg-white shadow-lg rounded-lg flex flex-col gap-4">
        <div className="bg-gray-50 p-4 rounded-md border">
            <h3 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-600 pb-2">Datos de la Estrategia</h3>
            <div className="mt-4">
                <label htmlFor="strategy-name" className="text-sm font-medium text-gray-700">Nombre de la Estrategia</label>
                <input 
                    type="text" 
                    id="strategy-name"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="Ej: Iron Condor GGAL"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
            </div>
        </div>
        <StrategyForm 
            onSaveLeg={handleSaveLeg} 
            editingLeg={editingLeg}
            onCancelEdit={handleCancelEdit}
            strategyTemplates={strategyTemplates}
            onApplyTemplate={applyTemplate}
        />
        <StrategyManager
            savedStrategies={savedStrategies}
            onSaveCurrent={saveCurrentStrategy}
            onLoadStrategy={loadStrategy}
            onDeleteStrategy={deleteStrategy}
        />
        <LegsList 
            legs={legs} 
            strategyName={strategyName} 
            onDeleteLeg={deleteLeg} 
            onEditLeg={handleSetEditingLeg}
            onUpdateLeg={updateLeg}
        />
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white p-4 shadow-lg rounded-lg">
            <div className="mb-4">
                <label htmlFor="underlying-price" className="block text-sm font-medium text-gray-700">Precio Actual del Subyacente</label>
                <input 
                    type="number" 
                    id="underlying-price"
                    value={underlyingPrice}
                    onChange={(e) => setUnderlyingPrice(parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full max-w-xs px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
            </div>
            <PayoffChart legs={legs} underlyingPrice={underlyingPrice} />
        </div>
        <div className="bg-white p-4 shadow-lg rounded-lg">
            <Summary legs={legs} underlyingPrice={underlyingPrice} />
        </div>
        <PnLTable 
            legs={legs} 
            underlyingPrice={underlyingPrice} 
            groupSettings={groupSettings}
            onUpdateGroupSettings={handleUpdateGroupSettings}
            modelParameters={modelParameters}
        />
        <GreeksDisplay 
            legs={legs} 
            underlyingPrice={underlyingPrice} 
            modelParameters={modelParameters}
            onModelParametersChange={setModelParameters}
        />
      </div>
    </div>
  );
};

export default StrategyBuilder;