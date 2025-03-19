// src/components/Sidebar.js
import { Menu, Search, Filter, Home, Settings } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-20 bg-blue-900 text-white flex flex-col items-center py-6 space-y-6">
      <Menu className="w-8 h-8" />
      <div className="space-y-4">
        <button className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
          <Home className="w-6 h-6" />
        </button>
        <button className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
          <Search className="w-6 h-6" />
        </button>
        <button className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
