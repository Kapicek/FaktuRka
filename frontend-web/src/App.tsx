import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import type { Navigation } from "@toolpad/core/AppProvider";
import { selectUser } from "./features/auth/authSlice";
import SessionProvider from "./SessionContext";
import { DescriptionRounded, HomeRounded, PeopleRounded } from "@mui/icons-material";

const NAVIGATION: Navigation = [
  { kind: "header", title: "Main" },
  { kind: "page", segment: "", title: "Home ", icon: <HomeRounded /> },
  { kind: "page", segment: "invoices", title: "Invoices ", icon: <DescriptionRounded /> },
  { kind: "page", segment: "customers", title: "Customers ", icon: <PeopleRounded /> },
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
