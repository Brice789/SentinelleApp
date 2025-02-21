"use client";  // Ajoute cett


import { useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const data = [
  {
    problem: "Vos serveurs sont mal configurés (chiffrement SSL/TLS faible)",
    date: "05 nov. 2024, 11h03",
    module: "Scan externe",
    category: "Chiffrement mal configuré",
    severity: "Critique",
  },
  {
    problem: "Enregistrement DMARC non configuré",
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
  },
];

export default function Dashboard() {
  const [filter, setFilter] = useState("");

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-6">Menu</h2>
        <ul>
          <li className="mb-4"><a href="#" className="hover:underline">Dashboard</a></li>
          <li className="mb-4"><a href="#" className="hover:underline">Alerts</a></li>
          <li className="mb-4"><a href="#" className="hover:underline">Settings</a></li>
        </ul>
      </aside>
      
      <main className="p-6 bg-gray-900 flex-1">
        <h1 className="text-3xl font-bold mb-4 text-white">Inbox des vulnérabilités</h1>
        <input
          type="text"
          placeholder="Rechercher..."
          className="p-2 border rounded w-full mb-4 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setFilter(e.target.value)}
        />
        <Table className="w-full bg-gray-800 shadow-lg rounded-lg">
          <Thead>
            <Tr className="bg-gray-700 text-white">
              <Th>Problèmes</Th>
              <Th>Date</Th>
              <Th>Modules</Th>
              <Th>Catégorie</Th>
              <Th>Criticité</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data
              .filter((item) =>
                item.problem.toLowerCase().includes(filter.toLowerCase())
              )
              .map((item, index) => (
                <Tr
                  key={index}
                  className="hover:bg-gray-700"
                  style={{ backgroundColor: index % 2 === 0 ? '#2d2d2d' : '#383838' }}
                >
                  <Td className="text-gray-300">{item.problem}</Td>
                  <Td className="text-gray-400">{item.date}</Td>
                  <Td className="text-gray-400">{item.module}</Td>
                  <Td>
                    <Badge>{item.category}</Badge>
                  </Td>
                  <Td>
                    <Badge
                      className={`${
                        item.severity === "Critique" ? "bg-red-600" :
                        item.severity === "Élevée" ? "bg-yellow-600" :
                        "bg-green-600"
                      } text-white`}
                    >
                      {item.severity}
                    </Badge>
                  </Td>
                  <Td>
                    <Button>Détails</Button>
                  </Td>
                </Tr>
              ))}
          </Tbody>
        </Table>
      </main>
    </div>
  );
}