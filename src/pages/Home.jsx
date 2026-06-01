import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, limit, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import BusinessCard from "../components/BusinessCard";

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
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, "businesses"),
          orderBy("avgRating", "desc"),
          limit(6)
        );
        const snap = await getDocs(q);
        setFeatured(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        const snap = await getDocs(collection(db, "businesses"));
        setFeatured(snap.docs.slice(0, 6).map((d) => ({ id: d.id, ...d.data() })));
      }
      setLoading(false);
    };
    load();
  }, []);

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

      {/* Featured businesses */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Top Rated Businesses</h2>
          <button
            onClick={() => navigate("/browse")}
            className="text-blue-600 hover:underline text-sm"
          >
            View all
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No businesses listed yet. Be the first!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}