'use client';
import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Filters from "./components/Filters";
import CommandRunner from "./components/CommandRunner";
import { Button } from "./components/button";
import TerminalOutputSimple from "./components/TerminalOutputSimple";

export default function Home() {
  const [user, setUser] = useState(null);
  const [url, setUrl] = useState("");
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommandRunner, setShowCommandRunner] = useState(false);
  
  // Pour l'affichage des détails
  const [selectedScan, setSelectedScan] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  
  // États pour la vérification du serveur
  const [serverStatus, setServerStatus] = useState("Vérification...");
  const [connectionError, setConnectionError] = useState(null);

  // Pour stopper les requêtes en boucle
  const intervalRef = useRef(null);

  // URL de l'API backend
  const API_URL = "http://localhost:3010";

  // Vérifier la connexion au serveur et charger les scans au chargement de la page
  useEffect(() => {
    checkServerConnection();
    fetchScans();
    
    // Actualiser les scans une seule fois au chargement, pas en boucle
    // Si vous voulez une actualisation périodique, décommentez la ligne ci-dessous
    // intervalRef.current = setInterval(fetchScans, 30000); // Toutes les 30 secondes
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Fonction pour vérifier la connexion au serveur
  const checkServerConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      setServerStatus("Vérification...");
      setConnectionError(null);
      
      const response = await fetch(`${API_URL}/check-domain`, {
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
      
      if (error.name === 'AbortError') {
        setConnectionError("Délai d'attente dépassé. Le serveur ne répond pas.");
      } else if (error.message.includes('Network')) {
        setConnectionError("Erreur de réseau. Vérifiez que le serveur est démarré.");
      } else {
        setConnectionError(error.message);
      }
    }
  };

  // Fonction pour récupérer la liste des scans
  const fetchScans = async () => {
    try {
      const response = await fetch(`${API_URL}/results`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Données reçues:", data);
      
      if (data.tasks && Array.isArray(data.tasks)) {
        setScans(data.tasks.map(task => ({
          ...task,
          // Convertir les formats de date pour un affichage cohérent
          startTime: new Date(task.startTime),
          endTime: task.endTime ? new Date(task.endTime) : null
        })));
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des scans:", error);
    }
  };

  // Fonction pour démarrer un nouveau scan
  const handleScan = async () => {
    if (!url || isLoading) return;
    
    // Nettoyer l'URL si nécessaire
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'http://' + targetUrl;
    }
    
    // Ajouter un nouvel élément au tableau avec statut "En cours..."
    const newScan = { 
      id: `local-${Date.now()}`, 
      target: targetUrl, 
      status: "En cours...",
      startTime: new Date()
    };
    
    setScans(prevScans => [...prevScans, newScan]);
    setIsLoading(true);
    
    try {
      // Appeler l'API pour démarrer le scan
      console.log(`Envoi de la requête à ${API_URL}/scan`);
      const response = await fetch(`${API_URL}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target: targetUrl }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Réponse reçue:", data);
      
      // Si nous avons un ID de tâche, mettre à jour le scan local
      if (data.task_id) {
        setScans(prevScans => 
          prevScans.map(scan => 
            scan.id === newScan.id 
              ? { 
                  ...scan, 
                  taskId: data.task_id,
                  status: "En cours",
                  localId: scan.id 
                }
              : scan
          )
        );
        
        // Surveiller le statut du scan
        pollScanStatus(data.task_id, newScan.id);
      } else {
        throw new Error("Aucun ID de tâche retourné par le serveur");
      }
    } catch (error) {
      console.error("Erreur lors du démarrage du scan:", error);
      setScans(prevScans => 
        prevScans.map(scan => 
          scan.id === newScan.id 
            ? { ...scan, status: "Erreur", error: error.message }
            : scan
        )
      );
      setIsLoading(false);
    }
  };
  
  // Fonction pour surveiller le statut d'un scan
  const pollScanStatus = async (taskId, localId) => {
    try {
      const response = await fetch(`${API_URL}/results/${taskId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Tâche ${taskId} non trouvée, nouvelle tentative dans 5 secondes`);
          setTimeout(() => pollScanStatus(taskId, localId), 5000);
          return;
        }
        throw new Error(`Erreur ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Statut du scan ${taskId}:`, data);
      
      // Mettre à jour l'état du scan
      setScans(prevScans => 
        prevScans.map(scan => {
          // Trouver le scan par ID local ou par taskId
          if (scan.id === localId || scan.taskId === taskId) {
            if (data.status === 'completed') {
              setIsLoading(false);
              return { 
                ...scan, 
                id: taskId, // Remplacer l'ID local par l'ID de tâche
                status: "Terminé", 
                results: data.result,
                endTime: new Date(data.end_time)
              };
            } else if (data.status === 'error') {
              setIsLoading(false);
              return { 
                ...scan, 
                id: taskId,
                status: "Erreur", 
                error: data.error
              };
            } else {
              // Toujours en cours
              return { 
                ...scan, 
                id: taskId,
                status: "En cours",
                progress: data.progress || 0,
                currentStep: data.current_step || "En attente"
              };
            }
          }
          return scan;
        })
      );
      
      // Si le scan n'est pas terminé, continuer à vérifier
      if (data.status !== 'completed' && data.status !== 'error') {
        setTimeout(() => pollScanStatus(taskId, localId), 5000);
      } else {
        // Scan terminé ou en erreur, actualiser la liste complète
        fetchScans();
      }
      
    } catch (error) {
      console.error(`Erreur lors de la vérification du statut du scan ${taskId}:`, error);
      
      // En cas d'erreur, réessayer après un délai (mais au maximum 5 fois)
      const retryCount = (scan => (scan?.retryCount || 0) + 1)(
        scans.find(scan => scan.id === localId || scan.taskId === taskId)
      );
      
      if (retryCount <= 5) {
        setScans(prevScans => 
          prevScans.map(scan => 
            (scan.id === localId || scan.taskId === taskId)
              ? { ...scan, retryCount }
              : scan
          )
        );
        setTimeout(() => pollScanStatus(taskId, localId), 5000);
      } else {
        // Trop d'échecs consécutifs
        setScans(prevScans => 
          prevScans.map(scan => 
            (scan.id === localId || scan.taskId === taskId)
              ? { 
                  ...scan, 
                  status: "Erreur", 
                  error: "Impossible de récupérer le statut après plusieurs tentatives" 
                }
              : scan
          )
        );
        setIsLoading(false);
      }
    }
  };

  // Fonction pour afficher les détails d'un scan
  const viewScanDetails = async (scanId) => {
    try {
      const response = await fetch(`${API_URL}/results/${scanId}`);
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      const data = await response.json();
      setSelectedScan(data);
      setActiveTab('summary');
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails du scan ${scanId}:`, error);
    }
  };

  // Fonction pour fermer les détails du scan
  const closeScanDetails = () => {
    setSelectedScan(null);
  };

  // Fonction pour calculer les statistiques des vulnérabilités
  const calculateVulnerabilityStats = (findings) => {
    if (!findings || !Array.isArray(findings)) return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    
    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    findings.forEach(finding => {
      const severity = finding.severity?.toLowerCase();
      if (severity in stats) {
        stats[severity]++;
      } else if (severity === 'info') {
        stats.low++;
      }
    });
    
    stats.total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    return stats;
  };

  // Fonction pour exporter les résultats
  const exportResults = (scan, format) => {
    if (!scan || !scan.results) return;
    
    const findings = scan.results.findings || [];
    const target = scan.target;
    const scanDate = new Date().toISOString().slice(0, 10);
    
    let data;
    let filename;
    let mimeType;
    
    switch (format) {
      case 'csv':
        data = 'Niveau de risque,Port,Service,Description,Recommandation,Domaine\n';
        
        findings.forEach(finding => {
          const severity = finding.severity || 'Info';
          const port = finding.port || '-';
          const service = finding.service || '-';
          const description = (finding.description || '').replace(/"/g, '""');
          const recommendation = (finding.recommendation || '').replace(/"/g, '""');
          const domain = finding.domain || target;
          
          data += `"${severity}","${port}","${service}","${description}","${recommendation}","${domain}"\n`;
        });
        
        filename = `scan_securite_${target.replace(/[^a-zA-Z0-9]/g, '_')}_${scanDate}.csv`;
        mimeType = 'text/csv;charset=utf-8';
        break;
        
      case 'json':
        const stats = calculateVulnerabilityStats(findings);
        
        const jsonData = {
          scan_info: {
            target: target,
            scan_date: scan.startTime?.toISOString() || new Date().toISOString(),
            tools_used: ['subfinder', 'nmap', 'nuclei']
          },
          summary: {
            total_vulnerabilities: stats.total,
            by_severity: {
              critical: stats.critical,
              high: stats.high,
              medium: stats.medium,
              low: stats.low
            },
            subdomains: scan.results.subdomains?.length || 0
          },
          vulnerabilities: findings.map(finding => ({
            severity: finding.severity || 'Info',
            port: finding.port ? parseInt(finding.port) : null,
            service: finding.service || null,
            description: finding.description || '',
            recommendation: finding.recommendation || '',
            domain: finding.domain || target
          }))
        };
        
        data = JSON.stringify(jsonData, null, 2);
        filename = `scan_securite_${target.replace(/[^a-zA-Z0-9]/g, '_')}_${scanDate}.json`;
        mimeType = 'application/json';
        break;
        
      case 'txt':
        const txtStats = calculateVulnerabilityStats(findings);
        
        data = `Rapport de scan de sécurité pour ${target}\n`;
        data += `Date du scan: ${scan.startTime?.toISOString() || new Date().toISOString()}\n\n`;
        data += `RÉSUMÉ:\n`;
        data += `- Vulnérabilités critiques: ${txtStats.critical}\n`;
        data += `- Vulnérabilités élevées: ${txtStats.high}\n`;
        data += `- Vulnérabilités moyennes: ${txtStats.medium}\n`;
        data += `- Vulnérabilités faibles: ${txtStats.low}\n`;
        data += `- Total des vulnérabilités: ${txtStats.total}\n`;
        data += `- Sous-domaines: ${scan.results.subdomains?.length || 0}\n\n`;
        
        data += `VULNÉRABILITÉS DÉTECTÉES:\n\n`;
        
        if (findings.length === 0) {
          data += `Aucune vulnérabilité n'a été détectée.\n\n`;
        } else {
          findings.forEach((finding, index) => {
            const severity = finding.severity || 'Info';
            const port = finding.port || '-';
            const service = finding.service || '-';
            const description = finding.description || '';
            const recommendation = finding.recommendation || '';
            const domain = finding.domain || target;
            
            data += `${index + 1}. Vulnérabilité: [${severity}] (${port}/${service})\n`;
            data += `   Domaine: ${domain}\n`;
            data += `   Description: ${description}\n`;
            data += `   Recommandation: ${recommendation}\n\n`;
          });
        }
        
        data += `SOUS-DOMAINES DÉCOUVERTS:\n\n`;
        if (scan.results.subdomains && scan.results.subdomains.length > 0) {
          scan.results.subdomains.forEach((domain, index) => {
            data += `${index + 1}. ${domain}\n`;
          });
        } else {
          data += `Aucun sous-domaine découvert.\n`;
        }
        
        filename = `scan_securite_${target.replace(/[^a-zA-Z0-9]/g, '_')}_${scanDate}.txt`;
        mimeType = 'text/plain';
        break;
    }
    
    // Créer un objet Blob et le télécharger
    if (data) {
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
            <div className="flex justify-between items-center mb-6">
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
            
            {/* Filtres (si nécessaire) */}
            {!selectedScan && <Filters />}
            
            {/* Scanner Input - Affiché uniquement quand aucun scan n'est sélectionné */}
            {!selectedScan && (
              <div className="bg-white p-4 rounded shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="example.com"
                      className="border p-2 rounded w-full shadow-sm focus:ring focus:ring-blue-400"
                    />
                  </div>
                  <Button 
                    onClick={handleScan} 
                    disabled={isLoading || !url}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Scan en cours...
                      </span>
                    ) : "Scanner"}
                  </Button>
                </div>
                
                {/* Status du serveur */}
                <div className="mt-4 flex items-center">
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
            )}
            
            {/* Détails d'un scan sélectionné */}
            {selectedScan && (
              <div className="bg-white rounded shadow-sm overflow-hidden mb-6">
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Détails du scan: {selectedScan.target}
                  </h2>
                  <button 
                    onClick={closeScanDetails}
                    className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded"
                  >
                    Retour
                  </button>
                </div>
                
                {/* Informations générales */}
                <div className="p-4 border-b">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Domaine cible</div>
                      <div className="font-medium">{selectedScan.target}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Date du scan</div>
                      <div className="font-medium">
                        {new Date(selectedScan.start_time).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Durée</div>
                      <div className="font-medium">
                        {selectedScan.duration ? `${selectedScan.duration} secondes` : 'En cours...'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Onglets */}
                <div className="border-b">
                  <div className="flex">
                    <button 
                      className={`py-2 px-4 ${activeTab === 'summary' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('summary')}
                    >
                      Résumé
                    </button>
                    <button 
                      className={`py-2 px-4 ${activeTab === 'subdomains' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('subdomains')}
                    >
                      Sous-domaines
                    </button>
                    <button 
                      className={`py-2 px-4 ${activeTab === 'vulnerabilities' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('vulnerabilities')}
                    >
                      Vulnérabilités
                    </button>
                    <button 
                      className={`py-2 px-4 ${activeTab === 'terminal' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('terminal')}
                    >
                      Terminal
                    </button>
                  </div>
                </div>
                
                {/* Contenu des onglets */}
                <div className="p-4">
                  {/* Onglet Résumé */}
                  {activeTab === 'summary' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Résumé du scan</h3>
                      
                      {selectedScan.result && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Statistiques */}
                          <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
                            <div className="text-3xl font-bold text-red-600">
                              {calculateVulnerabilityStats(selectedScan.result.findings).critical}
                            </div>
                            <div className="text-sm text-red-700">Vulnérabilités critiques</div>
                          </div>
                          
                          <div className="bg-orange-50 border border-orange-200 rounded p-4 text-center">
                            <div className="text-3xl font-bold text-orange-600">
                              {calculateVulnerabilityStats(selectedScan.result.findings).high}
                            </div>
                            <div className="text-sm text-orange-700">Vulnérabilités élevées</div>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {calculateVulnerabilityStats(selectedScan.result.findings).medium}
                            </div>
                            <div className="text-sm text-blue-700">Vulnérabilités moyennes</div>
                          </div>
                          
                          <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                            <div className="text-3xl font-bold text-green-600">
                              {calculateVulnerabilityStats(selectedScan.result.findings).low}
                            </div>
                            <div className="text-sm text-green-700">Vulnérabilités faibles</div>
                          </div>
                          
                          <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                            <div className="text-3xl font-bold text-gray-700">
                              {calculateVulnerabilityStats(selectedScan.result.findings).total}
                            </div>
                            <div className="text-sm text-gray-600">Total des vulnérabilités</div>
                          </div>
                          
                          <div className="bg-purple-50 border border-purple-200 rounded p-4 text-center">
                            <div className="text-3xl font-bold text-purple-600">
                              {selectedScan.result.subdomains?.length || 0}
                            </div>
                            <div className="text-sm text-purple-700">Sous-domaines découverts</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Boutons d'exportation */}
                      <div className="mt-6 flex gap-2">
                        <Button
                          onClick={() => exportResults(selectedScan, 'csv')}
                          className="bg-green-600 text-white"
                        >
                          Exporter en CSV
                        </Button>
                        <Button
                          onClick={() => exportResults(selectedScan, 'json')}
                          className="bg-blue-600 text-white"
                        >
                          Exporter en JSON
                        </Button>
                        <Button
                          onClick={() => exportResults(selectedScan, 'txt')}
                          className="bg-gray-600 text-white"
                        >
                          Exporter en TXT
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Onglet Sous-domaines */}
                  {activeTab === 'subdomains' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Sous-domaines découverts</h3>
                      
                      {selectedScan.result?.subdomains && selectedScan.result.subdomains.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {selectedScan.result.subdomains.map((domain, index) => (
                            <div 
                              key={index} 
                              className="bg-gray-50 border border-gray-200 rounded p-2 text-sm"
                            >
                              {domain}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-700">
                          Aucun sous-domaine découvert
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Onglet Vulnérabilités */}
                  {activeTab === 'vulnerabilities' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Vulnérabilités détectées</h3>
                      
                      {selectedScan.result?.findings && selectedScan.result.findings.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white">
                            <thead className="bg-gray-50 text-gray-700">
                              <tr>
                                <th className="py-2 px-3 text-left">Niveau de risque</th>
                                <th className="py-2 px-3 text-left">Port/Service</th>
                                <th className="py-2 px-3 text-left">Description</th>
                                <th className="py-2 px-3 text-left">Recommandation</th>
                                <th className="py-2 px-3 text-left">Domaine</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedScan.result.findings.map((finding, index) => {
                                const severity = finding.severity?.toLowerCase() || 'info';
                                let severityClass = 'bg-gray-100 text-gray-800';
                                
                                if (severity === 'critical') {
                                  severityClass = 'bg-red-100 text-red-800';
                                } else if (severity === 'high') {
                                  severityClass = 'bg-orange-100 text-orange-800';
                                } else if (severity === 'medium') {
                                  severityClass = 'bg-blue-100 text-blue-800';
                                } else if (severity === 'low' || severity === 'info') {
                                  severityClass = 'bg-green-100 text-green-800';
                                }
                                
                                return (
                                  <tr key={index}>
                                    <td className="py-2 px-3">
                                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${severityClass}`}>
                                        {finding.severity || 'Info'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3">
                                      {finding.port ? `${finding.port} / ${finding.service || 'N/A'}` : 'N/A'}
                                    </td>
                                    <td className="py-2 px-3">{finding.description || 'Aucune description'}</td>
                                    <td className="py-2 px-3">{finding.recommendation || 'Aucune recommandation'}</td>
                                    <td className="py-2 px-3">{finding.domain || selectedScan.target}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded p-4 text-green-700">
                          Aucune vulnérabilité détectée
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
                          
              {/* Onglet Terminal */}
              {activeTab === 'terminal' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Sorties de terminal</h3>
                  
                  <div className="space-y-6">
                    {/* Sortie Subfinder */}
                    <div>
                      <h4 className="text-md font-medium mb-2">Subfinder - Découverte de sous-domaines</h4>
                      <TerminalOutputSimple 
                        outputText={selectedScan.result?.terminalOutputs?.subfinder || "Aucune sortie disponible"}
                        commandText={selectedScan.result?.terminalCommands?.subfinder}
                        title="Subfinder" 
                      />
                    </div>
                    
                    {/* Sortie Nmap */}
                    <div>
                      <h4 className="text-md font-medium mb-2">Nmap - Scan de ports</h4>
                      <TerminalOutputSimple 
                        outputText={selectedScan.result?.terminalOutputs?.nmap || "Aucune sortie disponible"}
                        commandText={selectedScan.result?.terminalCommands?.nmap}
                        title="Nmap" 
                      />
                    </div>
                    
                    {/* Sortie Nuclei */}
                    <div>
                      <h4 className="text-md font-medium mb-2">Nuclei - Scan de vulnérabilités</h4>
                      <TerminalOutputSimple 
                        outputText={selectedScan.result?.terminalOutputs?.nuclei || "Aucune sortie disponible"}
                        commandText={selectedScan.result?.terminalCommands?.nuclei}
                        title="Nuclei" 
                      />
                    </div>
                  </div>
                </div>
              )}
            
            {/* Liste des scans - Affichée uniquement quand aucun scan n'est sélectionné */}
            {!selectedScan && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Scans récents</h2>
                {scans.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow-sm overflow-hidden">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                          <th className="py-3 px-4 text-left font-medium">Domaine</th>
                          <th className="py-3 px-4 text-left font-medium">Date</th>
                          <th className="py-3 px-4 text-left font-medium">Statut</th>
                          <th className="py-3 px-4 text-left font-medium">Résultats</th>
                          <th className="py-3 px-4 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {scans.map((scan, index) => (
                          <tr 
                            key={scan.id} 
                            className={`hover:bg-blue-50 transition-colors`}
                          >
                            <td className="py-3 px-4">
                              <div className="font-medium">{scan.target}</div>
                              {scan.id && <div className="text-xs text-gray-500">ID: {scan.id}</div>}
                            </td>
                            <td className="py-3 px-4">
                              {scan.startTime ? (
                                <div>
                                  <div>{scan.startTime.toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-500">
                                    {scan.startTime.toLocaleTimeString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {(scan.status === "En cours..." || scan.status === "En cours" || scan.status === "running") && (
                                  <div className="mr-2 w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></div>
                                )}
                                {(scan.status === "Terminé" || scan.status === "completed") && (
                                  <div className="mr-2 w-3 h-3 rounded-full bg-green-500"></div>
                                )}
                                {(scan.status === "Erreur" || scan.status === "error") && (
                                  <div className="mr-2 w-3 h-3 rounded-full bg-red-500"></div>
                                )}
                                <span 
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    (scan.status === "Terminé" || scan.status === "completed") 
                                      ? 'bg-green-100 text-green-800' 
                                      : (scan.status === "Erreur" || scan.status === "error")
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {scan.status}
                                </span>
                              </div>
                              
                              {/* Afficher la progression si disponible */}
                              {(scan.status === "En cours" || scan.status === "running") && scan.progress > 0 && (
                                <div className="mt-2">
                                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full" 
                                      style={{ width: `${scan.progress}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {scan.currentStep || 'En cours...'}
                                  </div>
                                </div>
                              )}
                              
                              {/* Afficher l'erreur si disponible */}
                              {(scan.status === "Erreur" || scan.status === "error") && scan.error && (
                                <div className="text-xs text-red-500 mt-1">
                                  {scan.error}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {scan.results ? (
                                <div>
                                  <div>
                                    <span className="font-medium">Sous-domaines:</span> {scan.results.subdomains?.length || 0}
                                  </div>
                                  <div>
                                    <span className="font-medium">Vulnérabilités:</span> {scan.results.findings?.length || 0}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Non disponible</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <button 
                                onClick={() => viewScanDetails(scan.id)}
                                className="text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                                disabled={scan.status === "En cours..." || scan.status === "En cours"}
                              >
                                Détails
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white p-6 text-center rounded shadow">
                    <p className="text-gray-500">Aucun scan à afficher pour le moment.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Entrez un domaine ci-dessus et cliquez sur "Scanner" pour commencer.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Command Runner (conditionnel) */}
            {showCommandRunner && <CommandRunner />}
          </>
        ) : (
          <div className="flex justify-center items-center w-full h-full">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h2 className="text-2xl font-bold mb-6">Scanner de vulnérabilités</h2>
              <p className="text-gray-600 mb-6">Connectez-vous pour accéder au scanner de vulnérabilités.</p>
              <Button 
                onClick={() => setUser({})} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md shadow transition-colors"
              >
                Se connecter
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}