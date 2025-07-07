"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface GameBoardProps {
  userId: string;
}

interface Building {
  id: string;
  name: string;
  type: string;
  image_url: string;
}

interface PlacedBuilding {
  id: string;
  building_id: string;
  x: number;
  y: number;
  building: Building;
}

export default function GameBoard({ userId }: GameBoardProps) {
  const [landSize, setLandSize] = useState({ x: 10, y: 10 });
  const [placedBuildings, setPlacedBuildings] = useState<PlacedBuilding[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchGameData();
  }, [userId]);

  const fetchGameData = async () => {
    try {
      // Fetch user land size
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("land_size_x, land_size_y")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return;
      }

      setLandSize({ x: userData.land_size_x, y: userData.land_size_y });

      // Fetch placed buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from("user_buildings")
        .select(`
          id,
          building_id,
          x,
          y,
          building:buildings(id, name, type, image_url)
        `)
        .eq("user_id", userId);

      if (buildingsError) {
        console.error("Error fetching buildings:", buildingsError);
        return;
      }

      setPlacedBuildings(buildingsData || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (x: number, y: number) => {
    setSelectedCell({ x, y });
  };

  const getBuildingAtPosition = (x: number, y: number) => {
    return placedBuildings.find(building => building.x === x && building.y === y);
  };

  const renderCell = (x: number, y: number) => {
    const building = getBuildingAtPosition(x, y);
    const isSelected = selectedCell?.x === x && selectedCell?.y === y;
    
    let cellClass = "w-8 h-8 border border-gray-300 cursor-pointer transition-colors ";
    
    if (building) {
      cellClass += "bg-blue-500 hover:bg-blue-600 ";
    } else {
      cellClass += "bg-green-200 hover:bg-green-300 ";
    }
    
    if (isSelected) {
      cellClass += "ring-2 ring-yellow-400 ";
    }

    return (
      <div
        key={`${x}-${y}`}
        className={cellClass}
        onClick={() => handleCellClick(x, y)}
        title={building ? building.building.name : `Empty land (${x}, ${y})`}
      >
        {building && (
          <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">
            🏠
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">City Map</h2>
        <div className="animate-pulse">
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="w-8 h-8 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        City Map ({landSize.x} × {landSize.y})
      </h2>
      
      <div className="mb-4">
        <div 
          className="grid gap-1 mx-auto"
          style={{ 
            gridTemplateColumns: `repeat(${landSize.x}, minmax(0, 1fr))`,
            maxWidth: `${landSize.x * 2.5}rem`
          }}
        >
          {Array.from({ length: landSize.y }).map((_, y) =>
            Array.from({ length: landSize.x }).map((_, x) =>
              renderCell(x, y)
            )
          )}
        </div>
      </div>
      
      {selectedCell && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            Selected: ({selectedCell.x}, {selectedCell.y})
          </h3>
          {getBuildingAtPosition(selectedCell.x, selectedCell.y) ? (
            <div className="mt-2">
              <p className="text-gray-600 dark:text-gray-400">
                Building: {getBuildingAtPosition(selectedCell.x, selectedCell.y)?.building.name}
              </p>
              <button className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm">
                Remove Building
              </button>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Empty land - Select a building from the marketplace to place here
            </p>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>🟢 Empty Land | 🔵 Buildings</p>
        <p>Click on any cell to select it</p>
      </div>
    </div>
  );
}

