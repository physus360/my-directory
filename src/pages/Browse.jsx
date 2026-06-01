import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import BusinessCard from "../components/BusinessCard";

const CATEGORIES = [
  "All", "Restaurants", "Healthcare", "Technology", "Education",
  "Retail", "Construction", "Beauty", "Finance", "Other"
];

export default function Browse() {
  const [businesses, setBusinesses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "All");
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "businesses"));
      setBusinesses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    let results = [...businesses];

    if (activeCategory && activeCategory !== "All") {
      results = results.filter((b) => b.category === activeCategory);
    }

    if (search.trim()) {
      results = results.filter((b) =>
        b.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (sortBy === "rating") {
      results.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (sortBy === "reviews") {
      results.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (sortBy === "newest") {
      results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    setFiltered(results);
  }, [businesses, search, activeCategory, sortBy]);

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    setSearchParams(cat !== "All" ? { category: cat } : {});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex gap-3">
          <input
            type="text"
            placeholder="Search businesses..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rating">Top Rated</option>
            <option value="reviews">Most Reviewed</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-3 overflow-x-auto">
        <div className="max-w-5xl mx-auto flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-gray-500 mb-6">{filtered.length} businesses found</p>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => (
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <div className="text-gray-500 text-xl">No businesses found</div>
            <div className="text-gray-400 mt-2">Try a different search or category</div>
            <button
              onClick={() => { setSearch(""); handleCategory("All"); }}
              className="mt-4 text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
