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
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("listing");
  const [form, setForm] = useState({
    name: "", category: "Technology", description: "",
    phone: "", email: "", website: "", imageUrl: "", address: "",
    whatsapp: "", instagram: "", facebook: "",
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
          address: existing.address || "",
          whatsapp: existing.whatsapp || "",
          instagram: existing.instagram || "",
          facebook: existing.facebook || "",
        });
        const rq = query(collection(db, "reviews"), where("businessId", "==", existing.id));
        const rSnap = await getDocs(rq);
        setReviews(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        const cq = query(collection(db, "contacts"), where("businessId", "==", existing.id));
        const cSnap = await getDocs(cq);
        setContacts(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
          featured: business.featured || false,
          verified: business.verified || false,
        });
      } else {
        const ref = await addDoc(collection(db, "businesses"), {
          ...form,
          ownerId: user.uid,
          createdAt: Date.now(),
          avgRating: 0,
          reviewCount: 0,
          featured: false,
          verified: false,
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
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">Loading...</div>
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
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>

        {business && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{reviews.length}</div>
              <div className="text-sm text-gray-500 mt-1">Reviews</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-3xl font-bold text-yellow-500">{avgRating}</div>
              <div className="text-sm text-gray-500 mt-1">Avg Rating</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{Math.round(avgRating)}★</div>
              <div className="text-sm text-gray-500 mt-1">Stars</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{contacts.length}</div>
              <div className="text-sm text-gray-500 mt-1">Messages</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {["listing","reviews","messages"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab === "listing" ? "My Listing" : tab === "reviews" ? `Reviews (${reviews.length})` : `Messages (${contacts.length})`}
            </button>
          ))}
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
            {business?.featured && (
              <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <span>⭐</span> Your listing is Featured!
              </div>
            )}
            {business?.verified && (
              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <span>✅</span> Your listing is Verified!
              </div>
            )}
            <form onSubmit={save} className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Business Name</div>
                <input className="w-full border rounded-lg px-3 py-2" placeholder="My Awesome Business" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Category</div>
                <select className="w-full border rounded-lg px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                <textarea className="w-full border rounded-lg px-3 py-2 h-28 resize-none" placeholder="Tell customers what you offer..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Phone</div>
                  <input className="w-full border rounded-lg px-3 py-2" placeholder="+960 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Email</div>
                  <input type="email" className="w-full border rounded-lg px-3 py-2" placeholder="contact@business.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Website</div>
                <input className="w-full border rounded-lg px-3 py-2" placeholder="https://mybusiness.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Address</div>
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Male, Maldives" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">Social Media</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl w-8">💬</span>
                    <input className="w-full border rounded-lg px-3 py-2" placeholder="WhatsApp number e.g. +9607654321" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl w-8">📸</span>
                    <input className="w-full border rounded-lg px-3 py-2" placeholder="Instagram username e.g. mybusiness" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl w-8">👥</span>
                    <input className="w-full border rounded-lg px-3 py-2" placeholder="Facebook page URL" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Logo / Image URL</div>
                <input className="w-full border rounded-lg px-3 py-2" placeholder="https://example.com/logo.png" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              {form.imageUrl && (
                <div className="rounded-lg overflow-hidden h-32 bg-gray-100">
                  <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
              <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : business ? "Save Changes" : "Create Listing"}
              </button>
            </form>
            {business && (
              <div className="mt-4 text-center">
                <a href={`/business/${business.id}`} className="text-blue-600 hover:underline text-sm">View your public listing</a>
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
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-700">{r.userName}</div>
                      <div className="text-sm text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</div>
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

        {activeTab === "messages" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Messages</h2>
            {contacts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-4xl mb-2">📬</div>
                <div>No messages yet</div>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((c) => (
                  <div key={c.id} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-700">{c.name}</div>
                      <div className="text-sm text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm text-blue-600 mb-2">{c.email}</div>
                    <p className="text-gray-600 text-sm">{c.message}</p>
                    <a href={`mailto:${c.email}?subject=Re: Your message about ${c.businessName}`} className="mt-2 inline-block text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
                      Reply by Email
                    </a>
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
