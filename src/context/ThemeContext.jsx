import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "pawsome-theme";

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "system");

  useEffect(() => {
    const root = document.documentElement;
    const applyResolved = () => {
      const resolved = theme === "system" ? getSystemTheme() : theme;
      root.classList.toggle("dark", resolved === "dark");
    };

    applyResolved();
    localStorage.setItem(STORAGE_KEY, theme);

    if (theme !== "system") return;

    // keep following the OS preference live while "system" is selected
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyResolved);
    return () => media.removeEventListener("change", applyResolved);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
