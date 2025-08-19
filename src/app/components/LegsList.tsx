'use client';

import React, { useEffect, useRef } from 'react';
import { Leg } from './StrategyBuilder';
import { gsap } from 'gsap';

interface LegsListProps {
  legs: Leg[];
  strategyName: string;
  onDeleteLeg: (id: number) => void;
  onEditLeg: (leg: Leg) => void;
  onUpdateLeg: (id: number, updatedProperties: Partial<Omit<Leg, 'id'>>) => void;
}

const LegsList: React.FC<LegsListProps> = ({ legs, strategyName, onDeleteLeg, onEditLeg, onUpdateLeg }) => {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (listRef.current) {
        const listItems = Array.from(listRef.current.children);
        gsap.fromTo(listItems, 
            { opacity: 0, y: -20 }, 
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
        );
    }
  }, [legs]);

  return (
    <div className="bg-gray-50 p-4 rounded-md border">
      <h3 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-600 pb-2 mb-4">
        Patas de: <span className="text-blue-700 font-bold">{strategyName || 'Mi Estrategia'}</span>
      </h3>
      <ul ref={listRef} className="max-h-[400px] overflow-y-auto divide-y divide-gray-200">
        {legs.length === 0 ? (
          <li className="text-center text-gray-500 py-4">Añade patas para empezar.</li>
        ) : (
          legs.map(leg => (
            <li key={leg.id} className="p-2 hover:bg-gray-100 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={leg.active}
                    onChange={() => onUpdateLeg(leg.id, { active: !leg.active })}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-sm">
                      <span className={`mr-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${leg.groupId === '1' ? 'bg-pink-200 text-pink-800' : 'bg-indigo-200 text-indigo-800'}`}>
                          ID: {leg.groupId}
                      </span>
                      <span className={`${leg.action === 'buy' ? 'text-green-600' : 'text-red-600'} font-bold`}>
                          {leg.action === 'buy' ? 'COMPRA' : 'VENDE'} {leg.quantity}
                      </span>
                      {leg.type === 'underlying' ? (
                          <span className="text-yellow-600 font-bold ml-1">Subyacente</span>
                      ) : (
                          <span className="ml-1">{leg.type === 'call' ? 'Call' : 'Put'}</span>
                      )}
                      <span className="ml-2">Strike <strong className="font-semibold">{leg.strike}</strong></span>
                      <span className="ml-2">@ <strong className="font-semibold">{leg.premium.toFixed(2)}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onEditLeg(leg)} className="text-gray-400 hover:text-blue-600 font-bold text-lg p-1 rounded-full transition duration-150 ease-in-out">
                      ✏️
                  </button>
                  <button onClick={() => onDeleteLeg(leg.id)} className="text-gray-400 hover:text-red-600 font-bold text-lg p-1 rounded-full transition duration-150 ease-in-out">
                      🗑
                  </button>
                </div>
              </div>
              <div className="mt-2 pl-8">
                  <input 
                    type="text"
                    placeholder="Añadir un comentario..."
                    value={leg.comment || ''}
                    onChange={(e) => onUpdateLeg(leg.id, { comment: e.target.value })}
                    className="w-full text-xs px-2 py-1 border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default LegsList;