"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Building {
  id: string;
  name: string;
  type: string;
  price: number;
  income_per_hour: number;
  size_x: number;
  size_y: number;
  image_url: string | null;
  description: string | null;
}

interface MarketplaceProps {
  userId: string;
}

export default function Marketplace({ userId }: MarketplaceProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [playerGold, setPlayerGold] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    fetchBuildings();
    fetchPlayerGold();
  }, [userId]);

  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;
      setBuildings(data || []);
    } catch (error) {
      console.error("Error fetching buildings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerGold = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("gold")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setPlayerGold(data.gold);
    } catch (error) {
      console.error("Error fetching player gold:", error);
    }
  };

  const handleBuyBuilding = async (building: Building) => {
    if (playerGold < building.price) {
      alert("Not enough gold to buy this building!");
      return;
    }

    try {
      // Start a transaction to deduct gold and add building
      const { error: goldError } = await supabase
        .from("users")
        .update({ gold: playerGold - building.price })
        .eq("id", userId);

      if (goldError) throw goldError;

      // For now, place building at first available position (0,0)
      // In a full implementation, you'd let the player choose the position
      const { error: buildingError } = await supabase
        .from("player_buildings")
        .insert([
          {
            user_id: userId,
            building_id: building.id,
            position_x: 0,
            position_y: 0,
          },
        ]);

      if (buildingError) {
        // Rollback gold deduction if building placement fails
        await supabase
          .from("users")
          .update({ gold: playerGold })
          .eq("id", userId);
        throw buildingError;
      }

      // Update local state
      setPlayerGold(playerGold - building.price);
      alert(`Successfully purchased ${building.name}!`);
      
    } catch (error) {
      console.error("Error buying building:", error);
      alert("Error purchasing building. Please try again.");
    }
  };

  const getBuildingTypeColor = (type: string) => {
    switch (type) {
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
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Marketplace
      </h2>
      
      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
        <p className="text-sm font-medium">
          Your Gold: <span className="text-yellow-600">{playerGold.toLocaleString()} 🪙</span>
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {buildings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No buildings available. Ask admin to add some buildings!
          </p>
        ) : (
          buildings.map((building) => (
            <div
              key={building.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedBuilding(building)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-800 dark:text-white">
                  {building.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getBuildingTypeColor(
                    building.type
                  )}`}
                >
                  {building.type}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>Price: <span className="font-medium text-yellow-600">{building.price} 🪙</span></p>
                <p>Income: <span className="font-medium text-green-600">{building.income_per_hour}/hour</span></p>
                <p>Size: {building.size_x}×{building.size_y}</p>
                {building.description && (
                  <p className="text-xs">{building.description}</p>
                )}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuyBuilding(building);
                }}
                disabled={playerGold < building.price}
                className={`mt-3 w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  playerGold >= building.price
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {playerGold >= building.price ? "Buy Now" : "Not Enough Gold"}
              </button>
            </div>
          ))
        )}
      </div>
      
      {selectedBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">{selectedBuilding.name}</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Type:</strong> {selectedBuilding.type}</p>
              <p><strong>Price:</strong> {selectedBuilding.price} 🪙</p>
              <p><strong>Income:</strong> {selectedBuilding.income_per_hour}/hour</p>
              <p><strong>Size:</strong> {selectedBuilding.size_x}×{selectedBuilding.size_y}</p>
              {selectedBuilding.description && (
                <p><strong>Description:</strong> {selectedBuilding.description}</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleBuyBuilding(selectedBuilding)}
                disabled={playerGold < selectedBuilding.price}
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  playerGold >= selectedBuilding.price
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Buy for {selectedBuilding.price} 🪙
              </button>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

