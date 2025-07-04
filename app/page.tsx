import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import GameBoard from "@/components/game/GameBoard";
import PlayerStats from "@/components/game/PlayerStats";
import Marketplace from "@/components/game/Marketplace";

export default async function Home() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();

  // If user is not logged in, show welcome page
  if (error || !data?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
            Welcome to City Mayor Game! 🏙️
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Build your dream city from scratch! Start with 1000 gold coins and a 10x10 plot of land.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">🏠 Build & Manage</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Purchase buildings from the marketplace and place them strategically on your land.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">💰 Earn Income</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Different buildings generate income over time. Grow your wealth and expand your city!
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">🎯 Strategic Planning</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Balance residential, commercial, and public buildings to create the perfect city.
              </p>
            </div>
          </div>
          
          <Link
            href="/login"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
          >
            Start Playing Now! 🚀
          </Link>
        </div>
      </div>
    );
  }

  // Check if user exists in our users table, if not create them
  const { error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (userError && userError.code === "PGRST116") {
    // User doesn't exist, create them
    const { error: insertError } = await supabase
      .from("users")
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          username: data.user.email?.split("@")[0] || "player",
          gold: 1000,
          land_size_x: 10,
          land_size_y: 10,
        },
      ]);

    if (insertError) {
      console.error("Error creating user:", insertError);
    }
  }

  // User is logged in, show game interface
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Player Stats */}
        <div className="lg:col-span-1">
          <PlayerStats userId={data.user.id} />
        </div>

        {/* Game Board */}
        <div className="lg:col-span-2">
          <GameBoard userId={data.user.id} />
        </div>

        {/* Marketplace */}
        <div className="lg:col-span-1">
          <Marketplace userId={data.user.id} />
        </div>
      </div>
    </div>
  );
}

