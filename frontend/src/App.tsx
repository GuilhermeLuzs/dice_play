import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PerfilProvider } from '@/contexts/PerfilContext';
import { VideoProvider } from "@/contexts/VideoContext";
import { PrivateRoute } from "@/components/PrivateRoute";

// Pages
import Index from "./pages/Index";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import Perfis from "./pages/Perfis";
import Catalogo from "./pages/Catalogo";
import Favoritos from "./pages/Favoritos";
import Assistindo from "./pages/Assistindo";
import PerfilConfig from "./pages/PerfilConfig";
import NotFound from "./pages/NotFound";
import AdminVideos from "./pages/AdminVideos";
import AdminUsuarios from "./pages/AdminUsuarios";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <PerfilProvider>
          <VideoProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {/* ATUALIZAÇÃO AQUI: Adicionar as flags futuras */}
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <Routes>
                  {/* --- ROTAS PÚBLICAS --- */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/cadastro" element={<Cadastro />} />

                  {/* --- ROTAS PRIVADAS --- */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/perfis" element={<Perfis />} />
                    <Route path="/catalogo" element={<Catalogo />} />
                    <Route path="/favoritos" element={<Favoritos />} />
                    <Route path="/assistindo" element={<Assistindo />} />
                    <Route path="/perfil" element={<PerfilConfig />} />
                  </Route>

                  {/* --- ROTAS DE ADMIN --- */}
                  <Route element={<PrivateRoute adminOnly={true} />}>
                    <Route path="/admin/videos" element={<AdminVideos />} />
                    <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                    <Route path="/admin" element={<Navigate to="/admin/videos" replace />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </VideoProvider>
        </PerfilProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;