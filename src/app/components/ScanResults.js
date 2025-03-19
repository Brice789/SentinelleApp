'use client';
import { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/app/components/button";

export default function ScanResults({ scans }) {
  const [expandedScan, setExpandedScan] = useState(null);

  if (!scans.length) {
    return (
      <div className="mt-6">
        <p className="text-gray-500">Aucun scan effectué pour le moment.</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Terminé":
        return "text-green-600";
      case "En cours...":
        return "text-blue-600";
      case "Erreur":
      case "Timeout":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const toggleExpandScan = (scanId) => {
    if (expandedScan === scanId) {
      setExpandedScan(null);
    } else {
      setExpandedScan(scanId);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-semibold">Résultats des scans</h2>
      
      {scans.map((scan, index) => (
        <Card key={scan.id || index} className="w-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{scan.url}</CardTitle>
              <span className={`font-medium ${getStatusColor(scan.status)}`}>
                {scan.status}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">ID: {scan.taskId || "N/A"}</p>
                {scan.error && (
                  <p className="text-sm text-red-500">Erreur: {scan.error}</p>
                )}
              </div>
              
              {scan.status === "Terminé" && (
                <Button 
                  onClick={() => toggleExpandScan(index)}
                  variant="outline"
                  size="sm"
                >
                  {expandedScan === index ? "Masquer" : "Voir les détails"}
                </Button>
              )}
            </div>
            
            {expandedScan === index && scan.results && (
              <div className="mt-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Résultats de scan</h3>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(scan.results, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
            
            {/* Pour déboguer - afficher toujours les données du scan */}
            <div className="mt-2 text-xs text-gray-500">
              <details>
                <summary>Informations de débogage</summary>
                <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(scan, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}