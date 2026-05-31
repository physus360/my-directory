import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { label: "Restaurants", icon: "🍽️" },
  { label: "Healthcare", icon: "🏥" },
  { label: "Technology", icon: "💻" },
  { label: "Education", icon: "📚" },
  { label: "Retail", icon: "🛍️" },
  { label: "Construction", icon: "🏗️" },
  { label: "Beauty", icon: "💇" },
  { label: "Finance", icon: "💰" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/browse?search=${search}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-blue-600 text-white py-20 px-6 text-center">
        <h1 className="text-5xl font-bold mb-4">Find Local Businesses</h1>
        <p className="text-xl opacity-90 mb-8">
          Discover, rate and contact businesses in your area
        </p>
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Search businesses or services..."
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-100"
          >
            Search
          </button>
        </form>
      </div>

      {/* Categories */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => navigate(`/browse?category=${cat.label}`)}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition text-center border border-gray-100"
            >
              <div className="text-4xl mb-2">{cat.icon}</div>
              <div className="font-medium text-gray-700">{cat.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}