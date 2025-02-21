"use client";

import Link from 'next/link';
import { useState } from "react";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, Bell, Shield, Settings, Users, Search, Database, BarChart } from 'lucide-react';

export default function Dashboard() {
  const [filter, setFilter] = useState("");

  const navItems = [
    { icon: Home, label: "Accueil", href: "/" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: Shield, label: "Sécurité", href: "/security" },
    { icon: Database, label: "Assets", href: "/assets" },
    { icon: Users, label: "Équipe", href: "/team" },
    { icon: BarChart, label: "Rapports", href: "/reports" },
    { icon: Settings, label: "Paramètres", href: "/settings" },
  ];

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
      <aside className="w-20 bg-[#1a237e] text-white">
        <div className="p-3 border-b border-blue-800">
          <div className="w-8 h-8 bg-white rounded-full mx-auto"/>
        </div>
        <nav className="py-4">
          {navItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href}
              className="flex flex-col items-center py-4 px-2 text-white/70 hover:text-white hover:bg-blue-800 transition-colors"
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] text-center">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-xl font-medium text-gray-900 mb-1">Inbox <span className="text-gray-500 font-normal">(106)</span></h1>
          <p className="text-sm text-gray-500">Détection en temps réel des problèmes de sécurité</p>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher"
              className="pl-9 pr-4 py-2 w-full border rounded-md text-sm"
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          
          <Button variant="outline" className="text-sm font-normal">
            Modules
          </Button>
          <Button variant="outline" className="text-sm font-normal">
            Criticité
          </Button>
          <Button variant="outline" className="text-sm font-normal">
            Catégorie
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
                    <Badge className="bg-blue-50 text-blue-700 font-normal">
                      {item.module}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className="bg-blue-50 text-blue-700 font-normal">
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