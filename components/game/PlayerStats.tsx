"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface PlayerStatsProps {
  userId: string;
}

interface UserData {
  id: string;
  username: string;
  gold: number;
  land_size_x: number;
  land_size_y: number;
}

export default function PlayerStats({ userId }: PlayerStatsProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      setUserData(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Player Stats</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Player Stats</h2>
        <p className="text-red-500">Failed to load player data</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Mayor Stats
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Mayor:</span>
          <span className="font-semibold text-gray-800 dark:text-white">
            {userData.username}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Gold:</span>
          <span className="font-semibold text-yellow-600 flex items-center">
            🪙 {userData.gold.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Land Size:</span>
          <span className="font-semibold text-green-600">
            {userData.land_size_x} × {userData.land_size_y}
          </span>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors">
              Expand Land
            </button>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors">
              Collect Income
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

