import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "react-hot-toast";
import { store, persistor } from "./store";
import Layout from "./components/Layout";
import IntervieweePage from "./pages/IntervieweePage";
import InterviewerPage from "./pages/InterviewerPage";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import PDFTest from "./components/PDFTest";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/interviewee" replace />,
      },
      {
        path: "interviewee",
        element: <IntervieweePage />,
      },
      {
        path: "interviewer",
        element: <InterviewerPage />,
      },
      {
        path: "pdf-test",
        element: <PDFTest />,
      },
    ],
  },
]);

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
          <div className="min-h-screen bg-gray-50">
            <RouterProvider router={router} />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  style: {
                    background: "#10b981",
                  },
                },
                error: {
                  style: {
                    background: "#ef4444",
                  },
                },
              }}
            />
          </div>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
