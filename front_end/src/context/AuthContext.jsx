import { createContext, useEffect, useState } from "react";
import * as authApi from "../api/auth.api.js";
import { TOKEN_STORAGE_KEY } from "../api/axios.js";
import { THEME_STORAGE_KEY } from "./ThemeContext.jsx";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedToken) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    authApi.me()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser);
          setToken(storedToken);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setToken(null);
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const establishSession = ({ user: authenticatedUser, token: accessToken }) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    setToken(accessToken);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const login = async (credentials) => establishSession(await authApi.login(credentials));
  const register = async (credentials) => establishSession(await authApi.register(credentials));

  const logout = () => {
    for (const key of Object.keys(window.localStorage)) {
      if (key !== THEME_STORAGE_KEY) window.localStorage.removeItem(key);
    }
    window.sessionStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
