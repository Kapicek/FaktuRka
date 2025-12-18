import React, { createContext, useContext } from "react";

export interface Session {
    user: {
        name?: string;
        email?: string;
        image?: string;
    };
}

export interface SessionContextValue {
    session: Session | null;
}

export const SessionContext = createContext<SessionContextValue>({ session: null });

export const useSession = () => useContext(SessionContext);

