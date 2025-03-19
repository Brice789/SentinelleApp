// src/components/Filters.js
import { Search, Filter } from "lucide-react";

export default function Filters() {
  return (
    <div className="mt-4 flex gap-4">
      <div className="relative w-64">
        <Search className="absolute left-3 top-2.5 text-gray-400" />
        <input type="text" placeholder="Rechercher..." className="pl-10 pr-4 py-2 border rounded w-full" />
      </div>
      <button className="bg-gray-200 text-black flex gap-2 p-2 rounded">
        <Filter /> Filtres
      </button>
    </div>
  );
}
