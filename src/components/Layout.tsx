import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { cn } from "../lib/utils";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary-600">
                  AI Interview Assistant
                </h1>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-8">
              <NavLink
                to="/interviewee"
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )
                }
              >
                Interviewee
              </NavLink>
              <NavLink
                to="/interviewer"
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )
                }
              >
                Interviewer
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
