import { Home, Heart, PlayCircle, User, LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// 1. Adicionada a interface de Props
interface CatalogSidebarProps {
  collapsed?: boolean; // Deixei opcional caso não seja passado em algum lugar
  onCollapsedChange?: (collapsed: boolean) => void;
}

// 2. Recebendo as props no componente
export function CatalogSidebar({ collapsed = false, onCollapsedChange }: CatalogSidebarProps) {
  const { logout, currentProfile, clearCurrentProfile } = useAuth();
  
  // O estado 'mobileOpen' continua interno, pois só afeta o mobile
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
        // 🚨 CORREÇÃO AQUI: Mudado de z-40 para z-50 para ficar acima do Header (que é z-40)
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
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
        <div className={cn(
            "p-4 border-b border-sidebar-border flex items-center",
            collapsed ? "justify-center" : ""
        )}>
          <Logo size="md" showText={!collapsed} />
        </div>

        {/* Profile */}
        {currentProfile && (
          <button
            onClick={() => {
              clearCurrentProfile();
              setMobileOpen(false);
            }}
            className={cn(
                "p-4 border-b border-sidebar-border flex items-center gap-3 hover:bg-sidebar-accent transition-colors",
                collapsed ? "justify-center" : ""
            )}
          >
            <img 
              src={currentProfile.avatar} 
              alt={currentProfile.name} 
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
            {!collapsed && (
              <div className="text-left overflow-hidden">
                <p className="font-medium text-sidebar-foreground text-sm truncate">{currentProfile.name}</p>
                <p className="text-xs text-muted-foreground capitalize truncate">{currentProfile.type}</p>
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
                collapsed && "justify-center px-2", // Ajuste visual quando recolhido
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
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
              collapsed ? "justify-center px-2" : "justify-start"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>

        {/* Collapse Button - Desktop Only */}
        {/* 3. Aqui usamos a prop onCollapsedChange em vez de setState local */}
        <button
          onClick={() => onCollapsedChange && onCollapsedChange(!collapsed)}
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