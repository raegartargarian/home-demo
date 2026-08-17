import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3Auth } from "../global/Web3AuthProvider";

export const LoginPage = () => {
  const { login, isAuthenticated } = useWeb3Auth() || {};
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="max-w-md w-full space-y-8 p-10 bg-surface-raised rounded-xl border border-line">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-medium tracking-tight text-ink">
            Welcome to Our Platform
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Please sign in to continue
          </p>
        </div>
        <button
          onClick={login}
          className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-full text-ink-inverse bg-brand hover:bg-brand-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
        >
          Sign in with Web3Auth
        </button>
      </div>
    </div>
  );
};
