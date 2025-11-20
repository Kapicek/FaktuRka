import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Provider } from 'react-redux';
import { store } from './app/store.ts';
import { hydrateFromStorage, setCredentials, logout } from './features/auth/authSlice.ts';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/Router.tsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

if (!GOOGLE_CLIENT_ID) {
  // eslint-disable-next-line no-console
  console.error("VITE_GOOGLE_CLIENT_ID není nastavené v .env.local");
}

store.dispatch(hydrateFromStorage());

window.addEventListener("storage", (e) => {
  if (e.key === "auth_token") {
    if (e.newValue) {
      store.dispatch(setCredentials({ token: e.newValue }));
    } else {
      store.dispatch(logout());
    }
  }
});

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element with id="root" not found');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
