import React, { createContext, useContext } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "./features/auth/authSlice";

// Toolpad-kompatibilní session
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

type Props = React.PropsWithChildren<{}>;

export default function SessionProvider({ children }: Props) {
    const user = useSelector(selectUser); // typicky { email?: string; roles?: string[] } | null

    const session: Session | null = user
        ? {
            user: {
                name: user.email?.split("@")[0],
                email: user.email,
                // image: případně doplň až budeš mít
            },
        }
        : null;

    return (
        <SessionContext.Provider value={{ session }}>
            {children}
        </SessionContext.Provider>
    );
}
