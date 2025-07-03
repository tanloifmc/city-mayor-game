"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface PlayerBuilding {
  id: string;
  user_id: string;
  building_id: string;
  position_x: number;
  position_y: number;
  building: {
    name: string;
    type: string;
    image_url: string | null;
    size_x: number;
    size_y: number;
  };
}

interface GameBoardProps {
  userId: string;
}

export default function GameBoard({ userId }: GameBoardProps) {
  const [playerBuildings, setPlayerBuildings] = useState<PlayerBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);

  const supabase = createClient();
  const GRID_SIZE = 10;

  useEffect(() => {
    fetchPlayerBuildings();
    
    // Set up real-time subscription for building updates
    const channel = supabase
      .channel("player-buildings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_buildings",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchPlayerBuildings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchPlayerBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from("player_buildings")
        .select(`
          *,
          building:buildings(*)
        `)
        .eq("user_id", userId);

      if (error) throw error;
      setPlayerBuildings(data || []);
    } catch (error) {
      console.error("Error fetching player buildings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBuildingAtPosition = (x: number, y: number) => {
    return playerBuildings.find(
      (pb) =>
        pb.position_x <= x &&
        x < pb.position_x + pb.building.size_x &&
        pb.position_y <= y &&
        y < pb.position_y + pb.building.size_y
    );
  };

  const handleCellClick = (x: number, y: number) => {
    setSelectedCell({ x, y });
  };

  const renderCell = (x: number, y: number) => {
    const building = getBuildingAtPosition(x, y);
    const isSelected = selectedCell?.x === x && selectedCell?.y === y;
    
    let cellContent = "";
    let cellClass = "w-12 h-12 border border-gray-300 cursor-pointer transition-colors ";
    
    if (building) {
      // Only show building content on the top-left cell of the building
      if (building.position_x === x && building.position_y === y) {
        cellContent = building.building.name.charAt(0).toUpperCase();
        cellClass += "bg-blue-200 hover:bg-blue-300 flex items-center justify-center font-bold text-xs ";
      } else {
        cellClass += "bg-blue-100 ";
      }
    } else {
      cellClass += "bg-green-100 hover:bg-green-200 ";
    }
    
    if (isSelected) {
      cellClass += "ring-2 ring-blue-500 ";
    }

    return (
      <div
        key={`${x}-${y}`}
        className={cellClass}
        onClick={() => handleCellClick(x, y)}
        title={building ? building.building.name : `Empty land (${x}, ${y})`}
      >
        {cellContent}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="w-12 h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Your City ({GRID_SIZE}×{GRID_SIZE})
      </h2>
      
      <div className="grid grid-cols-10 gap-1 mb-4">
        {Array.from({ length: GRID_SIZE }).map((_, y) =>
          Array.from({ length: GRID_SIZE }).map((_, x) => renderCell(x, y))
        )}
      </div>
      
      {selectedCell && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <p className="text-sm">
            Selected: ({selectedCell.x}, {selectedCell.y})
          </p>
          {getBuildingAtPosition(selectedCell.x, selectedCell.y) ? (
            <p className="text-sm text-blue-600">
              Building: {getBuildingAtPosition(selectedCell.x, selectedCell.y)?.building.name}
            </p>
          ) : (
            <p className="text-sm text-green-600">Empty land - Ready to build!</p>
          )}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>💡 Click on any cell to select it</p>
        <p>🏠 Blue cells contain buildings</p>
        <p>🌱 Green cells are empty land</p>
      </div>
    </div>
  );
}

