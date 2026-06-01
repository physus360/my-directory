import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 hidden md:block">{user.email}</span>
                  <span className="text-gray-400 text-xs">▼</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg z-50">
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Reviews
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 rounded-b-xl"
                    >
                      Logout
                    </button>
                  </div>
                )}
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
