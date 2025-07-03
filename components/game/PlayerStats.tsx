"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface PlayerData {
  id: string;
  username: string;
  gold: number;
  land_size_x: number;
  land_size_y: number;
}

interface PlayerStatsProps {
  userId: string;
}

export default function PlayerStats({ userId }: PlayerStatsProps) {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchPlayerData();
    
    // Set up real-time subscription for player data updates
    const channel = supabase
      .channel("player-stats")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        () => {
          fetchPlayerData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchPlayerData = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setPlayerData(data);
    } catch (error) {
      console.error("Error fetching player data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-red-500">Error loading player data</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Mayor {playerData.username}
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Gold:</span>
          <span className="font-bold text-yellow-600 text-lg">
            {playerData.gold.toLocaleString()} 🪙
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Land Size:</span>
          <span className="font-medium">
            {playerData.land_size_x} × {playerData.land_size_y}
          </span>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2 text-gray-800 dark:text-white">City Stats</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Population: Coming soon</p>
            <p>Happiness: Coming soon</p>
            <p>Income/hour: Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

