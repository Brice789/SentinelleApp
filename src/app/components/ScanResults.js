'use client';
import { useState, useEffect } from 'react';

export default function ScanResults() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // URL de l'API backend
  const API_URL = "http://localhost:3010";
 
  useEffect(() => {
    async function fetchScans() {
      try {
        // Utilisez l'URL complète de votre backend
        const response = await fetch(`${API_URL}/results`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Données reçues:", data);
        
        // Vérifiez la structure des données reçues et adaptez le code en conséquence
        if (data.tasks && Array.isArray(data.tasks)) {
          setScans(data.tasks);
        } else {
          // Si la structure ne correspond pas à ce qui est attendu
          console.warn("Structure de données inattendue:", data);
          setScans([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des scans:", err);
        setError(`Erreur lors du chargement des scans: ${err.message}`);
        setLoading(false);
      }
    }
   
    fetchScans();
  }, []);
 
  if (loading) return <div className="p-4">Chargement des résultats...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
 
  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-4">Résultats des scans</h2>
      
      {scans.length === 0 ? (
        <div className="text-gray-500">Aucun scan à afficher pour le moment.</div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Domaine</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Statut</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scans.map(scan => (
              <tr key={scan.id} className="hover:bg-gray-50">
                <td className="border p-2">{scan.target}</td>
                <td className="border p-2">{new Date(scan.startTime).toLocaleString()}</td>
                <td className="border p-2">
                  <span 
                    className={`inline-block px-2 py-1 rounded text-sm ${
                      scan.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      scan.status === 'error' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {scan.status === 'completed' ? 'Terminé' : 
                     scan.status === 'error' ? 'Erreur' : 
                     'En cours'}
                  </span>
                </td>
                <td className="border p-2">
                  <button 
                    onClick={() => window.location.href = `/scan-details/${scan.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}