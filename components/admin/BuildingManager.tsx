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

export default function BuildingManager() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "residential",
    price: 0,
    income_per_hour: 0,
    size_x: 1,
    size_y: 1,
    image_url: "",
    description: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBuildings(data || []);
    } catch (error) {
      console.error("Error fetching buildings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("buildings")
        .insert([formData]);

      if (error) throw error;

      // Reset form and refresh list
      setFormData({
        name: "",
        type: "residential",
        price: 0,
        income_per_hour: 0,
        size_x: 1,
        size_y: 1,
        image_url: "",
        description: "",
      });
      setShowForm(false);
      fetchBuildings();
    } catch (error) {
      console.error("Error adding building:", error);
      alert("Error adding building. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this building?")) return;

    try {
      const { error } = await supabase
        .from("buildings")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchBuildings();
    } catch (error) {
      console.error("Error deleting building:", error);
      alert("Error deleting building. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center">Loading buildings...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Buildings ({buildings.length})</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          {showForm ? "Cancel" : "Add Building"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="public">Public</option>
                <option value="decoration">Decoration</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Income per Hour</label>
              <input
                type="number"
                value={formData.income_per_hour}
                onChange={(e) => setFormData({ ...formData, income_per_hour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Size X</label>
              <input
                type="number"
                value={formData.size_x}
                onChange={(e) => setFormData({ ...formData, size_x: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Size Y</label>
              <input
                type="number"
                value={formData.size_y}
                onChange={(e) => setFormData({ ...formData, size_y: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="5"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://example.com/image.png"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
          >
            Add Building
          </button>
        </form>
      )}

      <div className="space-y-4">
        {buildings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No buildings found. Add your first building to get started!
          </p>
        ) : (
          buildings.map((building) => (
            <div key={building.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{building.name}</h4>
                  <p className="text-sm text-gray-600">
                    Type: {building.type} | Size: {building.size_x}x{building.size_y} | 
                    Price: {building.price} gold | Income: {building.income_per_hour}/hour
                  </p>
                  {building.description && (
                    <p className="text-sm text-gray-500 mt-1">{building.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(building.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

