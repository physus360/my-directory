import { Link } from "react-router-dom";

export default function BusinessCard({ business }) {
  const { id, name, category, description, imageUrl, avgRating, reviewCount, phone, featured, verified } = business;
  const stars = Math.round(avgRating || 0);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition relative ${featured ? "border-yellow-300" : "border-gray-100"}`}>
      {featured && (
        <div className="absolute top-3 left-3 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          ⭐ Featured
        </div>
      )}
      <div className="h-40 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🏢</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-gray-800 text-lg leading-tight">{name}</h3>
            {verified && <span title="Verified" className="text-blue-500 text-sm">✅</span>}
          </div>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full ml-2 whitespace-nowrap">
            {category}
          </span>
        </div>
        <div className="flex items-center gap-1 mb-2">
          {[1,2,3,4,5].map((s) => (
            <span key={s} className={s <= stars ? "text-yellow-400" : "text-gray-200"}>★</span>
          ))}
          <span className="text-sm text-gray-500 ml-1">({reviewCount || 0})</span>
        </div>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{description}</p>
        <div className="flex items-center justify-between">
          {phone && (
            <a href={`tel:${phone}`} className="text-sm text-blue-600 hover:underline">
              📞 {phone}
            </a>
          )}
          <Link
            to={`/business/${id}`}
            className="ml-auto bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
