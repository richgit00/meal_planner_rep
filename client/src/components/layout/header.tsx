import { Link, useLocation } from "wouter";
import { Utensils, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Meal Plan", path: "/meal-plan" },
    { name: "Shopping List", path: "/shopping-list" },
    { name: "Pantry", path: "/pantry" },
    { name: "Admin", path: "/admin" },
    { name: "Favourites", path: "/favourites" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-lg">M</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-slate-800">MealPlanner</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`font-medium transition-colors duration-200 py-2 ${
                  location === item.path
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-600 hover:text-primary"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-primary p-2 -mr-2 active:scale-95 transition-transform"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 font-medium transition-colors duration-200 active:scale-95 ${
                    location === item.path
                      ? "text-primary bg-blue-50 border-r-4 border-primary"
                      : "text-slate-600 hover:text-primary hover:bg-slate-50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}