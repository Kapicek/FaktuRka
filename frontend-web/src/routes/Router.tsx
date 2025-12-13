import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Layout from "../layouts/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Home from "../pages/Home";
import Customers from "../pages/Customers";
import Invoices from "../pages/Invoices";
import { HomeRounded } from "@mui/icons-material";
import CustomersForm from "../pages/CustomersForm";
import InvoicesForm from "../pages/InvoicesForm";
import InvoicesDetail from "../pages/InvoicesDetail";
import Profile from "../pages/Profile";

export const router = createBrowserRouter([
    {
        element: <App />,
        children: [
            { path: "/sign-in", element: <SignIn /> },
            { path: "/sign-up", element: <SignUp /> },
            {
                path: "/",
                element: <ProtectedRoute />,
                children: [
                    {
                        element: <Layout />,
                        children: [
                            { index: true, element: <Home />, handle: { breadcrumb: <HomeRounded /> } },
                            { index: true, path: "invoices", element: <Invoices />, handle: { breadcrumb: "Invoices" } },
                            { index: true, path: "invoices/new", element: <InvoicesForm /> },
                            { index: true, path: "invoices/:id", element: <InvoicesDetail /> },
                            { index: true, path: "customers", element: <Customers />, handle: { breadcrumb: "Customers" } },
                            { index: true, path: "customers/new", element: <CustomersForm /> },
                            { index: true, path: "profile", element: <Profile />, handle: { breadcrumb: "Profile" } },
                        ],
                    },
                ],
            },
        ],
    },
]);
