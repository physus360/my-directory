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
  const [copied, setCopied] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

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

  const shareBusiness = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: business.name, text: `Check out ${business.name} on BizDirectory`, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const submitContact = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "contacts"), {
        businessId: id,
        businessName: business.name,
        businessEmail: business.email,
        ...contactForm,
        createdAt: Date.now(),
      });
      setContactSent(true);
      setContactForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">Loading...</div>;
  if (!business) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">Business not found</div>;

  const stars = Math.round(business.avgRating || 0);
  const mapsUrl = business.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(business.address)}&output=embed`
    : null;

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
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">{business.category}</span>
              <button onClick={shareBusiness} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-600 transition">
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={`text-2xl ${s <= stars ? "text-yellow-400" : "text-gray-200"}`}>★</span>
            ))}
            <span className="text-gray-500">{business.avgRating || 0} ({business.reviewCount || 0} reviews)</span>
          </div>

          <p className="text-gray-600 mb-6">{business.description}</p>

          {business.address && (
            <div className="flex items-center gap-2 text-gray-600 mb-4 text-sm">
              <span>📍</span>
              <span>{business.address}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              <button onClick={() => setShowContact(!showContact)} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 text-left">
                <span className="text-xl">✉️</span>
                <div>
                  <div className="text-xs text-gray-400">Email</div>
                  <div className="font-medium text-gray-700">Send message</div>
                </div>
              </button>
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

          {showContact && (
            <div className="border rounded-xl p-4 mt-2">
              <h3 className="font-semibold text-gray-800 mb-3">Send a Message</h3>
              {contactSent ? (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">
                  Message sent! The business will get back to you.
                </div>
              ) : (
                <form onSubmit={submitContact} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Your name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
                    <input type="email" className="border rounded-lg px-3 py-2 text-sm" placeholder="Your email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
                  </div>
                  <textarea className="w-full border rounded-lg px-3 py-2 h-24 resize-none text-sm" placeholder="Your message..." value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} required />
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">Send Message</button>
                </form>
              )}
            </div>
          )}
        </div>

        {mapsUrl && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Location</h2>
            <div className="rounded-xl overflow-hidden h-64">
              <iframe
                title="Business Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                src={mapsUrl}
                allowFullScreen
                loading="lazy"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">📍 {business.address}</p>
          </div>
        )}

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
                    <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} className={`text-3xl transition ${s <= (hover || rating) ? "text-yellow-400" : "text-gray-200"}`}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Comment (optional)</div>
                <textarea className="w-full border rounded-lg px-3 py-2 h-24 resize-none" placeholder="Share your experience..." value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
              <button type="submit" disabled={submitting || !rating} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
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
