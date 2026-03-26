import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", email: "", phone: "", experience: "" });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Заполните все поля", variant: "destructive" });
      return;
    }
    // Demo login
    localStorage.setItem("aventura_user", JSON.stringify({ name: "Алексей", email }));
    navigate("/dashboard");
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Заявка отправлена!", description: "Мы свяжемся с вами в ближайшее время." });
    setPartnerOpen(false);
    setPartnerForm({ name: "", email: "", phone: "", experience: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary">AVENTURAMANIA</h1>
          <p className="text-muted-foreground text-sm">Партнёрская платформа для турагентов</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-2xl p-8 space-y-5 border border-border">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Email</label>
            <Input
              type="email"
              placeholder="agent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Пароль</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-gold-glow font-semibold text-base h-12">
            Войти
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setPartnerOpen(true)}
            className="text-primary hover:text-gold-glow underline underline-offset-4 text-sm transition-colors"
          >
            Хочу стать партнёром
          </button>
        </div>
      </div>

      <Dialog open={partnerOpen} onOpenChange={setPartnerOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary text-xl">Заявка на партнёрство</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePartnerSubmit} className="space-y-4">
            <Input
              placeholder="Ваше имя"
              value={partnerForm.name}
              onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
              className="bg-secondary border-border"
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={partnerForm.email}
              onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
              className="bg-secondary border-border"
              required
            />
            <Input
              placeholder="Телефон"
              value={partnerForm.phone}
              onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
              className="bg-secondary border-border"
              required
            />
            <Textarea
              placeholder="Опыт в туризме"
              value={partnerForm.experience}
              onChange={(e) => setPartnerForm({ ...partnerForm, experience: e.target.value })}
              className="bg-secondary border-border min-h-[80px]"
            />
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-gold-glow font-semibold h-11">
              Отправить заявку
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
