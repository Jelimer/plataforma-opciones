'use client';

import React, { useMemo } from 'react';
import { Leg, ModelParameters } from './StrategyBuilder';
import {
  calculateDelta,
  calculateGamma,
  calculateTheta,
  calculateVega
} from '../utils/black-scholes';
import { formatNumber } from '../utils/formatting';

interface GreeksDisplayProps {
  legs: Leg[];
  underlyingPrice: number;
  modelParameters: ModelParameters;
  onModelParametersChange: (newParams: ModelParameters) => void;
}

const GreeksDisplay: React.FC<GreeksDisplayProps> = ({ legs, underlyingPrice, modelParameters, onModelParametersChange }) => {

  const combinedGreeks = useMemo(() => {
    const activeLegs = legs.filter(leg => leg.active);
    const t = modelParameters.timeToExpiry / 365;
    const r = modelParameters.riskFreeRate / 100;
    const v = modelParameters.volatility / 100;

    let totalDelta = 0, totalGamma = 0, totalTheta = 0, totalVega = 0;

    activeLegs.forEach(leg => {
      if (leg.type === 'underlying') {
        totalDelta += leg.quantity * (leg.action === 'buy' ? 1 : -1);
        return;
      }
      const multiplier = leg.quantity * (leg.action === 'buy' ? 1 : -1);
      totalDelta += calculateDelta(leg.type, underlyingPrice, leg.strike, r, v, t) * multiplier;
      totalGamma += calculateGamma(underlyingPrice, leg.strike, r, v, t) * multiplier;
      totalTheta += calculateTheta(leg.type, underlyingPrice, leg.strike, r, v, t) * multiplier;
      totalVega += calculateVega(underlyingPrice, leg.strike, r, v, t) * multiplier;
    });

    return { delta: totalDelta, gamma: totalGamma, theta: totalTheta, vega: totalVega };
  }, [legs, underlyingPrice, modelParameters]);

  const handleParamChange = (param: keyof ModelParameters, value: string) => {
    onModelParametersChange({ ...modelParameters, [param]: parseFloat(value) || 0 });
  };

  return (
    <div className="mt-6 bg-white p-4 shadow-lg rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-600 pb-2 mb-4">Parámetros del Modelo y Griegas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-md border">
        <div>
          <label htmlFor="time-to-expiry" className="block text-sm font-medium text-gray-700">Días a Vencimiento (T)</label>
          <input 
            type="number"
            id="time-to-expiry"
            value={modelParameters.timeToExpiry}
            onChange={(e) => handleParamChange('timeToExpiry', e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="risk-free-rate" className="block text-sm font-medium text-gray-700">Tasa Libre de Riesgo (%)</label>
          <input 
            type="number"
            id="risk-free-rate"
            value={modelParameters.riskFreeRate}
            onChange={(e) => handleParamChange('riskFreeRate', e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="volatility" className="block text-sm font-medium text-gray-700">Volatilidad Implícita (%)</label>
          <input 
            type="number"
            id="volatility"
            value={modelParameters.volatility}
            onChange={(e) => handleParamChange('volatility', e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {/* Greeks Display Boxes */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900">Delta</div>
          <div className={`text-2xl font-bold mt-1 ${combinedGreeks.delta > 0 ? 'text-green-600' : combinedGreeks.delta < 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {formatNumber(combinedGreeks.delta, 4)}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900">Gamma</div>
          <div className={`text-2xl font-bold mt-1 ${combinedGreeks.gamma > 0 ? 'text-green-600' : combinedGreeks.gamma < 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {formatNumber(combinedGreeks.gamma, 4)}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900">Theta</div>
          <div className={`text-2xl font-bold mt-1 ${combinedGreeks.theta > 0 ? 'text-green-600' : combinedGreeks.theta < 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {formatNumber(combinedGreeks.theta, 4)}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900">Vega</div>
          <div className={`text-2xl font-bold mt-1 ${combinedGreeks.vega > 0 ? 'text-green-600' : combinedGreeks.vega < 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {formatNumber(combinedGreeks.vega, 4)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GreeksDisplay;