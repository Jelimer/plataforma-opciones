'use client';

import { Leg } from '../components/StrategyBuilder';

const CONTRACT_SIZE = 100;

export const calculatePayoff = (price: number, leg: Leg): number => {
  let payoff = 0;
  if (leg.type === 'underlying') {
    const entryPrice = leg.premium;
    payoff = leg.action === 'buy' ? (price - entryPrice) : (entryPrice - price);
    // Multiply by quantity but not contract size for underlying
    return payoff * leg.quantity;
  } else {
    let intrinsicValue = 0;
    if (leg.type === 'call') {
      intrinsicValue = Math.max(0, price - leg.strike);
    } else { // put
      intrinsicValue = Math.max(0, leg.strike - price);
    }
    payoff = leg.action === 'buy' ? (intrinsicValue - leg.premium) : (leg.premium - intrinsicValue);
    // For options, multiply by quantity AND contract size
    return payoff * leg.quantity * CONTRACT_SIZE;
  }
};
