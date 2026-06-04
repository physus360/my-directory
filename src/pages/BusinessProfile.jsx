import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function BusinessProfile() {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [replies, setReplies] = useState({});
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
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

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
      const reviewList = rSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReviews(reviewList);

      const repliesMap = {};
      for (const r of reviewList) {
        const rq = query(collection(db, "replies"), where("reviewId", "==", r.id));
        const rpSnap = await getDocs(rq);
        if (!rpSnap.empty) {
          repliesMap[r.id] = { id: rpSnap.docs[0].id, ...rpSnap.docs[0].data() };
        }
      }
      setReplies(repliesMap);
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (user && reviews.length > 0) {
      setAlreadyReviewed(reviews.some((r) => r.userId === user.uid));
    }
  }, [user, reviews]);

  const isOwner = user && business && user.uid === business.ownerId;

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

  const submitReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const ref = await addDoc(collection(db, "replies"), {
        reviewId,
        businessId: id,
        ownerId: user.uid,
        ownerName: business.name,
        text: replyText,
        createdAt: Date.now(),
      });
      setReplies((prev) => ({
        ...prev,
        [reviewId]: { id: ref.id, text: replyText, ownerName: business.name, createdAt: Date.now() },
      }));
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      console.error(err);
    }
    setSubmittingReply(false);
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
  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/[^0-9]/g, "")}`
    : null;
  const instagramUrl = business.instagram
    ? `https://instagram.com/${business.instagram.replace("@", "")}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-64 bg-gray-200 overflow-hidden relative">
        {business.imageUrl ? (
          <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">🏢</div>
        )}
        {business.featured && (
          <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1">
            ⭐ Featured
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-800">{business.name}</h1>
                {business.verified && <span title="Verified Business" className="text-blue-500 text-xl">✅</span>}
              </div>
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm inline-block mt-1">{business.category}</span>
            </div>
            <button onClick={shareBusiness} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-600 transition">
              {copied ? "Copied!" : "🔗 Share"}
            </button>
          </div>

          <div className="flex items-center gap-2 my-4">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={`text-2xl ${s <= stars ? "text-yellow-400" : "text-gray-200"}`}>★</span>
            ))}
            <span className="text-gray-500">{business.avgRating || 0} ({business.reviewCount || 0} reviews)</span>
          </div>

          <p className="text-gray-600 mb-6">{business.description}</p>

          {business.address && (
            <div className="flex items-center gap-2 text-gray-600 mb-4 text-sm">
              <span>📍</span><span>{business.address}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100">
                <span className="text-xl">📞</span>
                <div>
                  <div className="text-xs text-gray-400">Phone</div>
                  <div className="font-medium text-gray-700 text-sm">{business.phone}</div>
                </div>
              </a>
            )}
            {business.email && (
              <button onClick={() => setShowContact(!showContact)} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 text-left">
                <span className="text-xl">✉️</span>
                <div>
                  <div className="text-xs text-gray-400">Email</div>
                  <div className="font-medium text-gray-700 text-sm">Send message</div>
                </div>
              </button>
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100">
                <span className="text-xl">🌐</span>
                <div>
                  <div className="text-xs text-gray-400">Website</div>
                  <div className="font-medium text-gray-700 text-sm">Visit website</div>
                </div>
              </a>
            )}
          </div>

          {(whatsappUrl || instagramUrl || business.facebook) && (
            <div className="flex gap-3 mt-2 flex-wrap">
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 text-sm font-medium">
                  💬 WhatsApp
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-pink-50 text-pink-700 px-4 py-2 rounded-lg hover:bg-pink-100 text-sm font-medium">
                  📸 Instagram
                </a>
              )}
              {business.facebook && (
                <a href={business.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium">
                  👥 Facebook
                </a>
              )}
            </div>
          )}

          {showContact && (
            <div className="border rounded-xl p-4 mt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Send a Message</h3>
              {contactSent ? (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">Message sent! The business will get back to you.</div>
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
              <iframe title="Business Location" width="100%" height="100%" style={{ border: 0 }} src={mapsUrl} allowFullScreen loading="lazy" />
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
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">You have already reviewed this business. Thank you!</div>
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
            <div className="space-y-6">
              {reviews.map((r, i) => (
                <div key={i} className="border-b last:border-b-0 pb-6 last:pb-0">
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

                  {replies[r.id] && (
                    <div className="mt-3 ml-4 bg-blue-50 rounded-xl p-3 border-l-4 border-blue-400">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-700">Owner Reply</span>
                        <span className="text-xs text-gray-400">{new Date(replies[r.id].createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700">{replies[r.id].text}</p>
                    </div>
                  )}

                  {isOwner && !replies[r.id] && (
                    <div className="mt-2">
                      {replyingTo === r.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="w-full border rounded-lg px-3 py-2 h-20 resize-none text-sm"
                            placeholder="Write your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitReply(r.id)}
                              disabled={submittingReply}
                              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                              {submittingReply ? "Posting..." : "Post Reply"}
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(""); }}
                              className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(r.id)}
                          className="text-sm text-blue-600 hover:underline mt-1"
                        >
                          Reply to this review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
