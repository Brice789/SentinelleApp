'use client';
import { useState, useEffect } from "react";

export default function ServerTest({ apiUrl }) {
  const [serverStatus, setServerStatus] = useState("Vérification...");
  const [connectionError, setConnectionError] = useState(null);

  // Vérifier la connexion au serveur au chargement du composant
  useEffect(() => {
    checkServerConnection();
  }, [apiUrl]);

  // Fonction pour vérifier la connexion au serveur
  const checkServerConnection = async () => {
    try {
      // Faire une requête au serveur avec un timeout de 5 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      setServerStatus("Vérification...");
      setConnectionError(null);
      
      const response = await fetch(`${apiUrl}/check-domain`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServerStatus("Connecté");
        setConnectionError(null);
      } else {
        setServerStatus("Erreur");
        setConnectionError(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur de connexion au serveur:", error);
      setServerStatus("Déconnecté");
      
      // Message d'erreur personnalisé selon le type d'erreur
      if (error.name === 'AbortError') {
        setConnectionError("Délai d'attente dépassé. Le serveur ne répond pas.");
      } else if (error.message.includes('Network')) {
        setConnectionError("Erreur de réseau. Vérifiez que le serveur est démarré.");
      } else {
        setConnectionError(error.message);
      }
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center">
        <div className="font-medium mr-2">Statut du serveur:</div>
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              serverStatus === "Connecté" 
                ? "bg-green-500" 
                : serverStatus === "Vérification..." 
                ? "bg-yellow-500" 
                : "bg-red-500"
            }`}
          ></div>
          <div>{serverStatus}</div>
        </div>
        <button
          onClick={checkServerConnection}
          className="ml-4 text-sm text-blue-500 hover:underline"
        >
          Vérifier
        </button>
      </div>
      
      {connectionError && (
        <div className="mt-1 text-sm text-red-500">{connectionError}</div>
      )}
    </div>
  );
}