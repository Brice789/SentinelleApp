'use client';
import { useState } from 'react';
import { Button } from './button';

export default function CommandRunner() {
  const [tool, setTool] = useState('nmap');
  const [command, setCommand] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // URL de l'API backend (utiliser la même que celle définie dans votre page principale)
  const API_URL = "http://localhost:3010";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      // Envoyer la commande au backend
      console.log(`Envoi de la commande à ${API_URL}/command/`);
      const response = await fetch(`${API_URL}/command/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tool, command }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Réponse reçue:", data);
      const taskId = data.task_id;
      setTaskId(taskId);
      
      // Vérification des résultats toutes les 2 secondes
      checkResults(taskId);
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const checkResults = async (id) => {
    try {
      console.log(`Vérification des résultats pour ${id}`);
      const resultResponse = await fetch(`${API_URL}/results/${id}`);
      
      if (!resultResponse.ok) {
        throw new Error(`Erreur ${resultResponse.status}`);
      }
      
      const resultData = await resultResponse.json();
      console.log("Résultas reçus:", resultData);
      
      if (resultData.status === "completed") {
        setResults(resultData.result);
        setLoading(false);
      } else if (resultData.status === "error") {
        setError(resultData.error);
        setLoading(false);
      } else {
        // Si toujours en attente, vérifier à nouveau après 2 secondes
        setTimeout(() => checkResults(id), 2000);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des résultats:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Permet à l'utilisateur de télécharger les résultats en JSON
  const downloadResults = () => {
    if (!results) return;
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool}-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Exécution de commandes</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Outil:
            <select 
              value={tool} 
              onChange={(e) => setTool(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="nmap">Nmap</option>
              <option value="nuclei">Nuclei</option>
              <option value="nikto">Nikto</option>
            </select>
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commande:
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Arguments de la commande (ex: -sV google.com)"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </label>
        </div>
        
        <div className="flex gap-2">
          <Button 
            type="submit" 
            disabled={loading || !command}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Exécution en cours..." : "Exécuter"}
          </Button>
          
          {results && (
            <Button 
              onClick={downloadResults}
              className="bg-green-600 text-white px-4 py-2 rounded"
              type="button"
            >
              Télécharger JSON
            </Button>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {taskId && loading && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded">
          Commande en cours d'exécution, veuillez patienter...
        </div>
      )}
      
      {results && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Résultats:</h3>
          <div className="bg-gray-100 p-4 rounded overflow-x-auto">
            <pre className="text-sm">{JSON.stringify(results, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}