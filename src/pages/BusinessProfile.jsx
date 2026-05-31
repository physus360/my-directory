import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function BusinessProfile() {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const snap = await getDoc(doc(db, "businesses", id));
      if (snap.exists()) setBusiness({ id: snap.id, ...snap.data() });
      const q = query(collection(db, "reviews"), where("businessId", "==", id));
      const rSnap = await getDocs(q);
      setReviews(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (user && reviews.length > 0) {
      setAlreadyReviewed(reviews.some((r) => r.userId === user.uid));
    }
  }, [user, reviews]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        businessId: id,
        userId: user.uid,
        userName: user.email,
        rating,
        comment,
        createdAt: Date.now(),
      });
      const newCount = (business.reviewCount || 0) + 1;
      const newAvg = ((business.avgRating || 0) * (business.reviewCount || 0) + rating) / newCount;
      await updateDoc(doc(db, "businesses", id), {
        avgRating: Math.round(newAvg * 10) / 10,
        reviewCount: newCount,
      });
      setBusiness((b) => ({ ...b, avgRating: Math.round(newAvg * 10) / 10, reviewCount: newCount }));
      setReviews((r) => [...r, { userId: user.uid, userName: user.email, rating, comment, createdAt: Date.now() }]);
      setAlreadyReviewed(true);
      setSubmitted(true);
      setRating(0);
      setComment("");
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">Loading...</div>;
  if (!business) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">Business not found</div>;

  const stars = Math.round(business.avgRating || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-64 bg-gray-200 overflow-hidden">
        {business.imageUrl ? (
          <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">🏢</div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800">{business.name}</h1>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">{business.category}</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={`text-2xl ${s <= stars ? "text-yellow-400" : "text-gray-200"}`}>★</span>
            ))}
            <span className="text-gray-500">{business.avgRating || 0} ({business.reviewCount || 0} reviews)</span>
          </div>
          <p className="text-gray-600 mb-6">{business.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100">
                <span className="text-xl">📞</span>
                <div>
                  <div className="text-xs text-gray-400">Phone</div>
                  <div className="font-medium text-gray-700">{business.phone}</div>
                </div>
              </a>
            )}
            {business.email && (
              <a href={`mailto:${business.email}`} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100">
                <span className="text-xl">✉️</span>
                <div>
                  <div className="text-xs text-gray-400">Email</div>
                  <div className="font-medium text-gray-700">{business.email}</div>
                </div>
              </a>
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100">
                <span className="text-xl">🌐</span>
                <div>
                  <div className="text-xs text-gray-400">Website</div>
                  <div className="font-medium text-gray-700">Visit website</div>
                </div>
              </a>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Leave a Review</h2>
          {!user ? (
            <div className="text-gray-500">
              <a href="/login" className="text-blue-600 hover:underline">Sign in</a> to leave a review
            </div>
          ) : alreadyReviewed || submitted ? (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">
              You have already reviewed this business. Thank you!
            </div>
          ) : (
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Your Rating</div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHover(s)}
                      onMouseLeave={() => setHover(0)}
                      className={`text-3xl transition ${s <= (hover || rating) ? "text-yellow-400" : "text-gray-200"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Comment (optional)</div>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !rating}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <div className="text-gray-400">No reviews yet. Be the first!</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="border-b last:border-b-0 pb-4 last:pb-0">
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
      </div>
    </div>
  );
}
