import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
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
  const [stats, setStats] = useState({ businesses: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const bizSnap = await getDocs(collection(db, "businesses"));
        const businesses = bizSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const sorted = [...businesses].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        setFeatured(sorted.slice(0, 6));

        const revSnap = await getDocs(collection(db, "reviews"));
        setStats({ businesses: businesses.length, reviews: revSnap.size });
      } catch (err) {
        console.error(err);
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
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            Find the Best Local Businesses
          </h1>
          <p className="text-xl opacity-90 mb-10">
            Discover, rate and contact trusted businesses in your area
          </p>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2 mb-10">
            <input
              type="text"
              placeholder="Search businesses or services..."
              className="flex-1 px-5 py-4 rounded-xl text-gray-900 text-lg shadow-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 shadow-lg"
            >
              Search
            </button>
          </form>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12">
            <div>
              <div className="text-4xl font-extrabold">{stats.businesses}</div>
              <div className="text-blue-200 text-sm mt-1">Businesses Listed</div>
            </div>
            <div className="w-px h-12 bg-blue-500" />
            <div>
              <div className="text-4xl font-extrabold">{stats.reviews}</div>
              <div className="text-blue-200 text-sm mt-1">Customer Reviews</div>
            </div>
            <div className="w-px h-12 bg-blue-500" />
            <div>
              <div className="text-4xl font-extrabold">{CATEGORIES.length}</div>
              <div className="text-blue-200 text-sm mt-1">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Browse by Category</h2>
        <p className="text-gray-500 text-center mb-8">Find exactly what you are looking for</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => navigate(`/browse?category=${cat.label}`)}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition text-center border border-gray-100 hover:border-blue-200 group"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
              <div className="font-medium text-gray-700">{cat.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Featured businesses */}
      <div className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-800">Top Rated Businesses</h2>
            <button onClick={() => navigate("/browse")} className="text-blue-600 hover:underline text-sm font-medium">
              View all →
            </button>
          </div>
          <p className="text-gray-500 mb-8">Highly rated by our community</p>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-2xl overflow-hidden animate-pulse">
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
            <div className="text-center py-10">
              <div className="text-5xl mb-4">🏢</div>
              <div className="text-gray-500 text-xl">No businesses listed yet</div>
              <button
                onClick={() => navigate("/register")}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Be the first to list yours
              </button>
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

      {/* CTA */}
      <div className="bg-blue-600 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Own a Business?</h2>
        <p className="text-xl opacity-90 mb-8">List your business for free and reach more customers today</p>
        <button
          onClick={() => navigate("/register")}
          className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 text-lg"
        >
          List Your Business Free
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 px-6 text-center">
        <div className="text-lg font-bold text-white mb-2">BizDirectory</div>
        <div className="text-sm">Find and connect with local businesses</div>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <button onClick={() => navigate("/browse")} className="hover:text-white">Browse</button>
          <button onClick={() => navigate("/register")} className="hover:text-white">List Your Business</button>
          <button onClick={() => navigate("/login")} className="hover:text-white">Login</button>
        </div>
      </footer>
    </div>
  );
}
