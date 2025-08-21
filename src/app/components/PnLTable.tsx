'use client';

import React, { useMemo } from 'react';
import { Leg, ModelParameters } from './StrategyBuilder';
import { calculatePayoff } from '../utils/payoff';
import { calculateTheoreticalPrice } from '../utils/black-scholes';
import { formatNumber } from '../utils/formatting';

const CONTRACT_SIZE = 100;

interface PnLTableProps {
  legs: Leg[];
  underlyingPrice: number;
  modelParameters: ModelParameters;
}

const PnLTable: React.FC<PnLTableProps> = ({ legs, underlyingPrice, modelParameters }) => {

    const tableData = useMemo(() => {
        const activeLegs = legs.filter(leg => leg.active);
        if (activeLegs.length === 0 || underlyingPrice <= 0) {
            return { headers: { top: [], sub: [] }, rows: [] };
        }

        const groups = activeLegs.reduce((acc, leg) => {
            const strategyName = leg.strategyName || 'Estrategia sin nombre';
            if (!acc[strategyName]) acc[strategyName] = [];
            acc[strategyName].push(leg);
            return acc;
        }, {} as Record<string, Leg[]>);

        const strategyNames = Object.keys(groups);
        
        const topHeaders = [
            { content: 'Escenario', colSpan: 2 },
            ...strategyNames.map(name => ({ content: name, colSpan: 2 })),
            { content: 'Total', colSpan: 2 },
        ];

        const subHeaders = ['Precio', '% Cambio', ...strategyNames.flatMap(() => ['Finish', 'Teórico']), 'Finish', 'Teórico'];

        const rows: { data: CellData[], isUnderlyingPrice: boolean }[] = [];
        const t = modelParameters.timeToExpiry / 365;
        const r = modelParameters.riskFreeRate / 100;
        const v = modelParameters.volatility / 100;

        type CellData = { value: number | string; isNumber: boolean };

        for (let i = -20; i <= 20; i += 2) {
            const percentage = i / 100;
            const price = underlyingPrice * (1 + percentage);
            
            const rowData: CellData[] = [ { value: price, isNumber: true }, { value: `${i}%`, isNumber: false } ];
            
            let totalFinishPayoff = 0;
            let totalTheoreticalPayoff = 0;

            strategyNames.forEach(name => {
                const groupLegs = groups[name];
                const groupFinishPayoff = groupLegs.reduce((total, leg) => total + calculatePayoff(price, leg), 0);
                
                const groupTheoreticalPayoff = groupLegs.reduce((total, leg) => {
                    const theoreticalValue = calculateTheoreticalPrice(leg, price, r, v, t);
                    const pnl = (theoreticalValue - leg.premium) * leg.quantity * (leg.type === 'underlying' ? 1 : CONTRACT_SIZE) * (leg.action === 'buy' ? 1 : -1);
                    return total + pnl;
                }, 0);

                totalFinishPayoff += groupFinishPayoff;
                totalTheoreticalPayoff += groupTheoreticalPayoff;
                rowData.push({ value: groupFinishPayoff, isNumber: true }, { value: groupTheoreticalPayoff, isNumber: true });
            });

            rowData.push({ value: totalFinishPayoff, isNumber: true }, { value: totalTheoreticalPayoff, isNumber: true });
            rows.push({ data: rowData, isUnderlyingPrice: i === 0 });
        }

        return { headers: { top: topHeaders, sub: subHeaders }, rows };

    }, [legs, underlyingPrice, modelParameters]);

    const getCellClass = (cellValue: number | string, columnIndex: number) => {
        if (columnIndex === 0) { // "Precio" column
            return 'text-gray-900 font-medium';
        }
        if (columnIndex === 1 && typeof cellValue === 'string' && cellValue.endsWith('%')) { // "% Cambio" column
            const percentage = parseFloat(cellValue);
            if (percentage > 0) return 'text-green-600 font-medium';
            if (percentage < 0) return 'text-red-600 font-medium';
            return 'text-gray-700';
        }
        const value = Number(cellValue);
        if (isNaN(value)) return 'text-gray-900';
        if (value > 0) return 'text-green-600 font-medium';
        if (value < 0) return 'text-red-600 font-medium';
        return 'text-gray-700';
    };

    if (tableData.rows.length === 0) return null;

    return (
        <div className="mt-6 bg-white p-4 shadow-lg rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-600 pb-2 mb-4">Tabla de Ganancias y Pérdidas (P&L)</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-center">
                    <thead className="bg-gray-50">
                        <tr>
                            {tableData.headers.top.map((header, index) => (
                                <th key={index} colSpan={header.colSpan} scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {header.content}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {tableData.headers.sub.map((header, index) => (
                                <th key={index} scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-t border-gray-200">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tableData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className={`${row.isUnderlyingPrice ? 'bg-yellow-100' : ''} hover:bg-gray-50`}>
                                {row.data.map((cell, cellIndex) => (
                                    <td key={cellIndex} className={`px-6 py-4 whitespace-nowrap text-sm ${getCellClass(cell.value, cellIndex)}`}>
                                        {cell.isNumber ? formatNumber(cell.value as number) : cell.value}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PnLTable;