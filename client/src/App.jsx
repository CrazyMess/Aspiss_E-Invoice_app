import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CompaniesPage from "./pages/CompaniesPage.jsx";
import AddCompany from "./pages/AddCompany.jsx";
import GeneratePage from "./pages/GeneratePage.jsx";
import DashboardLayout from "./components/dashboard-layout.jsx";
import BillingInfoPage from "./pages/BillingInfoPage.jsx";
import SubscriptionPage from "./pages/SubscriptionPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

// A simple component to protect routes
const ProtectedRoute = ({ redirectPath = "/login" }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null means checking

  useEffect(() => {
    // Check for token on mount
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token); // Convert token presence to boolean
  }, []);

  if (isAuthenticated === null) {
    // Still checking authentication status, render nothing or a loading spinner
    return  (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Vérification de l'authentification...</p>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={redirectPath} replace />;
};

function App() {
  const [currentUserFullName, setCurrentUserFullName] = useState("Utilisateur");

  useEffect(() => {
    // Attempt to load user info from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.fullName) {
          setCurrentUserFullName(user.fullName);
        }
      } catch (e) {
        console.error("Failed to parse user info from localStorage", e);
        localStorage.removeItem("user"); // Clear invalid user info
      }
    }
  }, []);

  // Function to update user info after login/signup (passed to login/signup pages)
  const handleUserLoginSignup = (user) => {
    if (user && user.fullName) {
      setCurrentUserFullName(user.fullName);
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Pass handleUserLoginSignup to Login/Signup to update name on success */}
        <Route path="/login" element={<LoginPage onLoginSuccess={handleUserLoginSignup}/>} />
        <Route path="/signup" element={<SignupPage onSignupSuccess={handleUserLoginSignup}/>} />

        {/* Protected Routes Group */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <DashboardLayout userFullName={currentUserFullName}>
                <Dashboard />
              </DashboardLayout>
            }
          />
          {/* Add more protected routes here as needed */}
          <Route
            path="/companies"
            element={
              <DashboardLayout userFullName={currentUserFullName}>
                <CompaniesPage /> {/* TODO: make companies page */}
              </DashboardLayout>
            }
          />
           <Route path="/companies/add" element={
            <DashboardLayout userFullName={currentUserFullName}>
              <AddCompany />
            </DashboardLayout>
          } />
           <Route path="/companies/edit/:id" element={
            <DashboardLayout userFullName={currentUserFullName}>
              <AddCompany /> {/* Reusing AddCompanyPage for editing */}
            </DashboardLayout>
          } />
          <Route path="/settings" element={
            <DashboardLayout userFullName={currentUserFullName}>
              <SettingsPage />
            </DashboardLayout>
          } />
          <Route
            path="/generate"
            element={
              <DashboardLayout userFullName={currentUserFullName}>
                <GeneratePage />
              </DashboardLayout>
            }
          />
          <Route path="/history" element={
            <DashboardLayout userFullName={currentUserFullName}>
              <HistoryPage />
            </DashboardLayout>
          } />
          <Route path="/subscription" element={
            <DashboardLayout userFullName={currentUserFullName}>
              <SubscriptionPage/>
            </DashboardLayout>
          } />
          <Route path="/settings" element={
            <DashboardLayout userFullName={currentUserFullName}>
              <div>Settings Page Placeholder</div>
            </DashboardLayout>
          } />
           <Route path="/billing-info" element={ 
            <DashboardLayout userFullName={currentUserFullName}>
              <BillingInfoPage />
            </DashboardLayout>
          } />
        </Route>
        
         {/* Catch-all for undefined routes */}
         <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
