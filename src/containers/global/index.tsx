import { LocalStorageKeys } from "@/shared/utils/localStorageHelpers";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { globalActions } from "./slice";
import { useWeb3Auth } from "./Web3AuthProvider";

export const GlobalProvider = () => {
  const dispatch = useDispatch();
  const { isLoading, isAuthenticated, user, provider, logout, login } =
    useWeb3Auth() || {};

  useEffect(() => {
    if (!isLoading && !isAuthenticated && login) {
      login();
    } else {
      if (isAuthenticated) {
        const getUserData = async () => {
          const jwtToken = user.idToken;
          localStorage.setItem(LocalStorageKeys.jwtAccessKey, jwtToken);
          isLoading !== undefined &&
            isAuthenticated !== undefined &&
            provider !== undefined &&
            user !== undefined &&
            login !== undefined &&
            logout !== undefined &&
            dispatch !== undefined &&
            dispatch(
              globalActions.setAuthData({
                login,
                isLoading,
                isAuthenticated,
                userWeb3: user,
                logout,
                provider,
                error: null,
              })
            );
        };

        getUserData().catch(console.error);
      }
    }
  }, [isLoading, isAuthenticated, login]);

  return null;
};
