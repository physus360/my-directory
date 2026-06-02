import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAILS = ["physus2020@gmail.com"];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("businesses");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate("/login"); return; }
      if (!ADMIN_EMAILS.includes(u.email)) { navigate("/"); return; }
      setUser(u);

      const bizSnap = await getDocs(collection(db, "businesses"));
      setBusinesses(bizSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const revSnap = await getDocs(collection(db, "reviews"));
      setReviews(revSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const userSnap = await getDocs(collection(db, "users"));
      setUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setLoading(false);
    });
    return () => unsub();
  }, []);

  const deleteBusiness = async (id) => {
    if (!confirm("Delete this business?")) return;
    await deleteDoc(doc(db, "businesses", id));
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
  };

  const deleteReview = async (id) => {
    if (!confirm("Delete this review?")) return;
    await deleteDoc(doc(db, "reviews", id));
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleFeatured = async (business) => {
    const newVal = !business.featured;
    await updateDoc(doc(db, "businesses", business.id), { featured: newVal });
    setBusinesses((prev) => prev.map((b) => b.id === business.id ? { ...b, featured: newVal } : b));
  };

  const toggleVerified = async (business) => {
    const newVal = !business.verified;
    await updateDoc(doc(db, "businesses", business.id), { verified: newVal });
    setBusinesses((prev) => prev.map((b) => b.id === business.id ? { ...b, verified: newVal } : b));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">Loading...</div>
  );

  const filteredBusinesses = businesses.filter((b) =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.category?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReviews = reviews.filter((r) =>
    r.userName?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-gray-500 mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{businesses.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Businesses</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500">{reviews.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Reviews</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{users.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Users</div>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          className="w-full border rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["businesses", "reviews", "users"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab === "businesses" ? `Businesses (${businesses.length})` :
               tab === "reviews" ? `Reviews (${reviews.length})` :
               `Users (${users.length})`}
            </button>
          ))}
        </div>

        {/* Businesses tab */}
        {activeTab === "businesses" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Business</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Rating</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBusinesses.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{b.name}</div>
                      <div className="text-xs text-gray-400">{b.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ★ {b.avgRating || 0} ({b.reviewCount || 0})
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {b.featured && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Featured</span>
                        )}
                        {b.verified && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleFeatured(b)}
                          className={`text-xs px-2 py-1 rounded ${b.featured ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"} hover:opacity-80`}
                        >
                          {b.featured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          onClick={() => toggleVerified(b)}
                          className={`text-xs px-2 py-1 rounded ${b.verified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"} hover:opacity-80`}
                        >
                          {b.verified ? "Unverify" : "Verify"}
                        </button>
                        <a
                          href={`/business/${b.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:opacity-80"
                        >
                          View
                        </a>
                        <button
                          onClick={() => deleteBusiness(b.id)}
                          className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:opacity-80"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBusinesses.length === 0 && (
              <div className="text-center py-10 text-gray-400">No businesses found</div>
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">User</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Rating</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Comment</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{r.userName}</td>
                    <td className="px-4 py-3 text-sm text-yellow-500">{"★".repeat(r.rating)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{r.comment || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteReview(r.id)}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:opacity-80"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReviews.length === 0 && (
              <div className="text-center py-10 text-gray-400">No reviews found</div>
            )}
          </div>
        )}

        {/* Users tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.name || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === "business" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {u.role || "customer"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-10 text-gray-400">No users found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
