import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Restaurants","Healthcare","Technology","Education","Retail","Construction","Beauty","Finance","Other"];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("listing");
  const [form, setForm] = useState({
    name: "", category: "Technology", description: "",
    phone: "", email: "", website: "", imageUrl: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate("/login"); return; }
      setUser(u);
      const q = query(collection(db, "businesses"), where("ownerId", "==", u.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existing = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setBusiness(existing);
        setForm({
          name: existing.name || "",
          category: existing.category || "Technology",
          description: existing.description || "",
          phone: existing.phone || "",
          email: existing.email || "",
          website: existing.website || "",
          imageUrl: existing.imageUrl || "",
        });
        const rq = query(collection(db, "reviews"), where("businessId", "==", existing.id));
        const rSnap = await getDocs(rq);
        setReviews(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (business) {
        await setDoc(doc(db, "businesses", business.id), {
          ...form,
          ownerId: user.uid,
          updatedAt: Date.now(),
          avgRating: business.avgRating || 0,
          reviewCount: business.reviewCount || 0,
        });
      } else {
        const ref = await addDoc(collection(db, "businesses"), {
          ...form,
          ownerId: user.uid,
          createdAt: Date.now(),
          avgRating: 0,
          reviewCount: 0,
        });
        setBusiness({ id: ref.id, ...form });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const logout = () => {
    auth.signOut();
    navigate("/");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">
      Loading...
    </div>
  );

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-1">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>

        {business && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{reviews.length}</div>
              <div className="text-sm text-gray-500 mt-1">Total Reviews</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-3xl font-bold text-yellow-500">{avgRating}</div>
              <div className="text-sm text-gray-500 mt-1">Avg Rating</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {[1,2,3,4,5].filter(s => s <= Math.round(avgRating)).length}★
              </div>
              <div className="text-sm text-gray-500 mt-1">Star Rating</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("listing")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "listing"
                ? "bg-blue-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            My Listing
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "reviews"
                ? "bg-blue-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {activeTab === "listing" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {business ? "Edit Your Listing" : "Create Your Listing"}
            </h2>
            {saved && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">
                Changes saved successfully!
              </div>
            )}
            <form onSubmit={save} className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Business Name</div>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="My Awesome Business"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Category</div>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 h-28 resize-none"
                  placeholder="Tell customers what you offer..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Phone</div>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="+1 234 567 8900"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Email</div>
                  <input
                    type="email"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="contact@business.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Website</div>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://mybusiness.com"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Logo / Image URL</div>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://example.com/logo.png"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">Paste a direct link to your business image</p>
              </div>
              {form.imageUrl && (
                <div className="rounded-lg overflow-hidden h-32 bg-gray-100">
                  <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : business ? "Save Changes" : "Create Listing"}
              </button>
            </form>
            {business && (
              <div className="mt-4 text-center">
                <a href={`/business/${business.id}`} className="text-blue-600 hover:underline text-sm">
                  View your public listing
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Reviews</h2>
            {reviews.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-4xl mb-2">💬</div>
                <div>No reviews yet</div>
                <div className="text-sm mt-1">Share your listing to get reviews</div>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-700">{r.userName}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className={s <= r.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
                      ))}
                    </div>
                    {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
