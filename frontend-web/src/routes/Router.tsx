import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Layout from "../layouts/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import SignIn from "../pages/SignIn";
import Home from "../pages/Home";

export const router = createBrowserRouter([
    {
        element: <App />,
        children: [
            { path: "/sign-in", element: <SignIn /> },
            {
                path: "/",
                element: <ProtectedRoute />,
                children: [
                    {
                        element: <Layout />,
                        children: [
                            { index: true, element: <Home />, handle: { breadcrumb: "Home" } },
                        ],
                    },
                ],
            },
        ],
    },
]);
