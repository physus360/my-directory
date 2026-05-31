import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import BusinessCard from "../components/BusinessCard";

export default function Browse() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "businesses"));
        let results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (category) results = results.filter((b) => b.category === category);
        if (search)
          results = results.filter(
            (b) =>
              b.name?.toLowerCase().includes(search.toLowerCase()) ||
              b.description?.toLowerCase().includes(search.toLowerCase())
          );
        setBusinesses(results);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetch();
  }, [search, category]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {category ? `${category} Businesses` : search ? `Results for "${search}"` : "All Businesses"}
        </h1>
        <p className="text-gray-500 mb-8">{businesses.length} businesses found</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-xl">Loading...</div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <div className="text-gray-500 text-xl">No businesses found</div>
            <div className="text-gray-400 mt-2">Try a different search or category</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}