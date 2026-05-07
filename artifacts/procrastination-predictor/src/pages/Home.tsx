import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Cpu, Database, Activity, AlertTriangle, CheckCircle, Zap, 
  RefreshCw, Trash2, Sliders, LayoutDashboard, BarChart3, 
  GitBranch, ScrollText, Info, Menu, X, BookOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from "recharts";

// Types
type PredictionRequest = {
  sleep_hours: number;
  screen_time: number;
  study_hours: number;
  stress_level: number;
  assignment_completion: number;
};

type PredictionResponse = {
  prediction: number;
  label: string;
  confidence: number;
  model_accuracy: number;
  message: string;
};

type HistoryItem = PredictionRequest & PredictionResponse & { id: number };

type ModelInfo = {
  accuracy: number;
  model_type: string;
  training_samples: number;
  feature_importances: Array<{ feature: string; coefficient: number }>;
};

// --- Components --- //

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars: { x: number, y: number, radius: number, vx: number, vy: number }[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        vx: Math.floor(Math.random() * 50) - 25,
        vy: Math.floor(Math.random() * 50) - 25
      });
    }

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        
        star.x += star.vx / 100;
        star.y += star.vy / 100;
        
        if (star.x < 0 || star.x > canvas.width) star.vx = -star.vx;
        if (star.y < 0 || star.y > canvas.height) star.vy = -star.vy;
      });
      
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
};

// Colors for charts
const COLORS = {
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#EF4444',
  primary: '#7C3AED',
  secondary: '#06B6D4'
};

export default function Home() {
  // State
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(true);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<PredictionRequest>({
    sleep_hours: 7,
    screen_time: 4,
    study_hours: 3,
    stress_level: 5,
    assignment_completion: 50
  });

  const fetchModelInfo = async () => {
    try {
      const res = await fetch('/api/model-info');
      if (res.ok) {
        const data = await res.json();
        setModelInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch model info", err);
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    fetchModelInfo();
    fetchHistory();
  }, []);

  const handlePredict = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Prediction failed");
      
      const data = await res.json();
      setPredictionResult(data);
      fetchHistory();
      toast.success("Analysis complete");
    } catch (err) {
      toast.error("Failed to get prediction from the server");
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
        toast.success("History cleared");
      }
    } catch (err) {
      toast.error("Failed to clear history");
    }
  };

  const setPreset = (type: 'good' | 'risk') => {
    if (type === 'good') {
      setFormData({
        sleep_hours: 8,
        screen_time: 2,
        study_hours: 5,
        stress_level: 3,
        assignment_completion: 90
      });
    } else {
      setFormData({
        sleep_hours: 5,
        screen_time: 8,
        study_hours: 1,
        stress_level: 8,
        assignment_completion: 30
      });
    }
  };

  const getRiskColor = (label: string) => {
    if (label.includes("Low")) return "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]";
    if (label.includes("Medium")) return "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]";
    return "text-rose-400 drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]";
  };

  // Derived Stats
  const stats = useMemo(() => {
    const total = history.length;
    const highRisk = history.filter(h => h.label.includes('High')).length;
    const avgConf = total > 0 ? history.reduce((acc, h) => acc + h.confidence, 0) / total : 0;
    return { total, highRisk, avgConf };
  }, [history]);

  const riskDistribution = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    history.forEach(h => {
      if (h.label.includes('Low')) counts.Low++;
      else if (h.label.includes('Medium')) counts.Medium++;
      else counts.High++;
    });
    return [
      { name: 'Low Risk', value: counts.Low, color: COLORS.emerald },
      { name: 'Medium Risk', value: counts.Medium, color: COLORS.amber },
      { name: 'High Risk', value: counts.High, color: COLORS.rose }
    ].filter(d => d.value > 0);
  }, [history]);

  const featureTrends = useMemo(() => {
    return history.map(h => ({
      name: `#\${h.id}`,
      sleep: h.sleep_hours,
      screen: h.screen_time,
      study: h.study_hours,
      stress: h.stress_level,
      completion: h.assignment_completion / 10 // scale down to match others roughly
    }));
  }, [history]);

  const renderSidebar = () => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'features', label: 'Feature Insights', icon: GitBranch },
      { id: 'logs', label: 'Prediction Logs', icon: ScrollText },
      { id: 'about', label: 'About Model', icon: Info },
    ];

    return (
      <div className="flex flex-col h-full bg-background/40 backdrop-blur-xl border-r border-white/10 relative z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 border border-primary/30 text-primary flex-shrink-0 neon-border">
            <Brain className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary hidden md:block">
            Procrastination<br />Predictor
          </span>
          <span className="font-display font-bold text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary md:hidden">
            Predictor
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium text-sm
                  \${isActive 
                    ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-[inset_0_0_10px_rgba(124,58,237,0.1)] neon-text' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border-l-2 border-transparent'
                  }`}
              >
                <item.icon className={`w-5 h-5 \${isActive ? 'drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {modelInfo && (
          <div className="p-6 mt-auto hidden md:block">
            <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/10 to-transparent opacity-50" />
              <Cpu className="w-5 h-5 mx-auto mb-2 text-secondary" />
              <div className="text-xs text-muted-foreground mb-1">Model Accuracy</div>
              <div className="text-lg font-display font-bold text-secondary text-shadow-sm shadow-secondary">
                {modelInfo.accuracy.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Header */}
      <header className="space-y-2">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Procrastination Predictor
        </h1>
        <p className="text-muted-foreground">Monitor and optimize your study habits with neural telemetry.</p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 md:p-6 flex flex-col items-center justify-center text-center">
          <Activity className="w-6 h-6 text-primary mb-2 opacity-80" />
          <div className="text-2xl font-display font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Total Predictions</div>
        </div>
        <div className="glass-card rounded-xl p-4 md:p-6 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-6 h-6 text-rose-500 mb-2 opacity-80" />
          <div className="text-2xl font-display font-bold text-rose-400">{stats.highRisk}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">High Risk Count</div>
        </div>
        <div className="glass-card rounded-xl p-4 md:p-6 flex flex-col items-center justify-center text-center">
          <Zap className="w-6 h-6 text-secondary mb-2 opacity-80" />
          <div className="text-2xl font-display font-bold text-secondary">{stats.avgConf.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Avg Confidence</div>
        </div>
        <div className="glass-card rounded-xl p-4 md:p-6 flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-6 h-6 text-emerald-500 mb-2 opacity-80" />
          <div className="text-2xl font-display font-bold text-emerald-400">{modelInfo?.accuracy.toFixed(1) || '--'}%</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Model Accuracy</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3 glass-card rounded-2xl p-6 md:p-8 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Telemetry Input
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreset('good')} className="h-8 text-xs border-primary/20 hover:bg-primary/20">
                Optimal
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreset('risk')} className="h-8 text-xs border-destructive/20 hover:bg-destructive/20">
                At-Risk
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">Sleep Hours</Label>
                <span className="text-secondary font-mono">{formData.sleep_hours}h</span>
              </div>
              <Slider 
                value={[formData.sleep_hours]} 
                min={0} max={12} step={0.5}
                onValueChange={(val) => setFormData({...formData, sleep_hours: val[0]})}
                className="[&_[role=slider]]:bg-secondary"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">Screen Time</Label>
                <span className="text-secondary font-mono">{formData.screen_time}h</span>
              </div>
              <Slider 
                value={[formData.screen_time]} 
                min={0} max={16} step={0.5}
                onValueChange={(val) => setFormData({...formData, screen_time: val[0]})}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">Study Hours</Label>
                <span className="text-primary font-mono">{formData.study_hours}h</span>
              </div>
              <Slider 
                value={[formData.study_hours]} 
                min={0} max={12} step={0.5}
                onValueChange={(val) => setFormData({...formData, study_hours: val[0]})}
                className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">Stress Level</Label>
                <span className="text-destructive font-mono">{formData.stress_level}/10</span>
              </div>
              <Slider 
                value={[formData.stress_level]} 
                min={1} max={10} step={1}
                onValueChange={(val) => setFormData({...formData, stress_level: val[0]})}
                className="[&_[role=slider]]:bg-destructive [&_[role=slider]]:border-destructive [&_.bg-primary]:bg-destructive"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">Assignment Completion</Label>
                <span className="text-accent font-mono">{formData.assignment_completion}%</span>
              </div>
              <Slider 
                value={[formData.assignment_completion]} 
                min={0} max={100} step={1}
                onValueChange={(val) => setFormData({...formData, assignment_completion: val[0]})}
                className="[&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&_.bg-primary]:bg-accent"
              />
            </div>
          </div>

          <Button 
            onClick={handlePredict} 
            disabled={isLoading}
            className="w-full h-12 text-md font-display tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all hover:shadow-[0_0_25px_rgba(124,58,237,0.8)]"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
            INITIALIZE ANALYSIS
          </Button>
        </div>

        {/* Result */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {predictionResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-6 md:p-8 neon-border relative overflow-hidden h-full flex flex-col justify-center"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                
                <h3 className="text-sm font-display text-muted-foreground uppercase tracking-widest mb-6 text-center">Analysis Result</h3>
                
                <div className="text-center mb-8">
                  <div className={`text-4xl font-display font-bold mb-2 \${getRiskColor(predictionResult.label)}`}>
                    {predictionResult.label}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Prediction Complete
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence Level</span>
                    <span className="font-mono text-primary">{predictionResult.confidence.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `\${predictionResult.confidence}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-primary shadow-[0_0_10px_rgba(124,58,237,0.8)] rounded-full"
                    />
                  </div>
                </div>

                <div className="bg-background/50 rounded-xl p-4 border border-white/5 relative mt-auto">
                  <Activity className="absolute top-4 right-4 w-4 h-4 text-secondary opacity-50" />
                  <p className="text-sm leading-relaxed text-slate-300 font-mono">
                    {predictionResult.message}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-6 md:p-8 h-full flex flex-col items-center justify-center text-center text-muted-foreground border-dashed"
              >
                <Database className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-display">AWAITING TELEMETRY</p>
                <p className="text-sm mt-2 opacity-60 max-w-[200px]">Input your current metrics to generate a risk assessment.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Behavioral Analytics
        </h1>
        <p className="text-muted-foreground">Historical telemetry analysis and trend visualizations.</p>
      </header>

      {history.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
          <p className="text-lg font-display text-muted-foreground">Insufficient Data</p>
          <p className="text-sm text-muted-foreground opacity-60 mt-2">Run predictions to generate analytics.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 col-span-2 lg:col-span-1 h-[400px] flex flex-col">
            <h3 className="font-display font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Prediction Confidence History
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <defs>
                    <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="id" stroke="rgba(255,255,255,0.3)" tickFormatter={(val) => `#\${val}`} />
                  <YAxis stroke="rgba(255,255,255,0.3)" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(5, 11, 26, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="confidence" fill="url(#colorConf)" radius={[4, 4, 0, 0]} name="Confidence %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 col-span-2 lg:col-span-1 h-[400px] flex flex-col">
            <h3 className="font-display font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Risk Distribution
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-\${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(5, 11, 26, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 col-span-2 h-[400px] flex flex-col">
            <h3 className="font-display font-semibold mb-6 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-secondary" /> Input Feature Trends
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={featureTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(5, 11, 26, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sleep" stroke="#94A3B8" strokeWidth={2} dot={false} name="Sleep (h)" />
                  <Line type="monotone" dataKey="screen" stroke={COLORS.secondary} strokeWidth={2} dot={false} name="Screen (h)" />
                  <Line type="monotone" dataKey="study" stroke={COLORS.primary} strokeWidth={2} dot={false} name="Study (h)" />
                  <Line type="monotone" dataKey="stress" stroke={COLORS.rose} strokeWidth={2} dot={false} name="Stress (/10)" />
                  <Line type="monotone" dataKey="completion" stroke={COLORS.emerald} strokeWidth={2} dot={false} name="Completion (/10)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFeatures = () => {
    if (!modelInfo) return null;
    
    // Sort features by impact magnitude
    const sortedFeatures = [...modelInfo.feature_importances].sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient)).map(f => ({
      ...f,
      name: f.feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));

    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Neural Feature Analysis
          </h1>
          <p className="text-muted-foreground">Deep dive into model coefficients and impact vectors.</p>
        </header>

        <div className="glass-card rounded-2xl p-6 md:p-8 space-y-8">
          <div>
            <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Feature Importance Map
            </h3>
            <p className="text-sm text-muted-foreground mb-8">
              Positive coefficients push toward procrastination. Negative coefficients reduce risk.
            </p>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedFeatures} layout="vertical" margin={{ left: 50, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.3)" />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.6)" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(5, 11, 26, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(val: number) => val.toFixed(4)}
                  />
                  <Bar dataKey="coefficient">
                    {sortedFeatures.map((entry, index) => (
                      <Cell key={`cell-\${index}`} fill={entry.coefficient > 0 ? COLORS.rose : COLORS.emerald} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-background/50 rounded-xl p-6 border border-white/5 font-mono text-sm space-y-4 text-slate-400">
            <h4 className="text-white mb-4 font-sans font-semibold">Model Parameters</h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Architecture</div>
                <div className="text-primary text-lg">{modelInfo.model_type}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Training Samples</div>
                <div className="text-secondary text-lg">{modelInfo.training_samples.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Base Accuracy</div>
                <div className="text-accent text-lg">{modelInfo.accuracy.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLogs = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <header className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Telemetry Logs
          </h1>
          <p className="text-muted-foreground">Raw historical record of system predictions.</p>
        </header>
        {history.length > 0 && (
          <Button variant="outline" onClick={clearHistory} className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Purge Logs
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground font-mono text-sm">
          <Database className="w-10 h-10 mx-auto mb-4 opacity-30" />
          No telemetry data.
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-white/5 border-b border-white/10 font-display text-muted-foreground uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4">Sleep</th>
                  <th className="px-6 py-4">Screen</th>
                  <th className="px-6 py-4">Study</th>
                  <th className="px-6 py-4">Stress</th>
                  <th className="px-6 py-4">Completion</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {history.map((item, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={item.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors even:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border \${
                        item.label.includes('Low') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        item.label.includes('Medium') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {item.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `\${item.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-primary">{item.confidence.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{item.sleep_hours}h</td>
                    <td className="px-6 py-4">{item.screen_time}h</td>
                    <td className="px-6 py-4">{item.study_hours}h</td>
                    <td className="px-6 py-4 text-rose-300">{item.stress_level}/10</td>
                    <td className="px-6 py-4 text-emerald-300">{item.assignment_completion}%</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderAbout = () => (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Model Architecture
        </h1>
        <p className="text-muted-foreground">Technical specifications of the underlying machine learning implementation.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" /> Algorithm
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            The core engine uses a Logistic Regression model tailored for multi-class probability estimation. By analyzing linear combinations of behavioral inputs mapped through a sigmoid curve, it excels at providing stable confidence scores across definitive risk boundaries.
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-secondary" /> Dataset
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Trained on a normalized synthetic dataset containing 500 samples. The data encompasses 5 core features carefully balanced across the risk classes to prevent predictive bias and ensure generalized accuracy.
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-accent" /> Training Pipeline
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Data flows through a StandardScaler normalization phase to align feature magnitudes. Following an 80/20 train-test split, the Logistic Regression fit occurs, locking parameters into the weights visible in the Feature Insights panel.
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-400" /> Interpretation Guide
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Coefficients quantify directional impact. Screen Time and Stress typically carry positive weights (increasing risk), while Study Hours and Assignment Completion carry negative weights (mitigating risk). Sleep acts as a complex modifier.
          </p>
        </div>
      </div>

      <div className="text-center pt-12 pb-4 text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">
        Built using FastAPI, React, and scikit-learn
      </div>
    </div>
  );

  const sections: Record<string, () => React.ReactNode> = {
    'dashboard': renderDashboard,
    'analytics': renderAnalytics,
    'features': renderFeatures,
    'logs': renderLogs,
    'about': renderAbout
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row relative text-foreground font-sans overflow-hidden selection:bg-primary/30">
      <StarField />
      
      {/* Mobile Top Nav */}
      <div className="md:hidden flex items-center justify-between p-4 glass-card z-30 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
            <Brain className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-sm bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Predictor
          </span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar - Desktop fixed, Mobile overlay */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        \${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {renderSidebar()}
      </aside>
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-y-auto h-[100dvh] md:h-screen">
        <div className="container mx-auto px-4 py-8 md:p-10 max-w-6xl pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {sections[activeSection]?.()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Toaster theme="dark" />
    </div>
  );
}
