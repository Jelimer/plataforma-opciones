'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Leg } from './StrategyBuilder';
import { calculatePayoff } from '../utils/payoff';
import { formatCurrency } from '../utils/formatting';

// Define a more specific type for the tooltip formatter parameter
interface EChartTooltipParams {
    seriesName: string;
    value: [number, number];
    color: string;
}

interface MarkLineData {
    name?: string;
    xAxis?: number;
    yAxis?: number;
}

interface MarkLine {
    silent?: boolean;
    symbol?: string | string[];
    lineStyle?: object;
    data?: MarkLineData[];
    label?: object;
}

interface MarkPointData {
    name?: string;
    coord?: (number | string)[];
    value?: string;
    symbolOffset?: (number | string)[];
}

interface MarkPoint {
    symbolSize?: number;
    data?: MarkPointData[];
}

// Define a type for our chart series
interface EChartSeries {
    name: string;
    type: 'line';
    smooth: boolean;
    symbol: string;
    data: (number[])[];
    lineStyle?: {
        width?: number;
        type?: 'solid' | 'dashed' | 'dotted';
    };
    markLine?: MarkLine;
    markPoint?: MarkPoint;
}

interface PayoffChartProps {
  legs: Leg[];
  underlyingPrice: number;
}

const PayoffChart: React.FC<PayoffChartProps> = ({ legs, underlyingPrice }) => {

  const chartOption = useMemo(() => {
    const activeLegs = legs.filter(leg => leg.active);

    if (activeLegs.length === 0) {
      return { xAxis: { type: 'value' }, yAxis: { type: 'value' }, series: [] };
    }

    // Group legs by strategyName
    const groups = activeLegs.reduce((acc, leg) => {
        const strategyName = leg.strategyName || 'Estrategia sin nombre';
        if (!acc[strategyName]) {
            acc[strategyName] = [];
        }
        acc[strategyName].push(leg);
        return acc;
    }, {} as Record<string, Leg[]>);

    // New Symmetrical Range Calculation
    const viewPercentage = 0.5; // Show 50% on each side of the underlying price
    const range = underlyingPrice * viewPercentage;
    const priceStart = Math.max(0, underlyingPrice - range);
    const priceEnd = underlyingPrice + range;

    const prices: number[] = [];
    const step = (priceEnd - priceStart) / 200;

    if (step <= 0) {
        return { xAxis: { type: 'value' }, yAxis: { type: 'value' }, series: [] };
    }

    for (let p = priceStart; p <= priceEnd; p += step) {
      prices.push(p);
    }

    const series: EChartSeries[] = Object.entries(groups).map(([strategyName, groupLegs]) => {
        const payoffs = prices.map(price => 
            groupLegs.reduce((total, leg) => total + calculatePayoff(price, leg), 0)
        );
        return {
            name: strategyName,
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: prices.map((price, index) => [price, payoffs[index]]),
        };
    });

    // Add a total payoff line
    const totalPayoffs = prices.map(price => 
        activeLegs.reduce((total, leg) => total + calculatePayoff(price, leg), 0)
    );

    const breakEvenPoints: number[] = [];
    for (let i = 0; i < totalPayoffs.length - 1; i++) {
        if (Math.sign(totalPayoffs[i]) !== Math.sign(totalPayoffs[i + 1])) {
            const price1 = prices[i];
            const price2 = prices[i + 1];
            const payoff1 = totalPayoffs[i];
            const payoff2 = totalPayoffs[i + 1];
            const breakEven = price1 - payoff1 * (price2 - price1) / (payoff2 - payoff1);
            breakEvenPoints.push(breakEven);
        }
    }

    const maxProfit = Math.max(...totalPayoffs);
    const maxProfitPrice = prices[totalPayoffs.indexOf(maxProfit)];
    const minLoss = Math.min(...totalPayoffs);
    const minLossPrice = prices[totalPayoffs.indexOf(minLoss)];

    const markPointData: MarkPointData[] = [];
    if (isFinite(maxProfit)) {
        markPointData.push({
            name: 'Max Profit',
            value: `Max Profit: ${formatCurrency(maxProfit)}`,
            coord: [maxProfitPrice, maxProfit],
            symbolOffset: [0, -30],
        });
    }
    if (isFinite(minLoss)) {
        markPointData.push({
            name: 'Max Loss',
            value: `Max Loss: ${formatCurrency(minLoss)}`,
            coord: [minLossPrice, minLoss],
            symbolOffset: [0, 30],
        });
    }

    series.push({
        name: 'Total',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 4, type: 'solid' },
        data: prices.map((price, index) => [price, totalPayoffs[index]]),
        markLine: {
            symbol: 'none',
            lineStyle: {
                type: 'dashed',
                color: '#4b5563'
            },
            label: {
                formatter: '{b}',
                position: 'insideEndTop'
            },
            data: breakEvenPoints.map(p => ({ name: `BE: ${formatCurrency(p)}`, xAxis: p }))
        },
        markPoint: {
            symbolSize: 80,
            data: markPointData
        }
    });

    return {
      title: {
        text: 'Gráfico de Payoff de la Estrategia Combinada',
        left: 'center',
        textStyle: { color: '#334155', fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: EChartTooltipParams[]) => {
            if (!Array.isArray(params) || params.length === 0) return '';
            const price = params[0].value[0];
            let tooltip = `Precio: <strong>${formatCurrency(price)}</strong><br/>`;
            params.forEach(param => {
                if (param.seriesName !== 'Línea Cero' && param.seriesName !== 'Precio Actual') {
                    tooltip += `<span style="color:${param.color}">●</span> ${param.seriesName}: <strong>${formatCurrency(param.value[1])}</strong><br/>`;
                }
            });

            tooltip += '<hr style="margin: 5px 0;" />';
            tooltip += '<strong>Desglose de Patas:</strong><br/>';
            activeLegs.forEach(leg => {
                const payoff = calculatePayoff(price, leg);
                tooltip += `${leg.action === 'buy' ? 'Compra' : 'Venta'} ${leg.quantity} ${leg.type} @ ${leg.strike}: <strong>${formatCurrency(payoff)}</strong><br/>`;
            });

            return tooltip;
        },
      },
      legend: {
        data: series.map(s => s.name),
        bottom: 30,
      },
      xAxis: {
        type: 'value',
        name: 'Precio del Activo al Vencimiento',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { formatter: (value: number) => formatCurrency(value) }
      },
      yAxis: {
        type: 'value',
        name: 'Ganancia / Pérdida',
        axisLabel: { formatter: (value: number) => formatCurrency(value) }
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100, height: 20, bottom: 60 }
      ],
      series: [...series, {
        name: 'Línea Cero',
        type: 'line',
        markLine: {
            silent: true, 
            symbol: 'none', 
            lineStyle: { type: 'dashed', color: '#4b5563' },
            data: [{ yAxis: 0 }]
        }
      }, {
        name: 'Precio Actual',
        type: 'line',
        markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'solid', color: '#f59e0b', width: 2 },
            label: { formatter: 'Actual\n{c}', position: 'insideEndTop', color: '#f59e0b' },
            data: [{ xAxis: underlyingPrice }]
        }
      }],
      grid: { left: '10%', right: '10%', bottom: '25%', containLabel: true }
    };
  }, [legs, underlyingPrice]);

  return <ReactECharts option={chartOption} style={{ height: '500px', width: '100%' }} />; 
};

export default PayoffChart;