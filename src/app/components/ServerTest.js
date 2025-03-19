'use client';
import { useState } from 'react';
import { Button } from './button';

export default function ServerTest() {
  const [status, setStatus] = useState('Non testé');
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState(null);
  const [domainId, setDomainId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);

  // URL du serveur backend
  const SERVER_URL = "http://localhost:8080";

  // Vérifier si le serveur est en ligne
  const checkServer = async () => {
    setLoading(true);
    setStatus('Test en cours...');
    
    try {
      const response = await fetch(`${SERVER_URL}/`);
      
      if (response.ok) {
        const data = await response.json();
        setStatus('Connecté');
        setServerInfo(data);
      } else {
        setStatus('Erreur');
        setServerInfo({ error: `${response.status}: ${response.statusText}` });
      }
    } catch (error) {
      setStatus('Non connecté');
      setServerInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Envoyer un domaine au serveur
  const submitDomain = async (e) => {
    e.preventDefault();
    if (!domain) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/check-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setDomainId(data.id);
        setResult(data);
      } else {
        setResult({ error: `${response.status}: ${response.statusText}` });
      }
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Récupérer le statut d'un domaine
  const checkDomainStatus = async () => {
    if (!domainId) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`${SERVER_URL}/domain-status/${domainId}`);
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        setResult({ error: `${response.status}: ${response.statusText}` });
      }
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Test de communication avec le serveur</h2>
      
      <div className="flex items-center gap-4 mb-4">
        <Button 
          onClick={checkServer} 
          disabled={loading}
          className="bg-blue-500 text-white"
        >
          Vérifier la connexion
        </Button>
        
        <div className={`px-3 py-1 rounded-full ${
          status === 'Connecté' ? 'bg-green-100 text-green-800' : 
          status === 'Non connecté' ? 'bg-red-100 text-red-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </div>
      </div>
      
      {serverInfo && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <pre className="text-sm">{JSON.stringify(serverInfo, null, 2)}</pre>
        </div>
      )}
      
      <form onSubmit={submitDomain} className="mt-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="border p-2 rounded shadow-sm focus:ring focus:ring-blue-300 flex-grow"
            disabled={loading}
          />
          <Button 
            type="submit" 
            disabled={loading || !domain}
            className="bg-green-600 text-white"
          >
            Envoyer domaine
          </Button>
        </div>
      </form>
      
      {domainId && (
        <div className="mt-4">
          <Button 
            onClick={checkDomainStatus} 
            disabled={loading}
            className="bg-purple-600 text-white"
          >
            Vérifier le statut
          </Button>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Résultat:</h3>
          <div className="p-3 bg-gray-100 rounded overflow-x-auto">
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}