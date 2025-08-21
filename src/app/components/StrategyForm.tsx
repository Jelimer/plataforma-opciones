'use client';

import React, { useState, useEffect } from 'react';
import { Leg } from './StrategyBuilder';

interface StrategyTemplate {
    name: string;
    legs: Omit<Leg, 'id' | 'active' | 'comment' | 'strategyName'>[];
}

interface StrategyFormProps {
  onSaveLeg: (leg: Omit<Leg, 'id' | 'active' | 'comment' | 'strategyName'>) => void;
  editingLeg: Leg | null;
  onCancelEdit: () => void;
  strategyTemplates: StrategyTemplate[];
  onApplyTemplate: (template: StrategyTemplate) => void;
}

type ActionType = 'buy' | 'sell';
type LegType = 'call' | 'put' | 'underlying';

const StrategyForm: React.FC<StrategyFormProps> = ({ onSaveLeg, editingLeg, onCancelEdit, strategyTemplates, onApplyTemplate }) => {
  const [action, setAction] = useState<ActionType>('buy');
  const [type, setType] = useState<LegType>('call');
  const [strike, setStrike] = useState(100);
  const [premium, setPremium] = useState(5);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (editingLeg) {
      setAction(editingLeg.action);
      setType(editingLeg.type);
      setStrike(editingLeg.strike);
      setPremium(editingLeg.premium);
      setQuantity(editingLeg.quantity);
    } else {
      // Reset to default when not editing
      setAction('buy');
      setType('call');
      setStrike(100);
      setPremium(5);
      setQuantity(1);
    }
  }, [editingLeg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (premium < 0 || quantity <= 0 || (type !== 'underlying' && strike < 0)) {
        alert('Por favor, introduce valores numéricos válidos y positivos.');
        return;
    }
    onSaveLeg({ action, type, strike: type === 'underlying' ? 0 : strike, premium, quantity });
    if (!editingLeg) {
        // Reset form only when adding a new leg
        setStrike(100);
        setPremium(5);
        setQuantity(1);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = e.target.value;
    if (templateName) {
        const selectedTemplate = strategyTemplates.find(t => t.name === templateName);
        if (selectedTemplate) {
            onApplyTemplate(selectedTemplate);
        }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md border">
      <h3 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-600 pb-2 mb-4">
        {editingLeg ? 'Editar Pata' : 'Añadir Pata a la Estrategia'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="leg-action" className="block text-sm font-medium text-gray-700">Acción</label>
          <select id="leg-action" value={action} onChange={(e) => setAction(e.target.value as ActionType)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            <option value="buy">Comprar</option>
            <option value="sell">Vender</option>
          </select>
        </div>
        <div>
          <label htmlFor="leg-type" className="block text-sm font-medium text-gray-700">Tipo</label>
          <select id="leg-type" value={type} onChange={(e) => setType(e.target.value as LegType)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            <option value="call">Call</option>
            <option value="put">Put</option>
            <option value="underlying">Subyacente</option>
          </select>
        </div>
        {type !== 'underlying' && (
          <div>
            <label htmlFor="leg-strike" className="block text-sm font-medium text-gray-700">Strike</label>
            <input type="number" id="leg-strike" value={strike} onChange={(e) => setStrike(parseFloat(e.target.value))} step="1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
        )}
        <div>
          <label htmlFor="leg-premium" className="block text-sm font-medium text-gray-700">{type === 'underlying' ? 'Precio de Entrada' : 'Prima'}</label>
          <input type="number" id="leg-premium" value={premium} onChange={(e) => setPremium(parseFloat(e.target.value))} step="0.1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="leg-quantity" className="block text-sm font-medium text-gray-700">Cantidad</label>
          <input type="number" id="leg-quantity" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} min="1" step="1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out">
            {editingLeg ? 'Actualizar Pata' : 'Añadir Pata'}
        </button>
        {editingLeg && (
            <button type="button" onClick={onCancelEdit} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out">
                Cancelar
            </button>
        )}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-600 pb-2 mb-4">Cargar Plantilla</h3>
        <select onChange={handleTemplateChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            <option value="">Seleccionar Plantilla...</option>
            {strategyTemplates.map(template => (
                <option key={template.name} value={template.name}>{template.name}</option>
            ))}
        </select>
      </div>
    </form>
  );
};

export default StrategyForm;