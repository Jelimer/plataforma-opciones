'use client';

import { Leg } from '../components/StrategyBuilder';

// Standard normal cumulative distribution function
function stdNormalCDF(x: number): number {
    // Abramowitz and Stegun approximation
    const b1 =  0.319381530;
    const b2 = -0.356563782;
    const b3 =  1.781477937;
    const b4 = -1.821255978;
    const b5 =  1.330274429;
    const p  =  0.2316419;
    const c  =  0.39894228;

    if (x >= 0.0) {
        const t = 1.0 / (1.0 + p * x);
        return (1.0 - c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1));
    } else {
        const t = 1.0 / (1.0 - p * x);
        return (c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1));
    }
}

// Standard normal probability density function
function stdNormalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function d1(s: number, k: number, r: number, v: number, t: number): number {
    if (t <= 0) t = 0.000001; // Avoid division by zero for expired options
    return (Math.log(s / k) + (r + (v * v) / 2) * t) / (v * Math.sqrt(t));
}

function d2(s: number, k: number, r: number, v: number, t: number): number {
    if (t <= 0) t = 0.000001;
    return d1(s, k, r, v, t) - v * Math.sqrt(t);
}

// --- GREEKS ---

export function calculateDelta(type: 'call' | 'put', s: number, k: number, r: number, v: number, t: number): number {
    if (t <= 0) return type === 'call' ? (s > k ? 1 : 0) : (s < k ? -1 : 0);
    const d1Val = d1(s, k, r, v, t);
    if (type === 'call') {
        return stdNormalCDF(d1Val);
    }
    return stdNormalCDF(d1Val) - 1;
}

export function calculateGamma(s: number, k: number, r: number, v: number, t: number): number {
    if (t <= 0) return 0;
    const d1Val = d1(s, k, r, v, t);
    return stdNormalPDF(d1Val) / (s * v * Math.sqrt(t));
}

export function calculateVega(s: number, k: number, r: number, v: number, t: number): number {
    if (t <= 0) return 0;
    const d1Val = d1(s, k, r, v, t);
    return (s * stdNormalPDF(d1Val) * Math.sqrt(t)) / 100; // Per 1% change in vol
}

export function calculateTheta(type: 'call' | 'put', s: number, k: number, r: number, v: number, t: number): number {
    if (t <= 0) return 0;
    const d1Val = d1(s, k, r, v, t);
    const d2Val = d2(s, k, r, v, t);
    const pdf_d1 = stdNormalPDF(d1Val);
    
    if (type === 'call') {
        const term1 = -(s * pdf_d1 * v) / (2 * Math.sqrt(t));
        const term2 = r * k * Math.exp(-r * t) * stdNormalCDF(d2Val);
        return (term1 - term2) / 365; // Per day
    } else { // Put
        const term1 = -(s * pdf_d1 * v) / (2 * Math.sqrt(t));
        const term2 = r * k * Math.exp(-r * t) * stdNormalCDF(-d2Val);
        return (term1 + term2) / 365; // Per day
    }
}

// --- THEORETICAL PRICE ---

function callPrice(s: number, k: number, r: number, v: number, t: number): number {
    if (t <= 0) return Math.max(0, s - k);
    const d1Val = d1(s, k, r, v, t);
    const d2Val = d2(s, k, r, v, t);
    return s * stdNormalCDF(d1Val) - k * Math.exp(-r * t) * stdNormalCDF(d2Val);
}

function putPrice(s: number, k: number, r: number, v: number, t: number): number {
    if (t <= 0) return Math.max(0, k - s);
    const d1Val = d1(s, k, r, v, t);
    const d2Val = d2(s, k, r, v, t);
    return k * Math.exp(-r * t) * stdNormalCDF(-d2Val) - s * stdNormalCDF(-d1Val);
}

export function calculateTheoreticalPrice(leg: Omit<Leg, 'id'>, stockPrice: number, r: number, v: number, t: number): number {
    if (leg.type === 'underlying') {
        return stockPrice; // The theoretical price of the underlying is the stock price
    }
    if (leg.type === 'call') {
        return callPrice(stockPrice, leg.strike, r, v, t);
    }
    return putPrice(stockPrice, leg.strike, r, v, t);
}