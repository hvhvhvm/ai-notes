import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<boolean>;
  clearError: () => void;
  supabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  // Clear any errors
  const clearError = () => setError(null);

  // Sync Supabase Authentication State
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      setIsDemoMode(false);
      
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
          fetchProfile(session.user.id, session.user.email || "");
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session) {
            setUser(session.user);
            await fetchProfile(session.user.id, session.user.email || "");
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Demo Mode Initial State: check localStorage
      setIsDemoMode(true);
      const storedUser = localStorage.getItem("memora_user");
      const storedProfile = localStorage.getItem("memora_profile");
      
      if (storedUser && storedProfile) {
        setUser(JSON.parse(storedUser));
        setProfile(JSON.parse(storedProfile));
      }
      setLoading(false);
    }
  }, []);

  // Fetch or create profile
  const fetchProfile = async (userId: string, email: string) => {
    if (!supabase) return;
    try {
      const { data, error: fetchErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (fetchErr) {
        // Profile might not exist, let's try to create one
        console.warn("Profile not found or tables not created, attempting default profile insert...");
        const defaultProfile = {
          id: userId,
          email,
          full_name: email.split("@")[0],
          updated_at: new Date().toISOString()
        };

        const { data: inserted, error: insertErr } = await supabase
          .from("profiles")
          .upsert(defaultProfile)
          .select()
          .single();

        if (!insertErr && inserted) {
          setProfile(inserted);
        } else {
          // If profile table doesn't exist yet, we store a virtual profile
          setProfile({
            id: userId,
            email,
            full_name: email.split("@")[0]
          });
        }
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error loading profile details:", err);
      // Fallback
      setProfile({
        id: userId,
        email,
        full_name: email.split("@")[0]
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Flow
  const signUp = async (email: string, password: string, fullName: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    if (!isDemoMode && supabase) {
      try {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (signUpErr) {
          setError(signUpErr.message);
          setLoading(false);
          return false;
        }

        if (data.user) {
          // Attempt to insert profile table row
          try {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              email: email,
              full_name: fullName,
              updated_at: new Date().toISOString()
            });
          } catch (e) {
            console.error("Could not write profile to table. Make sure SQL setup is complete.", e);
          }
        }
        setLoading(false);
        return true;
      } catch (err: any) {
        setError(err.message || "An error occurred during registration");
        setLoading(false);
        return false;
      }
    } else {
      // Demo Mode Sign Up
      try {
        const mockUserId = `usr-${Date.now()}`;
        const mockUser = { id: mockUserId, email };
        const mockProfile: UserProfile = {
          id: mockUserId,
          email,
          full_name: fullName,
          updated_at: new Date().toISOString()
        };

        localStorage.setItem("memora_user", JSON.stringify(mockUser));
        localStorage.setItem("memora_profile", JSON.stringify(mockProfile));

        // Save account locally to allow logins
        const localAccounts = JSON.parse(localStorage.getItem("memora_accounts") || "[]");
        localAccounts.push({ email, password, profile: mockProfile });
        localStorage.setItem("memora_accounts", JSON.stringify(localAccounts));

        setUser(mockUser);
        setProfile(mockProfile);
        setLoading(false);
        return true;
      } catch (err: any) {
        setError("Error setting up offline user");
        setLoading(false);
        return false;
      }
    }
  };

  // Sign In Flow
  const signIn = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    if (!isDemoMode && supabase) {
      try {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInErr) {
          setError(signInErr.message);
          setLoading(false);
          return false;
        }
        return true;
      } catch (err: any) {
        setError(err.message || "An error occurred during sign in");
        setLoading(false);
        return false;
      }
    } else {
      // Demo Mode Sign In
      try {
        const localAccounts = JSON.parse(localStorage.getItem("memora_accounts") || "[]");
        const match = localAccounts.find((acc: any) => acc.email === email && acc.password === password);

        if (match) {
          localStorage.setItem("memora_user", JSON.stringify({ id: match.profile.id, email }));
          localStorage.setItem("memora_profile", JSON.stringify(match.profile));
          setUser({ id: match.profile.id, email });
          setProfile(match.profile);
          setLoading(false);
          return true;
        } else {
          // Also check default demo account
          if (email === "demo@memora.ai" && password === "demo123") {
            const demoProfile = { id: "usr-demo", email, full_name: "Demo Professional" };
            localStorage.setItem("memora_user", JSON.stringify({ id: "usr-demo", email }));
            localStorage.setItem("memora_profile", JSON.stringify(demoProfile));
            setUser({ id: "usr-demo", email });
            setProfile(demoProfile);
            setLoading(false);
            return true;
          }
          setError("Invalid email or password. Hint: try demo@memora.ai / demo123");
          setLoading(false);
          return false;
        }
      } catch (err) {
        setError("Error during offline login simulation");
        setLoading(false);
        return false;
      }
    }
  };

  // Sign Out Flow
  const signOut = async () => {
    setLoading(true);
    if (!isDemoMode && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("memora_user");
      localStorage.removeItem("memora_profile");
    }
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  // Update Profile Name
  const updateProfile = async (fullName: string): Promise<boolean> => {
    if (!user) return false;
    
    if (!isDemoMode && supabase) {
      try {
        const { error: updateErr } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            updated_at: new Date().toISOString()
          });

        if (updateErr) {
          console.error("Could not write profile to DB, updating locally:", updateErr);
        }
        setProfile((prev) => prev ? { ...prev, full_name: fullName } : null);
        return true;
      } catch (err) {
        setProfile((prev) => prev ? { ...prev, full_name: fullName } : null);
        return true;
      }
    } else {
      const updated = profile ? { ...profile, full_name: fullName } : null;
      setProfile(updated);
      localStorage.setItem("memora_profile", JSON.stringify(updated));
      return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemoMode,
        error,
        signUp,
        signIn,
        signOut,
        updateProfile,
        clearError,
        supabaseConfigured: isSupabaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
