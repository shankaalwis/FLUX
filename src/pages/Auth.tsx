import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Activity, TrendingUp, Shield, Loader2 } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleAuth = async (event: React.FormEvent, type: 'login' | 'signup') => {
    event.preventDefault();
    setLoading(true);

    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;
        toast.success('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative">
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle animated background graphic */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/5 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <img src="/logo.png" alt="Flux Logo" className="w-20 h-20 rounded-2xl shadow-lg" />
            <span className="text-4xl font-bold text-primary-foreground tracking-tight">Flux</span>
          </div>
          <h1 className="text-5xl font-extrabold text-primary-foreground mb-6 leading-tight">
            Master Your Financial <br /> Trends with AI
          </h1>
          <p className="text-primary-foreground/90 text-xl max-w-lg leading-relaxed">
            Flux transforms your financial history into clear, actionable intelligence.
            Experience the power of automated categorization and deep spending insights.
          </p>
        </div>

        <div className="space-y-8 relative z-10">
          <div className="flex items-start gap-5 group">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary-foreground mb-1">Instant Clarity</h3>
              <p className="text-primary-foreground/80 text-base">Track expenses, understand categories, and see your net worth trends instantly.</p>
            </div>
          </div>

          <div className="flex items-start gap-5 group">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300 delay-100">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary-foreground mb-1">Smart Insights</h3>
              <p className="text-primary-foreground/80 text-base">Analyze merchant spending, identify subscriptions, and optimize your budget.</p>
            </div>
          </div>

          <div className="flex items-start gap-5 group">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300 delay-200">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary-foreground mb-1">Bank-Grade Privacy</h3>
              <p className="text-primary-foreground/80 text-base">Your data is encrypted, isolated, and accessible only by you. No prying eyes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Flux</span>
            </div>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={(e) => handleAuth(e, 'login')}
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={(e) => handleAuth(e, 'signup')}
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
