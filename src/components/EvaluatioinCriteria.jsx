import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const EvaluationCriteria = () => {
  const [expanded, setExpanded] = useState(false);
  
  const criterios = {
    "SAQUE": [
      { symbol: "##", type: "Doble Positivo", description: "Punto directo (ACE)" },
      { symbol: "+", type: "Positivo", description: "Saque que complica la recepción del rival" },
      { symbol: "/", type: "Overpass", description: "Al ser tocado por la recepción del rival pasa directo al otro campo" },
      { symbol: "-", type: "Negativo", description: "Saque fácil para la recepción del rival" },
      { symbol: "=", type: "Doble Negativo", description: "Error" }
    ],
    "RECEPCIÓN": [
      { symbol: "##", type: "Doble Positiva", description: "Perfecta que permite todas las opciones de distribución del armador" },
      { symbol: "+", type: "Positiva", description: "Buena que permite al menos 2 opciones de distribución" },
      { symbol: "/", type: "Overpass", description: "Recepción toca al jugador y la bola pasa directo al otro campo" },
      { symbol: "-", type: "Negativa", description: "Recepción mala fuera de la zona de 3 metros" },
      { symbol: "=", type: "Doble Negativa", description: "Error" }
    ],
    "ATAQUE": [
      { symbol: "##", type: "Doble Positivo", description: "Punto directo" },
      { symbol: "+", type: "Positivo", description: "Ataque que complica la defensa del rival" },
      { symbol: "/", type: "Overpass", description: "Ataque bloqueado por el rival" },
      { symbol: "-", type: "Negativo", description: "Defendido fácil por el rival" },
      { symbol: "=", type: "Doble Negativo", description: "Error" }
    ],
    "BLOQUEO": [
      { symbol: "##", type: "Doble Positivo", description: "Punto directo" },
      { symbol: "+", type: "Positivo", description: '"Frenar" el ataque para una defensa positiva en nuestro campo' },
      { symbol: "/", type: "Overpass", description: "Falta detenida por el árbitro (toque de red, invasión)" },
      { symbol: "-", type: "Negativo", description: "Bola toca nuestro bloqueo pero la bola continúa en campo rival" },
      { symbol: "=", type: "Doble Negativo", description: "Error (Blockout, bola entre las manos, mal contacto)" }
    ],
    "DEFENSA": [
      { symbol: "##", type: "Doble Positivo", description: "Defensa que permite todas las opciones de distribución" },
      { symbol: "+", type: "Positivo", description: 'Defensa "buena" que permite al menos 2 opciones de distribución' },
      { symbol: "/", type: "Overpass", description: "Al ser tocado por la defensa pasa directo al otro campo" },
      { symbol: "-", type: "Negativo", description: "Defensa mala fuera de la zona de 3 metros" },
      { symbol: "=", type: "Doble Negativo", description: "Error" }
    ],
    "ARMADO": [
      { symbol: "##", type: "Doble Positivo", description: "El armador puede dejar al atacante sin bloqueo" },
      { symbol: "+", type: "Positivo", description: "El armador puede dejar al atacante con 1 bloqueo" },
      { symbol: "/", type: "Overpass", description: "Al momento del armado por impresición pasa la bola al campo contrario" },
      { symbol: "-", type: "Negativo", description: "Bola pegada, bola muy baja, bola complicada para el atacante" },
      { symbol: "=", type: "Doble Negativo", description: "Error (doble, retención)" }
    ]
  };

  const [activeTab, setActiveTab] = useState(Object.keys(criterios)[0]);

  return (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-md overflow-hidden">
      <div 
        className="flex justify-between items-center p-3 bg-blue-600 text-white cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-medium">Criterios de Evaluación</h3>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      
      {expanded && (
        <div className="p-3">
          <div className="flex overflow-x-auto mb-2 border-b">
            {Object.keys(criterios).map(tab => (
              <button
                key={tab}
                className={`px-3 py-1 whitespace-nowrap text-sm font-medium ${
                  activeTab === tab 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-600 hover:text-blue-500'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Símbolo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {criterios[activeTab].map((criterio, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{criterio.symbol}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{criterio.type}</td>
                    <td className="px-3 py-2">{criterio.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationCriteria;