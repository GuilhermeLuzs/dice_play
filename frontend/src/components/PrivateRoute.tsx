import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  adminOnly?: boolean;
}

export function PrivateRoute({ adminOnly = false }: PrivateRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // 1. Enquanto verifica o token, mostra loading para não "chutar" o usuário
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Se não está logado, manda pro login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Se a rota é só para Admin e o usuário não é admin ('1')
  if (adminOnly && user?.is_admin !== '1') {
    // Redireciona usuário comum tentando acessar admin para os perfis
    return <Navigate to="/perfis" replace />;
  }

  // 4. Se passou por tudo, renderiza a página
  return <Outlet />;
}