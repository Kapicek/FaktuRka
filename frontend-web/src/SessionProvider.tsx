import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "./features/auth/authSlice";
import { SessionContext, type Session } from "./SessionContext";

type Props = React.PropsWithChildren;

export default function SessionProvider({ children }: Props) {
    const user = useSelector(selectUser);

    const session: Session | null = user
        ? {
            user: {
                name: user.email?.split("@")[0],
                email: user.email,
            },
        }
        : null;

    return <SessionContext.Provider value={{ session }}>{children}</SessionContext.Provider>;
}
