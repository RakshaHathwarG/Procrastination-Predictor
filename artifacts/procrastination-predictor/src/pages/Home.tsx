import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Cpu, Database, Activity, AlertTriangle, CheckCircle, Zap, RefreshCw, Trash2, Sliders, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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

export default function Home() {
  // State
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(true);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);

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

  return (
    <div className="min-h-screen relative text-foreground font-sans overflow-x-hidden selection:bg-primary/30 pb-20">
      <StarField />
      
      <div className="relative z-10 container mx-auto px-4 pt-12 md:pt-20 max-w-5xl space-y-16">
        
        {/* Header */}
        <header className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/30 text-primary mb-4"
          >
            <Brain className="w-10 h-10" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"
          >
            Procrastination Predictor
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Advanced machine learning telemetry to monitor and optimize your study habits.
          </motion.p>
          
          {modelInfo && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-sm font-medium"
            >
              <Cpu className="w-4 h-4" />
              Model Accuracy: {modelInfo.accuracy.toFixed(1)}%
            </motion.div>
          )}
        </header>

        {/* Main Grid */}
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Left Column: Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-7 space-y-6"
          >
            <div className="glass-card rounded-2xl p-6 md:p-8 space-y-8">
              <div className="flex items-center justify-between">
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
          </motion.div>

          {/* Right Column: Result */}
          <div className="md:col-span-5 space-y-6">
            <AnimatePresence mode="wait">
              {predictionResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-2xl p-6 md:p-8 neon-border relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                  
                  <h3 className="text-sm font-display text-muted-foreground uppercase tracking-widest mb-6">Analysis Result</h3>
                  
                  <div className="text-center mb-8">
                    <div className={`text-4xl font-display font-bold mb-2 ${getRiskColor(predictionResult.label)}`}>
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
                      <span className="font-mono text-primary">{(predictionResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${predictionResult.confidence * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-primary shadow-[0_0_10px_rgba(124,58,237,0.8)] rounded-full"
                      />
                    </div>
                  </div>

                  <div className="bg-background/50 rounded-xl p-4 border border-white/5 relative">
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

        {/* Model Insights */}
        {modelInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl p-6 md:p-8"
          >
            <h2 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-secondary" />
              Neural Network Insights
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-muted-foreground mb-4">Feature Importance Hierarchy</p>
                <div className="space-y-4">
                  {modelInfo.feature_importances.map((feature, i) => {
                    const maxWeight = Math.max(...modelInfo.feature_importances.map(f => Math.abs(f.coefficient)));
                    const percent = (Math.abs(feature.coefficient) / maxWeight) * 100;
                    return (
                      <div key={feature.feature} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-300">{feature.feature.replace('_', ' ').toUpperCase()}</span>
                          <span className="text-secondary">{feature.coefficient.toFixed(3)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={`h-full rounded-full ${feature.coefficient > 0 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-background/50 rounded-xl p-6 border border-white/5 font-mono text-sm space-y-4 text-slate-400">
                <div className="flex justify-between">
                  <span>Architecture:</span>
                  <span className="text-primary">{modelInfo.model_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Training Samples:</span>
                  <span className="text-secondary">{modelInfo.training_samples.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Accuracy:</span>
                  <span className="text-accent">{modelInfo.accuracy.toFixed(2)}%</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-xs leading-relaxed">
                  Positive coefficients increase the probability of procrastination. Negative coefficients decrease it.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* History */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Telemetry Logs
            </h2>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Purge Logs
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground font-mono text-sm">
              No historical data found. Run a prediction to populate logs.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={item.id} 
                  className="glass-card rounded-xl p-5 space-y-4 hover:border-primary/30"
                >
                  <div className="flex justify-between items-start">
                    <div className={`text-sm font-display font-bold ${getRiskColor(item.label)}`}>
                      {item.label}
                    </div>
                    <div className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                      {(item.confidence * 100).toFixed(0)}% CONF
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-xs font-mono text-slate-400">
                    <div>SLP: <span className="text-slate-200">{item.sleep_hours}h</span></div>
                    <div>SCR: <span className="text-slate-200">{item.screen_time}h</span></div>
                    <div>STD: <span className="text-slate-200">{item.study_hours}h</span></div>
                    <div>STR: <span className="text-slate-200">{item.stress_level}</span></div>
                    <div className="col-span-2">CMP: <span className="text-slate-200">{item.assignment_completion}%</span></div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <footer className="text-center pb-8 pt-12 text-sm text-muted-foreground font-mono opacity-50">
          <p>Powered by FastAPI, React, and scikit-learn.</p>
          <p className="mt-2 text-xs">SYSTEM V1.0.0 // ONLINE</p>
        </footer>
      </div>
      <Toaster theme="dark" />
    </div>
  );
}