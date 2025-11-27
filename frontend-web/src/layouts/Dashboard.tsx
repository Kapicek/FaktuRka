import LinearProgress from "@mui/material/LinearProgress";
import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { useSelector } from "react-redux";
import { selectUser } from "../features/auth/authSlice";
import UserMenu from "../components/user-menu/UserMenu";
import Page from "../pages/Page";

export default function Layout() {
    const user = useSelector(selectUser);
    if (user === undefined) return <LinearProgress />;
    return (
        <DashboardLayout
            slots={{
                toolbarActions: UserMenu,
            }}>
            <Page>
                <Outlet />
            </Page>
        </DashboardLayout>
    );
}