import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [businesses, setBusinesses] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, comment: "" });
  const [hover, setHover] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate("/login"); return; }
      setUser(u);

      const q = query(collection(db, "reviews"), where("userId", "==", u.uid));
      const snap = await getDocs(q);
      const userReviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReviews(userReviews);

      const bizMap = {};
      for (const r of userReviews) {
        if (!bizMap[r.businessId]) {
          const bizSnap = await getDoc(doc(db, "businesses", r.businessId));
          if (bizSnap.exists()) {
            bizMap[r.businessId] = { id: bizSnap.id, ...bizSnap.data() };
          }
        }
      }
      setBusinesses(bizMap);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const startEdit = (review) => {
    setEditingId(review.id);
    setEditForm({ rating: review.rating, comment: review.comment || "" });
  };

  const saveEdit = async (review) => {
    try {
      await updateDoc(doc(db, "reviews", review.id), {
        rating: editForm.rating,
        comment: editForm.comment,
      });

      const biz = businesses[review.businessId];
      if (biz) {
        const allReviews = reviews.map((r) =>
          r.id === review.id ? { ...r, rating: editForm.rating } : r
        );
        const bizReviews = allReviews.filter((r) => r.businessId === review.businessId);
        const newAvg = bizReviews.reduce((a, r) => a + r.rating, 0) / bizReviews.length;
        await updateDoc(doc(db, "businesses", review.businessId), {
          avgRating: Math.round(newAvg * 10) / 10,
        });
      }

      setReviews((prev) =>
        prev.map((r) => r.id === review.id ? { ...r, rating: editForm.rating, comment: editForm.comment } : r)
      );
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReview = async (review) => {
    if (!confirm("Delete this review?")) return;
    try {
      await deleteDoc(doc(db, "reviews", review.id));

      const biz = businesses[review.businessId];
      if (biz) {
        const remaining = reviews.filter((r) => r.id !== review.id && r.businessId === review.businessId);
        const newCount = remaining.length;
        const newAvg = newCount > 0 ? remaining.reduce((a, r) => a + r.rating, 0) / newCount : 0;
        await updateDoc(doc(db, "businesses", review.businessId), {
          avgRating: Math.round(newAvg * 10) / 10,
          reviewCount: newCount,
        });
      }

      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">Loading...</div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
            {user?.email[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user?.email}</h1>
            <p className="text-gray-500">{reviews.length} reviews written</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">My Reviews</h2>

          {reviews.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">💬</div>
              <div>No reviews yet</div>
              <button onClick={() => navigate("/browse")} className="mt-3 text-blue-600 hover:underline text-sm">
                Browse businesses to review
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => {
                const biz = businesses[r.businessId];
                return (
                  <div key={r.id} className="border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {biz && (
                          <a href={`/business/${biz.id}`} className="font-semibold text-blue-600 hover:underline">
                            {biz.name}
                          </a>
                        )}
                        <div className="text-sm text-gray-400 mt-0.5">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(r)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteReview(r)}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {editingId === r.id ? (
                      <div className="space-y-3 mt-2">
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, rating: s })}
                              onMouseEnter={() => setHover(s)}
                              onMouseLeave={() => setHover(0)}
                              className={`text-2xl ${s <= (hover || editForm.rating) ? "text-yellow-400" : "text-gray-200"}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="w-full border rounded-lg px-3 py-2 h-20 resize-none text-sm"
                          value={editForm.comment}
                          onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(r)}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-0.5 mb-1">
                          {[1,2,3,4,5].map((s) => (
                            <span key={s} className={s <= r.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
                          ))}
                        </div>
                        {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
