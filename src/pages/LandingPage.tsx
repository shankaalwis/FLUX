import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  BarChart3,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Landmark,
  UploadCloud,
  Cpu,
  Zap,
  PieChart,
  Wallet,
  Sparkles,
  Search,
  LayoutGrid
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setEffectiveTheme(isDark ? 'dark' : 'light');
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  const scrollToDemo = () => {
    const element = document.getElementById('demo-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Flux Logo" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
              Flux
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:flex hover:bg-primary/10 transition-colors" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")} className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20 dark:opacity-30">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[128px] animate-pulse delay-1000" />
        </div>

        <div className="container relative mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/50 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            <span className="text-sm font-medium text-muted-foreground">Secure. Private. Intelligent.</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground/90 to-foreground/50 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 drop-shadow-sm">
            Financial Clarity, <br />
            <span className="text-foreground">Simplified.</span>
          </h1>

          <p className="max-w-xl mx-auto text-lg text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 leading-relaxed">
            Transform complex PDF bank statements into clear, actionable insights.
            Experience automated analysis with enterprise-grade privacy and security.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_0_60px_-10px_rgba(var(--primary),0.6)] transition-all hover:scale-105" onClick={() => navigate("/auth")}>
              Start for Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-background/80 transition-all hover:scale-105" onClick={scrollToDemo}>
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-muted/30 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Streamlined Workflow</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Three steps to complete financial oversight.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent dashed opacity-50" />

            <StepCard
              step={1}
              icon={<UploadCloud className="w-8 h-8 text-blue-500" />}
              title="Upload Statement"
              description="Securely upload your PDF bank statements. We support most major banks automatically."
            />
            <StepCard
              step={2}
              icon={<Cpu className="w-8 h-8 text-purple-500" />}
              title="Automated Processing"
              description="Our intelligent engine categorizes transactions and identifies subscriptions instantly."
            />
            <StepCard
              step={3}
              icon={<PieChart className="w-8 h-8 text-emerald-500" />}
              title="Actionable Insights"
              description="Gain immediate visibility into spending patterns and financial health."
            />
          </div>
        </div>
      </section>

      {/* Modern Features Tabs Section */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Comprehensive Analysis
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Advanced tools to master your personal finances.
            </p>
          </div>

          <Tabs defaultValue="organize" className="w-full max-w-5xl mx-auto">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-3 h-14 bg-background/50 backdrop-blur-md border border-border/50 p-1 rounded-full shadow-lg">
                <TabsTrigger value="organize" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground/70 transition-all duration-300">Organization</TabsTrigger>
                <TabsTrigger value="subscriptions" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground/70 transition-all duration-300">Subscriptions</TabsTrigger>
                <TabsTrigger value="trends" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground/70 transition-all duration-300">Analytics</TabsTrigger>
              </TabsList>
            </div>

            <div className="relative min-h-[400px] bg-gradient-to-br from-muted/30 via-background to-muted/30 rounded-3xl border border-border/50 p-8 md:p-12 shadow-2xl overflow-hidden">
              {/* Glow effect behind tabs content */}
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

              <TabsContent value="organize" className="mt-0 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-3xl font-bold">Universal Compatibility</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Flux utilizes advanced parsing algorithms to handle statements from diverse banking institutions. We ensure accurate data extraction without requiring manual formatting.
                    </p>
                    <ul className="space-y-3">
                      <FeatureItem text="Broad bank support" />
                      <FeatureItem text="Intelligent transaction cleaning" />
                      <FeatureItem text="Automated categorization" />
                    </ul>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500" />
                    <div className="relative bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 p-8 flex items-center justify-center h-80">
                      <UploadCloud className="w-32 h-32 text-blue-500 opacity-50 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      <div className="absolute bottom-6 bg-background/90 px-6 py-3 rounded-full text-base font-medium border border-border shadow-lg">
                        Processing: statement_jan.pdf
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subscriptions" className="mt-0 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-3xl font-bold">Smart Subscription <br />Detection</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Automatically identify and track recurring payments. Gain visibility into your annualized costs and manage your subscriptions effectively.
                    </p>
                    <ul className="space-y-3">
                      <FeatureItem text="Identify hidden recurring charges" />
                      <FeatureItem text="Calculate annualized costs" />
                      <FeatureItem text="Monitor renewal dates" />
                    </ul>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full group-hover:bg-purple-500/30 transition-all duration-500" />
                    <div className="relative bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 p-8 flex flex-col gap-4 h-80 justify-center">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center"><Zap className="w-5 h-5 text-red-500" /></div>
                        <div className="flex-1">
                          <div className="h-2 w-24 bg-foreground/10 rounded mb-1.5" />
                          <div className="h-2 w-16 bg-foreground/5 rounded" />
                        </div>
                        <div className="text-sm font-medium text-red-400">Streaming Service</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center"><Zap className="w-5 h-5 text-orange-500" /></div>
                        <div className="flex-1">
                          <div className="h-2 w-20 bg-foreground/10 rounded mb-1.5" />
                          <div className="h-2 w-12 bg-foreground/5 rounded" />
                        </div>
                        <div className="text-sm font-medium text-orange-400">Fitness Center</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="mt-0 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-3xl font-bold">Visual Analytics</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Transform raw transaction data into interactive charts. Track spending trends, analyze category breakdowns, and optimize your budget.
                    </p>
                    <ul className="space-y-3">
                      <FeatureItem text="Interactive data visualization" />
                      <FeatureItem text="Monthly trend analysis" />
                      <FeatureItem text="Spending optimization insights" />
                    </ul>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full group-hover:bg-emerald-500/30 transition-all duration-500" />
                    <div className="relative bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 p-8 flex items-center justify-center h-80">
                      <BarChart3 className="w-full h-full text-emerald-500 opacity-80 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>

      {/* Dashboard Preview Section (Image) */}
      <section id="demo-section" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Your Financial Command Center</h2>
          <div className="relative max-w-6xl mx-auto rounded-xl border border-border/50 shadow-2xl overflow-hidden group">
            {/* Image */}
            <img
              src={effectiveTheme === 'dark' ? "/dashboard-preview.png" : "/dashboard-preview-l.png"}
              alt="Flux Dashboard"
              className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-[1.02]"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>


      {/* Privacy Section */}
      <section className="py-32 relative overflow-hidden bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-b from-background to-transparent border border-border p-8 md:p-16 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary mb-6 ring-1 ring-primary/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-8">Uncompromised Privacy.</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Security is our foundation. Your data is encrypted, isolated, and accessible only by you.
                </p>
                <ul className="space-y-6">
                  <PrivacyItem text="Data is encrypted at rest and in transit (AES-256)" />
                  <PrivacyItem text="Zero-knowledge architecture; we cannot see your data" />
                  <PrivacyItem text="Complete data sovereignty: delete anytime" />
                </ul>
              </div>
              <div className="relative mt-8 lg:mt-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-purple-500/10 to-transparent blur-3xl opacity-50" />
                <div className="relative bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-8 border-b border-border/50 pb-4">
                    <Lock className="w-5 h-5 text-emerald-500" />
                    <span className="font-mono text-sm text-emerald-500 font-bold tracking-wider">SECURE ENVIRONMENT</span>
                  </div>
                  <div className="space-y-5 font-mono text-sm text-muted-foreground">
                    <div className="flex justify-between items-center bg-background/50 p-3 rounded border border-border/30">
                      <span>Encryption Standard</span>
                      <span className="text-emerald-400 font-bold">AES-256-GCM</span>
                    </div>
                    <div className="flex justify-between items-center bg-background/50 p-3 rounded border border-border/30">
                      <span>Data Isolation</span>
                      <span className="text-emerald-400 font-bold">Row-Level Security</span>
                    </div>
                    <div className="flex justify-between items-center bg-background/50 p-3 rounded border border-border/30">
                      <span>Third-Party Access</span>
                      <span className="text-red-400 font-bold">BLOCKED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-8 tracking-tight">Financial clarity awaits.</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join users who have taken control of their financial data with Flux.
          </p>
          <Button size="lg" className="h-16 px-12 text-xl rounded-full shadow-[0_0_50px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_0_80px_-10px_rgba(var(--primary),0.6)] transition-all hover:scale-105" onClick={() => navigate("/auth")}>
            Start for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-muted/10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-8">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Flux Logo" className="w-6 h-6 rounded" />
              <span className="font-bold">Flux</span>
            </div>
            <span className="text-xs text-muted-foreground hidden md:block">
              © {new Date().getFullYear()} Flux Financial Analysis. All Rights Reserved.
            </span>
          </div>

          <div className="flex gap-8 text-sm text-muted-foreground items-center">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <div className="ml-4 border-l pl-4 border-border">
              <ModeToggle />
            </div>
          </div>

          <div className="md:hidden text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} Flux Financial Analysis. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function PrivacyItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-4">
      <div className="mt-1">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
      </div>
      <span className="text-muted-foreground text-lg">{text}</span>
    </li>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-muted-foreground">
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      <span>{text}</span>
    </li>
  )
}

function StepCard({ step, icon, title, description }: { step: number, icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="relative text-center z-10 group cursor-default">
      <div className="w-20 h-20 rounded-2xl bg-background border border-border shadow-lg flex items-center justify-center mx-auto mb-6 relative transition-all duration-300 group-hover:scale-110 group-hover:shadow-primary/20">
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-background">
          {step}
        </div>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed px-4">
        {description}
      </p>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors shadow-sm">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}
