import { LocalStorageKeys } from "@/shared/utils/localStorageHelpers";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { globalActions } from "./slice";
import { useWeb3Auth } from "./Web3AuthProvider";

export const GlobalProvider = () => {
  const dispatch = useDispatch();
  const { isLoading, isAuthenticated, user, provider, logout, login } =
    useWeb3Auth() || {};

  // Signing in is offered, not imposed.
  //
  // This used to call `login()` the moment it found nobody signed in, which
  // put the Web3Auth modal over a page the visitor had not seen yet — and
  // `PageLayout` rendered nothing behind it, so the first thing the demo showed
  // was a login dialog on a blank ground. The landing page is the pitch; a
  // visitor gets to read it and press Get started when they are ready.
  useEffect(() => {
    // Everything from the hook is optional until the provider is ready, and
    // the store's shape is not. One guard rather than the seven inline
    // `!== undefined` checks this used to carry into the payload.
    if (!isAuthenticated || !user?.idToken) return;
    if (
      !login ||
      !logout ||
      isLoading === undefined ||
      provider === undefined
    ) {
      return;
    }

    localStorage.setItem(LocalStorageKeys.jwtAccessKey, user.idToken);
    dispatch(
      globalActions.setAuthData({
        login,
        isLoading,
        isAuthenticated,
        userWeb3: user,
        logout,
        provider,
        error: null,
      }),
    );
  }, [isLoading, isAuthenticated, login, user, provider, logout, dispatch]);

  return null;
};
