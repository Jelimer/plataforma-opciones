'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { Leg } from './StrategyBuilder';
import { gsap } from 'gsap';
import { calculatePayoff } from '../utils/payoff';
import { formatCurrency, formatNumber } from '../utils/formatting';

interface SummaryProps {
  legs: Leg[];
  underlyingPrice: number;
}

const Summary: React.FC<SummaryProps> = ({ legs, underlyingPrice }) => {
  const maxProfitRef = useRef<HTMLDivElement>(null);
  const maxLossRef = useRef<HTMLDivElement>(null);
  const payoffRef = useRef<HTMLDivElement>(null);
  const breakevenRef = useRef<HTMLDivElement>(null);

  const summaryData = useMemo(() => {
    const activeLegs = legs.filter(leg => leg.active);
    if (activeLegs.length === 0) {
      return { maxProfit: 'N/A', maxLoss: 'N/A', breakevens: 'N/A', payoffAtPrice: 'N/A', returnOnRisk: null, isLoss: false, isPayoffAtPricePositive: false, isPayoffAtPriceNegative: false };
    }

    const strikes = activeLegs.map(l => l.strike).filter(s => s > 0);
    const assetPrices = activeLegs.filter(l => l.type === 'underlying').map(l => l.premium);
    const allRelevantPrices = [...strikes, ...assetPrices];

    const minPoint = allRelevantPrices.length > 0 ? Math.min(...allRelevantPrices) : 80;
    const maxPoint = allRelevantPrices.length > 0 ? Math.max(...allRelevantPrices) : 120;
    const range = Math.max(40, maxPoint - minPoint);

    const priceStart = Math.max(0, minPoint - range * 1.5);
    const priceEnd = maxPoint + range * 1.5;

    const prices: number[] = [];
    const step = (priceEnd - priceStart) / 500;
    if (step <= 0) {
        return { maxProfit: 'N/A', maxLoss: 'N/A', breakevens: 'N/A', payoffAtPrice: 'N/A', returnOnRisk: null, isLoss: false, isPayoffAtPricePositive: false, isPayoffAtPriceNegative: false };
    }
    for (let p = priceStart; p <= priceEnd; p += step) {
      prices.push(p);
    }

    const totalPayoffs = prices.map(price =>
      activeLegs.reduce((total, leg) => total + calculatePayoff(price, leg), 0)
    );

    const maxProfitValue = Math.max(...totalPayoffs);
    const minLossValue = Math.min(...totalPayoffs);

    const isProfitUnlimited = totalPayoffs[totalPayoffs.length - 1] > maxProfitValue || totalPayoffs[0] > maxProfitValue;
    const isLossUnlimited = totalPayoffs[totalPayoffs.length - 1] < minLossValue || totalPayoffs[0] < minLossValue;

    let returnOnRisk = null;
    if (!isProfitUnlimited && !isLossUnlimited && minLossValue < 0) {
        returnOnRisk = (maxProfitValue / Math.abs(minLossValue)) * 100;
    }

    const breakevens: number[] = [];
    for (let i = 1; i < totalPayoffs.length; i++) {
      const prevPayoff = totalPayoffs[i - 1];
      const currPayoff = totalPayoffs[i];
      if (Math.sign(prevPayoff) !== Math.sign(currPayoff)) {
        const p1 = { x: prices[i - 1], y: prevPayoff };
        const p2 = { x: prices[i], y: currPayoff };
        const breakeven = p1.x - p1.y * (p2.x - p1.x) / (p2.y - p1.y);
        if (breakevens.every(b => Math.abs(b - breakeven) > step * 2)) {
            breakevens.push(breakeven);
        }
      }
    }
    
    const payoffAtPrice = activeLegs.reduce((total, leg) => total + calculatePayoff(underlyingPrice, leg), 0);

    return {
      maxProfit: isProfitUnlimited ? 'Ilimitado' : formatCurrency(maxProfitValue),
      maxLoss: isLossUnlimited ? 'Ilimitada' : formatCurrency(minLossValue),
      breakevens: breakevens.length > 0 ? breakevens.map(b => formatCurrency(b)).join(' y ') : 'Ninguno en el rango',
      payoffAtPrice: formatCurrency(payoffAtPrice),
      returnOnRisk: returnOnRisk,
      isLoss: !isLossUnlimited && minLossValue < 0,
      isPayoffAtPricePositive: payoffAtPrice > 0,
      isPayoffAtPriceNegative: payoffAtPrice < 0,
    };
  }, [legs, underlyingPrice]);

  useEffect(() => {
    const refs = [maxProfitRef, maxLossRef, payoffRef, breakevenRef];
    gsap.fromTo(refs.map(r => r.current), 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
    );
  }, [summaryData]);

  return (
    <div>
      <h3 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-600 pb-2 mb-4">Análisis de la Estrategia</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div ref={maxProfitRef} className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-600">Máximo Beneficio</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{summaryData.maxProfit}</div>
          {summaryData.returnOnRisk !== null && (
            <div className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full mt-2 inline-block">
              {formatNumber(summaryData.returnOnRisk, 1)}% sobre Riesgo Máx
            </div>
          )}
        </div>
        <div ref={maxLossRef} className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-600">Máxima Pérdida</div>
          <div className={`text-2xl font-bold mt-1 ${summaryData.isLoss ? 'text-red-600' : 'text-gray-700'}`}>{summaryData.maxLoss}</div>
        </div>
        <div ref={payoffRef} className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-600">Payoff al Precio Actual</div>
          <div className={`text-2xl font-bold mt-1 ${summaryData.isPayoffAtPricePositive ? 'text-green-600' : summaryData.isPayoffAtPriceNegative ? 'text-red-600' : 'text-gray-700'}`}>{summaryData.payoffAtPrice}</div>
        </div>
      </div>
      <div ref={breakevenRef} className="bg-gray-50 p-4 rounded-lg mt-4 text-center">
        <div className="text-sm font-medium text-gray-600">Puntos de Equilibrio (Breakeven)</div>
        <div className="text-xl font-bold text-gray-800 mt-1">{summaryData.breakevens}</div>
      </div>
    </div>
  );
};

export default Summary;