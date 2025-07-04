import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import {
  Home,
  Building2,
  FileText,
  History,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import {
  BUTTON_SIZE_DEFAULT,
  BUTTON_SIZE_SM,
  BUTTON_VARIANT_GHOST,
} from "../lib/tailwindClassStrings";

function DashboardLayout({ children, userFullName = "Utilisateur" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard", icon: Home },
    { name: "Mes Entreprises", href: "/companies", icon: Building2 },
    { name: "Générer Factures XML", href: "/generate", icon: FileText },
    { name: "Historique & Téléchargements", href: "/history", icon: History },
    { name: "Mon Abonnement", href: "/subscription", icon: CreditCard },
    { name: "Paramètres du Compte", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear the token
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="text-xl font-bold text-gray-900">XML Invoice</span>
            <Button
              className={cn(
                BUTTON_VARIANT_GHOST,
                BUTTON_SIZE_SM,
                "h-9 px-3 hover:bg-gray-100 hover:text-gray-900"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location.pathname === item.href
                    ? "bg-blue-100 text-blue-900" // Active state
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
            <Button
              className={cn(
                BUTTON_VARIANT_GHOST,
                "w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Déconnexion
            </Button>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <span className="text-xl font-bold text-gray-900">
              XML Invoice Generator
            </span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location.pathname === item.href
                    ? "bg-blue-100 text-blue-900" // Active state
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900" // Inactive state
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <Button
              className={cn(
                BUTTON_VARIANT_GHOST, BUTTON_SIZE_DEFAULT,
                "w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

        {/* Main content area */}
        <div className="lg:pl-64">
            {/* Top bar */ }
            <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                <Button 
                    className={cn(BUTTON_VARIANT_GHOST,BUTTON_SIZE_SM, "lg:hidden h-9 px-3 hover:bg-gray-100 hover:text-gray-900")}
                    onClick={() => setSidebarOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1"></div>
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <div className="text-sm text-gray-600">
                                Bienvenue, <span className="font-semibold">{userFullName}</span>
                            </div>
                        </div>
                    </div>
            </div>

            {/* Main content */}
            <main className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
            </main>
        </div>
    </div>
  );
}

export default DashboardLayout;