import React from 'react';
import { PlusCircle, MinusCircle, Flag } from 'lucide-react';
import { useVolleyball } from '../context/VolleyballContext';

const ScoreKeeper = () => {
  const { matchData, updateScore, startNewSet } = useVolleyball();
  const { currentSet, teamScore, opponentScore, sets } = matchData;

  return (
    <div className="bg-white p-3 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Set {currentSet}
        </h3>
        <button
          onClick={startNewSet}
          className="flex items-center text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          <Flag className="h-3 w-3 mr-1" />
          <span>Nuevo Set</span>
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateScore('team', -1)}
              className="text-blue-600 hover:text-blue-800"
            >
              <MinusCircle className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Equipo</span>
              <span className="text-2xl font-bold text-blue-600">{teamScore}</span>
            </div>
            <button
              onClick={() => updateScore('team', 1)}
              className="text-blue-600 hover:text-blue-800"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mx-4 text-gray-400">vs</div>

        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateScore('opponent', -1)}
              className="text-red-600 hover:text-red-800"
            >
              <MinusCircle className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Rival</span>
              <span className="text-2xl font-bold text-red-600">{opponentScore}</span>
            </div>
            <button
              onClick={() => updateScore('opponent', 1)}
              className="text-red-600 hover:text-red-800"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Resumen de sets anteriores */}
      {sets.length > 1 && (
        <div className="mt-3 pt-3 border-t">
          <h4 className="text-xs font-medium text-gray-500 mb-1">Sets Anteriores</h4>
          <div className="flex flex-wrap gap-2">
            {sets.filter(set => set.completed).map((set, index) => (
              <div key={index} className="text-xs px-2 py-1 bg-gray-100 rounded">
                Set {index + 1}: <span className="font-medium text-blue-600">{set.teamScore}</span>
                {' - '}
                <span className="font-medium text-red-600">{set.opponentScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreKeeper;