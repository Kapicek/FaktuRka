import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import Layout from "../layouts/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import SignIn from "../pages/SignIn";
import VerifyEmail from "../pages/VerifyEmail";
import Customers from "../pages/Customers";
import Invoices from "../pages/Invoices";
import CustomersForm from "../pages/CustomersForm";
import InvoicesForm from "../pages/InvoicesForm";
import InvoicesDetail from "../pages/InvoicesDetail";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";

export const router = createBrowserRouter([
    {
        element: <App />,
        children: [
            { path: "/sign-in", element: <SignIn /> },
            { path: "/sign-up", element: <SignIn /> },
            { path: "/forgot-password", element: <SignIn /> },
            { path: "/verify-email", element: <VerifyEmail /> },
            {
                path: "/",
                element: <ProtectedRoute />,
                children: [
                    {
                        element: <Layout />,
                        children: [
                            { index: true, element: <Navigate to="/invoices" replace /> },
                            { index: true, path: "invoices", element: <Invoices />, handle: { breadcrumb: "Invoices" } },
                            { index: true, path: "invoices/new", element: <InvoicesForm /> },
                            { index: true, path: "invoices/:id/edit", element: <InvoicesForm /> },
                            { index: true, path: "invoices/:id", element: <InvoicesDetail /> },
                            { index: true, path: "customers", element: <Customers />, handle: { breadcrumb: "Customers" } },
                            { index: true, path: "customers/new", element: <CustomersForm /> },
                            { index: true, path: "customers/:id/update", element: <CustomersForm /> },
                            { index: true, path: "profile", element: <Profile />, handle: { breadcrumb: "Profile" } },
                            { index: true, path: "settings", element: <Settings />, handle: { breadcrumb: "Settings" } },
                        ],
                    },
                ],
            },
        ],
    },
]);
