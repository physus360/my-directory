import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="text-2xl font-bold text-blue-600">
        BizDirectory
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/browse" className="text-gray-600 hover:text-blue-600">
          Browse
        </Link>

        {!loading && (
          <>
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 text-sm">
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 hidden md:block">
                    {user.email}
                  </span>
                  <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 ml-1">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-blue-600">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  List Your Business
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
