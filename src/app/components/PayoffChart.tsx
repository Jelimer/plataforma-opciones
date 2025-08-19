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

    // Group legs by groupId
    const groups = activeLegs.reduce((acc, leg) => {
        const groupId = leg.groupId || '1';
        if (!acc[groupId]) {
            acc[groupId] = [];
        }
        acc[groupId].push(leg);
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

    const series: EChartSeries[] = Object.entries(groups).map(([groupId, groupLegs]) => {
        const payoffs = prices.map(price => 
            groupLegs.reduce((total, leg) => total + calculatePayoff(price, leg), 0)
        );
        return {
            name: `Grupo ${groupId}`,
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
    series.push({
        name: 'Total',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 4, type: 'solid' },
        data: prices.map((price, index) => [price, totalPayoffs[index]]),
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
            let tooltip = `Precio: <strong>${formatCurrency(params[0].value[0])}</strong><br/>`;
            params.forEach(param => {
                if (param.seriesName !== 'Línea Cero' && param.seriesName !== 'Precio Actual') {
                    tooltip += `<span style="color:${param.color}">●</span> ${param.seriesName}: <strong>${formatCurrency(param.value[1])}</strong><br/>`;
                }
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