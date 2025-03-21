'use client';

import { useState } from 'react';

export default function TerminalOutputSimple({ outputText, commandText, title = "Terminal Output" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Gestion de différents formats d'entrée (rétrocompatibilité)
  let displayOutput = '';
  let displayCommand = '';
  
  if (typeof outputText === 'string') {
    displayOutput = outputText;
  } else if (outputText && typeof outputText === 'object') {
    // Si c'est un objet avec stdout/stderr
    displayOutput = (outputText.stdout || '') + (outputText.stderr ? '\n' + outputText.stderr : '');
    displayCommand = outputText.command || commandText || '';
  }
  
  if (!displayOutput && !displayCommand) {
    return (
      <div className="bg-gray-100 rounded p-4 text-gray-700">
        <div className="flex justify-between items-center">
          <div className="font-mono text-sm">{title}</div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Aucune sortie disponible
        </div>
      </div>
    );
  }
  
  // Limiter l'affichage initial
  const maxDisplayLines = 15;
  const outputLines = displayOutput ? displayOutput.split('\n') : [];
  const hasMoreLines = outputLines.length > maxDisplayLines;
  
  return (
    <div className="bg-gray-900 rounded-md overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 text-gray-300 flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex space-x-2 mr-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="font-mono text-sm">{title}</div>
        </div>
        <button 
          className="text-sm text-gray-400 hover:text-white"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Réduire' : 'Voir tout'}
        </button>
      </div>
      
      <div className="p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap overflow-auto" style={{ maxHeight: isExpanded ? '500px' : '250px' }}>
        {displayCommand && (
          <div className="mb-2">
            <span className="text-green-400">$ </span>
            <span className="text-blue-400">{displayCommand}</span>
          </div>
        )}
        
        {/* Affichage limité ou complet selon l'état */}
        {isExpanded ? (
          <div className="text-gray-300">{displayOutput}</div>
        ) : (
          <div className="text-gray-300">
            {outputLines.slice(0, maxDisplayLines).join('\n')}
            {hasMoreLines && (
              <div className="text-gray-500 mt-2">
                + {outputLines.length - maxDisplayLines} lignes supplémentaires...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}