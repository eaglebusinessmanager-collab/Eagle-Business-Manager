import React, { createContext, useContext, useEffect, useState } from 'react';
import { Business, UserProfile, UserRole } from '../types';
import { dbService } from '../services/db';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface RegisterData {
  fullName: string;
  usernameOrPhone: string;
  password: string;
  businessName: string;
  businessCategory: string;
}

interface AuthContextType {
  user: UserProfile | null;
  business: Business | null;
  loading: boolean;
  error: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateBusiness: (updates: Partial<Business>) => Promise<Business | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'eagle_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session securely on app launch
  const restoreSession = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const profile = await dbService.getProfile(data.session.user.id);
          if (profile) {
            if (profile.status === 'suspended') {
              await supabase.auth.signOut();
              setUser(null);
              setBusiness(null);
              setError('Your account has been suspended by the platform administrator.');
              setLoading(false);
              return;
            }
            setUser(profile);
            const biz = await dbService.getBusiness(profile.businessId);
            setBusiness(biz);
            setLoading(false);
            return;
          }
        }
      }

      // Check local session storage
      const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUserId) {
        const profile = await dbService.getProfile(savedUserId);
        if (profile) {
          if (profile.status === 'suspended') {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
            setBusiness(null);
            setError('Your account has been suspended by the platform administrator.');
          } else {
            setUser(profile);
            const biz = await dbService.getBusiness(profile.businessId);
            setBusiness(biz);
          }
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (err: any) {
      console.error('Session restoration error:', err);
      setError(err.message || 'Failed to restore session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (!identifier.trim() || !password) {
        setError('Please enter both identifier and password.');
        setLoading(false);
        return false;
      }

      // 1. If Supabase configured with email
      if (isSupabaseConfigured() && supabase && identifier.includes('@')) {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password,
        });
        if (authErr) {
          setError(authErr.message);
          setLoading(false);
          return false;
        }
        if (data.user) {
          const profile = await dbService.getProfile(data.user.id);
          if (profile) {
            if (profile.status === 'suspended') {
              await supabase.auth.signOut();
              setError('Account suspended. Please contact platform support.');
              setLoading(false);
              return false;
            }
            setUser(profile);
            const biz = await dbService.getBusiness(profile.businessId);
            setBusiness(biz);
            localStorage.setItem(AUTH_STORAGE_KEY, profile.id);
            setLoading(false);
            return true;
          }
        }
      }

      // Brute-force rate limiting check
      const lockoutUntil = parseInt(localStorage.getItem('eagle_auth_lockout') || '0', 10);
      if (lockoutUntil > Date.now()) {
        const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
        setError(`Security Protection: Too many failed login attempts. Access temporarily locked for ${remainingSec}s.`);
        setLoading(false);
        return false;
      }

      const registerFailure = (msg: string) => {
        const fails = parseInt(localStorage.getItem('eagle_auth_fails') || '0', 10) + 1;
        localStorage.setItem('eagle_auth_fails', fails.toString());
        if (fails >= 5) {
          localStorage.setItem('eagle_auth_lockout', (Date.now() + 60000).toString());
          localStorage.removeItem('eagle_auth_fails');
          setError('Security Alert: 5 failed attempts reached. System locked for 60 seconds.');
        } else {
          setError(msg);
        }
        setLoading(false);
        return false;
      };

      const clearFailures = () => {
        localStorage.removeItem('eagle_auth_fails');
        localStorage.removeItem('eagle_auth_lockout');
      };

      // 2. Look up user by username, phone, or email in unified DB engine
      const profile = await dbService.getProfileByUsernameOrPhone(identifier.trim());
      if (!profile) {
        return registerFailure('Invalid credentials. Please verify your login details.');
      }

      if (profile.status === 'suspended') {
        setError('Your account is currently suspended. Please contact system support.');
        setLoading(false);
        return false;
      }

      // 3. Strict Administrator Verification
      const isAdminAttempt =
        profile.role === 'admin' ||
        identifier.trim().toLowerCase() === 'eaglebusinessmanager@gmail.com' ||
        identifier.trim().toLowerCase() === 'eaglebusinessmanager' ||
        identifier.trim().toLowerCase() === 'eagleadmin';

      if (isAdminAttempt) {
        // Master password check: MUST strictly match @Es%
        if (password !== '@Es%') {
          return registerFailure('Access Denied: Invalid administrator credentials.');
        }

        // Verify this is the authorized master administrator account
        if (profile.email?.toLowerCase() !== 'eaglebusinessmanager@gmail.com' && profile.id !== 'user-002') {
          return registerFailure('Access Denied: Unrecognized administrator identity.');
        }

        // Add audit log for administrative sign in
        await dbService.addAuditLog({
          id: 'log-' + Date.now(),
          adminId: profile.id,
          adminEmail: profile.email || 'eaglebusinessmanager@gmail.com',
          action: 'ADMIN_SIGN_IN',
          targetType: 'system',
          targetId: 'admin-portal',
          targetName: 'Eagle Admin Gateway',
          timestamp: new Date().toISOString(),
          details: { verified: true, role: 'admin' },
        });
      } else {
        // Standard merchant verification
        if (profile.password && profile.password !== password) {
          return registerFailure('Invalid credentials. Please verify your login details.');
        }
        if (password.length < 4) {
          return registerFailure('Invalid password. Passwords must be at least 4 characters.');
        }
      }

      clearFailures();

      // Update session
      localStorage.setItem(AUTH_STORAGE_KEY, profile.id);
      setUser(profile);
      const biz = await dbService.getBusiness(profile.businessId);
      setBusiness(biz);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setLoading(false);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (!data.fullName.trim() || !data.usernameOrPhone.trim() || !data.password || !data.businessName.trim()) {
        setError('All required fields must be completed.');
        setLoading(false);
        return false;
      }

      if (data.password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return false;
      }

      // Check if username/phone exists
      const existing = await dbService.getProfileByUsernameOrPhone(data.usernameOrPhone);
      if (existing) {
        setError('An account with this phone number or username already exists.');
        setLoading(false);
        return false;
      }

      const newBizId = 'biz-' + Date.now();
      const newUserId = 'user-' + Date.now();
      const isEmail = data.usernameOrPhone.includes('@');
      const cleanUsername = isEmail
        ? data.usernameOrPhone.split('@')[0]
        : data.usernameOrPhone.replace(/\s+/g, '').toLowerCase();

      // Create new business with UGX currency
      const newBusiness: Business = {
        id: newBizId,
        name: data.businessName.trim(),
        category: data.businessCategory || 'General Merchandise',
        phone: isEmail ? '+256 700 000 000' : data.usernameOrPhone,
        address: 'Kampala, Uganda',
        description: 'New business registered on Eagle Business Manager',
        currency: 'UGX',
        invoiceNotes: 'Payment is due within 7 days. Thank you for your partnership!',
        receiptFooter: 'Goods once sold are not returnable without official receipt.',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.createBusiness(newBusiness);

      // Create user profile - MANDATORY: Role is ALWAYS 'user'
      const newProfile: UserProfile = {
        id: newUserId,
        email: isEmail ? data.usernameOrPhone.trim().toLowerCase() : `${cleanUsername}@business.local`,
        phone: !isEmail ? data.usernameOrPhone.trim() : undefined,
        username: cleanUsername,
        fullName: data.fullName.trim(),
        role: 'user', // strictly enforced
        status: 'active',
        businessId: newBizId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        password: data.password,
      };

      await dbService.createProfile(newProfile);

      // If Supabase is active, register auth user
      if (isSupabaseConfigured() && supabase && isEmail) {
        try {
          await supabase.auth.signUp({
            email: data.usernameOrPhone.trim().toLowerCase(),
            password: data.password,
            options: {
              data: {
                full_name: data.fullName,
                username: cleanUsername,
                business_id: newBizId,
              },
            },
          });
        } catch (supaErr) {
          console.warn('Supabase auth signup warning:', supaErr);
        }
      }

      // Log in the newly registered user
      localStorage.setItem(AUTH_STORAGE_KEY, newProfile.id);
      setUser(newProfile);
      setBusiness(newBusiness);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setBusiness(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBusiness = async (updates: Partial<Business>): Promise<Business | null> => {
    if (!business) return null;
    const updated = await dbService.updateBusiness(business.id, updates);
    if (updated) {
      setBusiness(updated);
    }
    return updated;
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    setUser(updated);
  };

  const refreshAuth = async () => {
    if (user) {
      const p = await dbService.getProfile(user.id);
      if (p) {
        setUser(p);
        const b = await dbService.getBusiness(p.businessId);
        setBusiness(b);
      }
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        loading,
        error,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateBusiness,
        updateProfile,
        refreshAuth,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
