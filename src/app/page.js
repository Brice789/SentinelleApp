'use client';
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Filters from "./components/Filters";
import ScanResults from "./components/ScanResults";
import CommandRunner from "./components/CommandRunner";
import ServerTest from "./components/ServerTest";
import { Button } from "./components/button";

export default function Home() {
  const [user, setUser] = useState(null);
  const [url, setUrl] = useState("");
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommandRunner, setShowCommandRunner] = useState(false);

  // URL de l'API backend - assurez-vous que le protocole et le port sont corrects
  const API_URL = "http://localhost:8080"; // Utilisez "http://" et non "https://"

  const handleScan = async () => {
    if (!url) return;
    
    // Ajoute un nouveau scan avec statut "En cours"
    const newScan = { 
      id: Date.now().toString(), 
      url, 
      status: "En cours..." 
    };
    
    setScans((prevScans) => [...prevScans, newScan]);
    setIsLoading(true);
    
    try {
      // Appelle l'API pour démarrer le scan
      console.log(`Envoi de la requête à ${API_URL}/scan/`);
      const response = await fetch(`${API_URL}/scan/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target: url }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Réponse reçue:", data);
      const taskId = data.task_id;
      
      setScans((prevScans) =>
        prevScans.map((scan) =>
          scan.id === newScan.id ? { ...scan, taskId } : scan
        )
      );
      
      // Vérification des résultats toutes les 5 secondes (max 12 fois = 1 minute)
      let attempts = 0;
      const maxAttempts = 12;
      
      const checkResults = async () => {
        if (attempts >= maxAttempts) {
          setScans((prevScans) =>
            prevScans.map((scan) =>
              scan.id === newScan.id ? { ...scan, status: "Timeout" } : scan
            )
          );
          setIsLoading(false);
          return;
        }
        
        attempts++;
        console.log(`Vérification des résultats (${attempts}/${maxAttempts})`);
        
        try {
          const resultResponse = await fetch(`${API_URL}/results/${taskId}`);
          if (!resultResponse.ok) {
            throw new Error(`Erreur ${resultResponse.status}`);
          }
          
          const resultData = await resultResponse.json();
          console.log("Résultats reçus:", resultData);
          
          if (resultData.status === "completed") {
            setScans((prevScans) =>
              prevScans.map((scan) =>
                scan.id === newScan.id ? { 
                  ...scan, 
                  status: "Terminé", 
                  results: resultData.result 
                } : scan
              )
            );
            setIsLoading(false);
          } else if (resultData.status === "error") {
            setScans((prevScans) =>
              prevScans.map((scan) =>
                scan.id === newScan.id ? { 
                  ...scan, 
                  status: "Erreur", 
                  error: resultData.error 
                } : scan
              )
            );
            setIsLoading(false);
          } else {
            // Si toujours en attente, vérifier à nouveau après 5 secondes
            setTimeout(checkResults, 5000);
          }
        } catch (error) {
          console.error("Erreur lors de la vérification des résultats:", error);
          setScans((prevScans) =>
            prevScans.map((scan) =>
              scan.id === newScan.id ? { 
                ...scan, 
                status: "Erreur", 
                error: error.message 
              } : scan
            )
          );
          setIsLoading(false);
        }
      };
      
      // Démarrer la vérification après un court délai
      setTimeout(checkResults, 5000);
      
    } catch (error) {
      console.error("Erreur lors du démarrage du scan:", error);
      setScans((prevScans) =>
        prevScans.map((scan) =>
          scan.id === newScan.id ? { 
            ...scan, 
            status: "Erreur", 
            error: error.message 
          } : scan
        )
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
     
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {user ? (
          <>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">Scanner de vulnérabilités</h1>
              <div className="flex gap-2">
                <Button 
                  className="bg-blue-500" 
                  onClick={() => setShowCommandRunner(!showCommandRunner)}
                >
                  {showCommandRunner ? "Masquer les commandes" : "Mode commandes avancées"}
                </Button>
                <Button className="bg-red-500" onClick={() => setUser(null)}>Se déconnecter</Button>
              </div>
            </div>
            
            {/* Filters */}
            <Filters />
            
            {/* Scanner Input */}
            <div className="mt-4 flex gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="border p-2 rounded w-64 shadow-sm focus:ring focus:ring-blue-400"
              />
              <Button 
                onClick={handleScan} 
                disabled={isLoading || !url}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {isLoading ? "En cours..." : "Scanner"}
              </Button>
            </div>
            
            {/* Info de débogage API */}
            <div className="mt-2 text-xs text-gray-500">
              <p>API: {API_URL}</p>
            </div>
            
            {/* Test de connexion au serveur */}
            <ServerTest />
            
            {/* Scan Results */}
            <ScanResults scans={scans} />
            
            {/* Command Runner (conditionnel) */}
            {showCommandRunner && <CommandRunner />}
          </>
        ) : (
          <div className="flex justify-center items-center w-full h-full">
            <Button onClick={() => setUser({})} className="bg-blue-500 text-white px-4 py-2 rounded shadow">Se connecter</Button>
          </div>
        )}
      </div>
    </div>
  );
}