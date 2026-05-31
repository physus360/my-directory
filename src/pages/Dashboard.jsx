import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Restaurants","Healthcare","Technology","Education","Retail","Construction","Beauty","Finance","Other"];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Business Dashboard</h1>
            <p className="text-gray-500 mt-1">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>

        {saved && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6">
            Changes saved successfully!
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {business ? "Edit Your Listing" : "Create Your Listing"}
          </h2>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="My Awesome Business"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="https://mybusiness.com"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo / Image URL</label>
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
        </div>

        {business && (
          <div className="mt-4 text-center">
            <a href={`/business/${business.id}`} className="text-blue-600 hover:underline text-sm">
              View your public listing
            </a>
          </div>
        )}
      </div>
    </div>
  );
}