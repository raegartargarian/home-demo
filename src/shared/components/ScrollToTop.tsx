import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollResetKey } from "./scrollResetKey";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const key = scrollResetKey(pathname);

  // Keyed on the subject rather than the path, so moving between a vault's
  // sections keeps your place. See `scrollResetKey`.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);

  return null;
};

export default ScrollToTop;
