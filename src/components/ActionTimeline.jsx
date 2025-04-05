import React, { useState } from 'react';
import { useVolleyball } from '../context/VolleyballContext';
import { ChevronDown, ChevronUp, User, Users, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ActionTimeline = () => {
  const { statsData, matchData } = useVolleyball();
  const [expanded, setExpanded] = useState(false);
  const [filterPlayer, setFilterPlayer] = useState(null); // null = todos, 1 = jugador 1, 2 = jugador 2
  const [filterSet, setFilterSet] = useState(null); // null = todos los sets

  // Obtener las acciones del set actual o de todos los sets
  const getFilteredActions = () => {
    let actions = [];
    
    if (filterSet === null) {
      // Todas las acciones de todos los sets
      actions = matchData.sets.flatMap(set => set.actions);
    } else {
      // Solo acciones del set seleccionado
      const setIndex = filterSet - 1;
      if (matchData.sets[setIndex]) {
        actions = matchData.sets[setIndex].actions;
      }
    }
    
    // Filtrar por jugador si es necesario
    if (filterPlayer !== null) {
      actions = actions.filter(action => action.player === filterPlayer);
    }
    
    // Ordenar por tiempo, más reciente primero
    return actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getActionColor = (statType) => {
    switch(statType) {
      case 'doublePositive': return 'bg-green-100 border-green-500 text-green-800';
      case 'positive': return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'overpass': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'negative': return 'bg-red-100 border-red-500 text-red-800';
      case 'doubleNegative': return 'bg-red-200 border-red-700 text-red-900';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  const getStatTypeSymbol = (statType) => {
    switch(statType) {
      case 'doublePositive': return '##';
      case 'positive': return '+';
      case 'overpass': return '/';
      case 'negative': return '-';
      case 'doubleNegative': return '=';
      default: return '?';
    }
  };

  return (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-md overflow-hidden">
      <div 
        className="flex justify-between items-center p-3 bg-blue-600 text-white cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-medium">Línea de Tiempo de Acciones</h3>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      
      {expanded && (
        <div className="p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="flex gap-1">
              <button
                onClick={() => setFilterPlayer(null)}
                className={`px-2 py-1 text-xs rounded-md ${
                  filterPlayer === null 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Users className="h-3 w-3 inline mr-1" />
                Todos
              </button>
              <button
                onClick={() => setFilterPlayer(1)}
                className={`px-2 py-1 text-xs rounded-md ${
                  filterPlayer === 1 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <User className="h-3 w-3 inline mr-1" />
                Jugador 1
              </button>
              <button
                onClick={() => setFilterPlayer(2)}
                className={`px-2 py-1 text-xs rounded-md ${
                  filterPlayer === 2 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <User className="h-3 w-3 inline mr-1" />
                Jugador 2
              </button>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setFilterSet(null)}
                className={`px-2 py-1 text-xs rounded-md ${
                  filterSet === null 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Filter className="h-3 w-3 inline mr-1" />
                Todos Sets
              </button>
              {matchData.sets.map((set, index) => (
                <button
                  key={index}
                  onClick={() => setFilterSet(index + 1)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    filterSet === index + 1 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Set {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {getFilteredActions().length > 0 ? (
              getFilteredActions().map(action => (
                <div 
                  key={action.id} 
                  className={`flex items-center p-2 border-l-4 rounded ${getActionColor(action.statType)}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-xs font-semibold mr-2">
                        Jugador {action.player}
                      </span>
                      <span className="text-xs bg-white bg-opacity-60 px-1 rounded">
                        {action.skillType}
                      </span>
                      <span className="ml-2 text-sm font-bold">
                        {getStatTypeSymbol(action.statType)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span>
                        {format(new Date(action.timestamp), "HH:mm:ss", { locale: es })}
                      </span>
                      <span>
                        Marcador: {action.teamScore} - {action.opponentScore}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No hay acciones registradas con los filtros seleccionados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionTimeline;