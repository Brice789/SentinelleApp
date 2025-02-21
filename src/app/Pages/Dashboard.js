"use client";  // Ajoute cett

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { useState } from "react";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [filter, setFilter] = useState("");

  const data = [
    {
      problem: "Vos serveurs sont mal configurés (chiffrement SSL/TLS faible)",
      date: "05 nov. 2024, 11h03",
      module: "Scan externe",
      category: "Chiffrement mal configuré",
      severity: "Critique",
    },
    {
      problem: "Enregistrement DMARC configuré mais non appliqué",
      date: "05 nov. 2024, 11h03",
      module: "Scan externe",
      category: "Nom de domaine non sécurisé",
      severity: "Critique",
    },
    {
      problem: "Enregistrement SPF trop permissif",
      date: "05 nov. 2024, 11h03",
      module: "Scan externe",
      category: "Nom de domaine non sécurisé",
      severity: "Critique",
    },
    {
      problem: "Une base de données de votre entreprise (PostgreSQL DB) est exposée",
      date: "05 nov. 2024, 11h03", 
      module: "Scan externe",
      category: "Base de données à risque",
      severity: "Élevée",
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-14 bg-[#1a237e] text-white">
        <div className="p-3 border-b border-blue-800">
          <div className="w-8 h-8 bg-white rounded-full"/>
        </div>
      </aside>
      
      <main className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-xl font-medium text-gray-900 mb-1">Inbox <span className="text-gray-500 font-normal">(106)</span></h1>
          <p className="text-sm text-gray-500">Détection en temps réel des problèmes de sécurité</p>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.3-4.3"/>
            </svg>
            <input
              type="text"
              placeholder="Rechercher"
              className="pl-9 pr-4 py-2 w-full border rounded-md text-sm"
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          
          <Button variant="outline" className="text-sm font-normal">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16v4H4zM4 12h16v4H4zM4 20h16"/>
            </svg>
            Modules
            <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </Button>
          
          <Button variant="outline" className="text-sm font-normal">
            Criticité
          </Button>
          
          <Button variant="outline" className="text-sm font-normal">
            Catégorie
            <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <Button variant="link" className="text-blue-600 font-normal text-sm p-0">
            Ouvert <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">38</span>
          </Button>
          <Button variant="link" className="text-gray-500 font-normal text-sm p-0">
            Clôturé <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">8</span>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="w-8 p-4">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left p-4 text-xs font-medium text-gray-500">PROBLÈMES</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500">DATE DE DÉTECTION</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500">MODULES</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500">CATÉGORIE</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500">CRITICITÉ</th>
                <th className="w-8 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="p-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-900">{item.problem}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-normal">
                      {item.module}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-normal">
                      {item.category}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={`font-normal ${
                      item.severity === "Critique" ? "bg-red-100 text-red-700" : 
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {item.severity}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" className="p-1 h-auto">
                      <svg className="w-4 h-4" viewBox="0 0 16 16">
                        <circle cx="8" cy="2" r="2" className="fill-gray-600"/>
                        <circle cx="8" cy="8" r="2" className="fill-gray-600"/>
                        <circle cx="8" cy="14" r="2" className="fill-gray-600"/>
                      </svg>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
