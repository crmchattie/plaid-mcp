"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type PlaidCredentials = {
  clientId: string;
  secret: string;
};

type PlaidCredentialsContextType = {
  credentials: PlaidCredentials | null;
  setCredentials: (creds: PlaidCredentials | null) => void;
  isConfigured: boolean;
};

const PlaidCredentialsContext = createContext<PlaidCredentialsContextType>({
  credentials: null,
  setCredentials: () => {},
  isConfigured: false,
});

const STORAGE_KEY = "plaid-credentials";

export function PlaidCredentialsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [credentials, setCredentialsState] = useState<PlaidCredentials | null>(
    null,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCredentialsState(JSON.parse(stored));
      }
    } catch {}
    setHydrated(true);
  }, []);

  const setCredentials = useCallback(
    (creds: PlaidCredentials | null) => {
      setCredentialsState(creds);
      if (creds) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    [],
  );

  if (!hydrated) {
    return null;
  }

  return (
    <PlaidCredentialsContext.Provider
      value={{
        credentials,
        setCredentials,
        isConfigured: Boolean(credentials?.clientId && credentials?.secret),
      }}
    >
      {children}
    </PlaidCredentialsContext.Provider>
  );
}

export function usePlaidCredentials() {
  return useContext(PlaidCredentialsContext);
}
