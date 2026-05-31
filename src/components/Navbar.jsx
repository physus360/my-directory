import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold text-blue-600">
        BizDirectory
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/browse" className="text-gray-600 hover:text-blue-600">
          Browse
        </Link>
        <Link to="/login" className="text-gray-600 hover:text-blue-600">
          Login
        </Link>
        <Link
          to="/register"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          List Your Business
        </Link>
      </div>
    </nav>
  );
}