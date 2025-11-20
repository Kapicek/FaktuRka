import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import type { Navigation } from "@toolpad/core/AppProvider";
import { selectUser } from "./features/auth/authSlice";
import SchoolIcon from '@mui/icons-material/School';
import SessionProvider from "./SessionContext";

const NAVIGATION: Navigation = [
  { kind: "header", title: "Main" },
  { kind: "page", segment: "", title: "Home ", icon: <SchoolIcon /> },
];

const BRANDING = { title: "Fakturka" } as const;

export default function App() {
  const user = useSelector(selectUser);
  const sessionObj = user
    ? { user: { email: user.email, name: user.email?.split("@")[0] } }
    : null;

  return (
    <ReactRouterAppProvider
      navigation={NAVIGATION}
      branding={BRANDING}
      session={sessionObj}
    >
      <SessionProvider>
        <Outlet />
      </SessionProvider>
    </ReactRouterAppProvider>
  );
}
