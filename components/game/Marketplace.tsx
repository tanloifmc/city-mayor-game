"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface MarketplaceProps {
  userId: string;
}

interface Building {
  id: string;
  name: string;
  type: string;
  cost: number;
  income_per_hour: number;
  size_x: number;
  size_y: number;
  image_url: string;
  description: string;
}

export default function Marketplace({ userId }: MarketplaceProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [userGold, setUserGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch available buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from("buildings")
        .select("*")
        .order("cost", { ascending: true });

      if (buildingsError) {
        console.error("Error fetching buildings:", buildingsError);
        return;
      }

      setBuildings(buildingsData || []);

      // Fetch user gold
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("gold")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return;
      }

      setUserGold(userData.gold);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyBuilding = async (building: Building) => {
    if (userGold < building.cost) {
      alert("Not enough gold!");
      return;
    }

    try {
      // Update user gold
      const { error: updateError } = await supabase
        .from("users")
        .update({ gold: userGold - building.cost })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating user gold:", updateError);
        alert("Failed to purchase building");
        return;
      }

      // Update local state
      setUserGold(userGold - building.cost);
      alert(`Successfully purchased ${building.name}! Place it on your land.`);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to purchase building");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "residential":
        return "bg-blue-100 text-blue-800";
      case "commercial":
        return "bg-green-100 text-green-800";
      case "public":
        return "bg-purple-100 text-purple-800";
      case "decoration":
        return "bg-pink-100 text-pink-800";
      case "entertainment":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Marketplace</h2>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Marketplace
      </h2>
      
      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded">
        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
          Your Gold: 🪙 {userGold.toLocaleString()}
        </p>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {buildings.map((building) => (
          <div
            key={building.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedBuilding(building)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {building.name}
              </h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(building.type)}`}>
                {building.type}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {building.description}
            </p>
            
            <div className="flex justify-between items-center text-sm">
              <div className="space-y-1">
                <p className="text-yellow-600">
                  Cost: 🪙 {building.cost.toLocaleString()}
                </p>
                <p className="text-green-600">
                  Income: 🪙 {building.income_per_hour}/hour
                </p>
                <p className="text-blue-600">
                  Size: {building.size_x} × {building.size_y}
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuyBuilding(building);
                }}
                disabled={userGold < building.cost}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  userGold >= building.cost
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {buildings.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No buildings available. Check the Admin Panel to add some!
          </p>
        </div>
      )}
      
      {selectedBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              {selectedBuilding.name}
            </h3>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                {selectedBuilding.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getTypeColor(selectedBuilding.type)}`}>
                    {selectedBuilding.type}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Size:</span>
                  <span className="ml-2">{selectedBuilding.size_x} × {selectedBuilding.size_y}</span>
                </div>
                <div>
                  <span className="font-medium">Cost:</span>
                  <span className="ml-2 text-yellow-600">🪙 {selectedBuilding.cost.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium">Income:</span>
                  <span className="ml-2 text-green-600">🪙 {selectedBuilding.income_per_hour}/hour</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleBuyBuilding(selectedBuilding)}
                disabled={userGold < selectedBuilding.cost}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                  userGold >= selectedBuilding.cost
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Buy for 🪙 {selectedBuilding.cost.toLocaleString()}
              </button>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

