import { Home, Heart, PlayCircle, User, LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function CatalogSidebar() {
  const { logout, currentProfile, clearCurrentProfile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/catalogo', icon: Home, label: 'Catálogo' },
    { to: '/favoritos', icon: Heart, label: 'Favoritos' },
    { to: '/assistindo', icon: PlayCircle, label: 'Assistindo' },
    { to: '/perfil', icon: User, label: 'Perfil' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-lg border border-sidebar-border lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-20" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-4 border-b border-sidebar-border d-flex items-center justify-center">
          <Logo size="md" showText={!collapsed} />
        </div>

        {/* Profile */}
        {currentProfile && (
          <button
            onClick={() => {
              clearCurrentProfile();
              setMobileOpen(false);
            }}
            className="p-4 border-b border-sidebar-border flex items-center gap-3 hover:bg-sidebar-accent transition-colors"
          >
            <img 
              src={currentProfile.avatar} 
              alt={currentProfile.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
            {!collapsed && (
              <div className="text-left">
                <p className="font-medium text-sidebar-foreground text-sm">{currentProfile.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentProfile.type}</p>
              </div>
            )}
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
            {!collapsed && <span className="text-sm text-muted-foreground">Tema</span>}
            <ThemeToggle />
          </div>
          
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              setMobileOpen(false);
            }}
            className={cn(
              "w-full text-destructive hover:text-destructive hover:bg-destructive/10",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>

        {/* Collapse Button - Desktop Only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full items-center justify-center hover:bg-sidebar-accent transition-colors hidden lg:flex"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>
    </>
  );
}
