import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFounderAuth } from '@/hooks/useFounderAuth';
import { supabase } from '@/integrations/supabase/client';
import { useOffline } from '@/contexts/OfflineContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Eye, EyeOff, Loader2, Shield } from 'lucide-react';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFounderLogin, setIsFounderLogin] = useState(false);
  const { signIn, signUp, user, loading, hasOfflineSession } = useAuth();
  const { isOnline } = useOffline();
  const { signInAsFounder, isLoading: founderLoading } = useFounderAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Si está offline y tiene sesión offline válida, ir directo al dashboard
    if (!isOnline && hasOfflineSession && user) {
      console.log('[Auth] Offline with valid session, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }

    const checkUserRole = async () => {
      if (!loading && user) {
        // Si está offline y ya hay sesión, entra directo (no podemos consultar roles)
        if (!isOnline) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // Check if user is founder
        try {
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'founder')
            .maybeSingle();

          if (data) {
            navigate('/founder', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          // If query fails (offline), just go to dashboard
          console.log('[Auth] Role check failed, going to dashboard');
          navigate('/dashboard', { replace: true });
        }
      }
    };

    checkUserRole();
  }, [user, loading, navigate, isOnline, hasOfflineSession]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      toast({
        variant: 'destructive',
        title: 'Sin conexión',
        description: 'Para iniciar sesión necesitas internet al menos una vez. Luego podrás usar la app offline.',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description:
          error.message === 'Invalid login credentials'
            ? 'Credenciales inválidas. Verifica tu email y contraseña.'
            : error.message,
      });
    } else {
      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente.',
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleFounderSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      toast({
        variant: 'destructive',
        title: 'Sin conexión',
        description: 'El acceso Founder requiere internet.',
      });
      return;
    }

    const result = await signInAsFounder(email, password);
    if (result.success) {
      navigate('/founder');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      toast({
        variant: 'destructive',
        title: 'Sin conexión',
        description: 'Para registrarte necesitas internet. Luego podrás usar la app offline.',
      });
      return;
    }

    setIsLoading(true);

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Contraseña muy corta',
        description: 'La contraseña debe tener al menos 6 caracteres.',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error al registrarse',
        description:
          error.message === 'User already registered'
            ? 'Este email ya está registrado. Intenta iniciar sesión.'
            : error.message,
      });
    } else {
      toast({
        title: '¡Cuenta creada!',
        description: 'Tu cuenta ha sido creada exitosamente.',
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Founder Login View
  if (isFounderLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-500/10 via-background to-amber-600/5 p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-amber-500 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Acceso Founder</span>
          </div>

          <Card className="border-amber-500/30 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Panel de Administración</CardTitle>
              <CardDescription>
                Acceso exclusivo para el equipo de Agro Data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFounderSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="founder-email">Correo electrónico</Label>
                  <Input
                    id="founder-email"
                    type="email"
                    placeholder="founder@agrodata.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-amber-500/30 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="founder-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="founder-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-amber-500/30 focus:border-amber-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white" 
                  disabled={founderLoading}
                >
                  {founderLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Acceder como Founder
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <button 
              onClick={() => setIsFounderLogin(false)}
              className="text-primary hover:underline"
            >
              ← Volver al inicio de sesión normal
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 bg-primary rounded-xl">
            <Leaf className="h-8 w-8 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">Agro Data</span>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Accede a tu cuenta</CardTitle>
            <CardDescription>
              Gestiona tu ganadería de forma inteligente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre completo</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Correo electrónico</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mínimo 6 caracteres
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            ¿Necesitas ayuda?{' '}
            <a href="/" className="text-primary hover:underline">
              Volver al inicio
            </a>
          </p>
          
          <div className="flex justify-center">
            <button
              onClick={() => setIsFounderLogin(true)}
              className="text-xs text-muted-foreground/60 hover:text-amber-500 transition-colors flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              Acceso Founder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
