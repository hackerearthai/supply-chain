import { useState, useEffect } from "react";
import { loginWithGoogle } from "@/services/firebase";
import { loginUser, setCurrentUser } from "@/services/api";
import { Button } from "@/components/ui/button";
import { isFirebaseReady } from "@/services/firebase";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    // Check if Firebase is ready
    const checkFirebase = () => {
      const ready = isFirebaseReady();
      setFirebaseReady(ready);
      if (!ready) {
        setError("Firebase is initializing... Please wait.");
        // Retry after a short delay
        setTimeout(checkFirebase, 1000);
      } else {
        setError(null);
      }
    };

    checkFirebase();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Double-check Firebase is ready
      if (!isFirebaseReady()) {
        throw new Error("Firebase is not ready. Please refresh the page and try again.");
      }

      // Step 1: Firebase login
      const firebaseUser = await loginWithGoogle();
      setCurrentUser(firebaseUser.uid);

      // Step 2: Send to backend
      const response = await loginUser(
        firebaseUser.uid,
        firebaseUser.email,
        firebaseUser.name,
        firebaseUser.avatar
      );

      if (response.success) {
        onLoginSuccess(response.user);
      } else {
        setError(response.error || "Login failed");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">Supply Chain Management</h1>
        <p className="text-gray-600 mb-6">Sign in with your Google account to continue</p>

        {error && (
          <div className="text-red-500 mb-4 text-sm p-3 bg-red-50 rounded">
            {error}
          </div>
        )}

        {!firebaseReady && (
          <div className="text-blue-600 mb-4 text-sm p-3 bg-blue-50 rounded">
            Initializing authentication service...
          </div>
        )}

        <Button
          onClick={handleGoogleLogin}
          disabled={loading || !firebaseReady}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </Button>

        {!firebaseReady && (
          <p className="text-xs text-gray-500 mt-4">
            If this takes too long, try refreshing the page.
          </p>
        )}
      </div>
    </div>
  );
}
