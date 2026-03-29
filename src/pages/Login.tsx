import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import ParticlesBackground from "@/components/ParticlesBackground";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [signupMode, setSignupMode] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [partnerForm, setPartnerForm] = useState({ name: "", email: "", phone: "", experience: "" });
  const [consentPD, setConsentPD] = useState(false);
  const [consentPolicy, setConsentPolicy] = useState(false);
  const [consentAds, setConsentAds] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Заполните все поля", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (signupMode) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: signupName, consent_ads: consentAds } },
      });
      setLoading(false);
      if (error) {
        toast({ title: "Ошибка регистрации", description: error.message, variant: "destructive" });
        return;
      }

      // Send welcome email (non-blocking)
      supabase.functions.invoke("send-welcome-email", {
        body: { email, name: signupName },
      }).catch((err) => console.error("Welcome email error:", err));

      toast({ title: "Регистрация успешна!", description: "Проверьте email — мы отправили приветственное письмо." });
      setSignupMode(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Ошибка входа", description: error.message, variant: "destructive" });
      return;
    }

    // Check if admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    navigate(isAdmin ? "/admin" : "/dashboard");
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.functions.invoke("send-partner-email", {
        body: partnerForm,
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || "Не удалось отправить письмо с подтверждением");
      }

      toast({
        title: "Заявка принята! 🎉",
        description: "Письмо с подтверждением отправлено на ваш email.",
        className: "bg-card border-2 border-primary text-foreground",
      });
      setPartnerOpen(false);
      setPartnerForm({ name: "", email: "", phone: "", experience: "" });
    } catch (err) {
      console.error("Email send error:", err);
      toast({
        title: "Не удалось отправить письмо",
        description: err instanceof Error ? err.message : "Попробуйте ещё раз или напишите на agent@aventuramania.ru",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      <ParticlesBackground />
      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary">AVENTURAMANIA</h1>
          <p className="text-muted-foreground text-sm">Партнёрская платформа для турагентов</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-2xl p-8 space-y-5 border border-border">
          {signupMode && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Имя</label>
              <Input
                placeholder="Ваше имя"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="bg-secondary border-border"
                required
              />
            </div>
          )}
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
          {signupMode && (
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consentPolicy"
                  checked={consentPolicy}
                  onCheckedChange={(v) => setConsentPolicy(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consentPolicy" className="text-xs text-muted-foreground leading-tight">
                  Ознакомлен(а) с{" "}
                  <a href="https://aventuramania.ru/politika" target="_blank" rel="noopener" className="text-primary underline underline-offset-2">
                    Политикой обработки персональных данных
                  </a>{" "}
                  <span className="text-destructive">*</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consentPD"
                  checked={consentPD}
                  onCheckedChange={(v) => setConsentPD(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consentPD" className="text-xs text-muted-foreground leading-tight">
                  Даю согласие на{" "}
                  <a href="https://aventuramania.ru/soglasie_opd" target="_blank" rel="noopener" className="text-primary underline underline-offset-2">
                    обработку персональных данных
                  </a>{" "}
                  <span className="text-destructive">*</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consentAds"
                  checked={consentAds}
                  onCheckedChange={(v) => setConsentAds(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consentAds" className="text-xs text-muted-foreground leading-tight">
                  Согласен на получение{" "}
                  <a href="https://aventuramania.ru/soglasie_rassilka" target="_blank" rel="noopener" className="text-primary underline underline-offset-2">
                    информационных и рекламных сообщений
                  </a>
                </label>
              </div>
            </div>
          )}
          <Button
            type="submit"
            disabled={loading || (signupMode && (!consentPD || !consentPolicy))}
            className="w-full bg-primary text-primary-foreground hover:bg-gold-glow font-semibold text-base h-12"
          >
            {loading ? "Загрузка..." : signupMode ? "Зарегистрироваться" : "Войти"}
          </Button>
          <button
            type="button"
            onClick={() => { setSignupMode(!signupMode); setConsentPD(false); setConsentAds(false); }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {signupMode ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
          </button>
        </form>

        <div className="text-center space-y-2">
          <button
            onClick={() => setPartnerOpen(true)}
            className="text-primary hover:text-gold-glow underline underline-offset-4 text-sm transition-colors"
          >
            Хочу стать партнёром
          </button>
          <div>
            <a
              href="/instructions"
              className="text-muted-foreground hover:text-primary underline underline-offset-4 text-xs transition-colors"
            >
              Инструкция для партнёров
            </a>
          </div>
        </div>
      </div>

      <Dialog open={partnerOpen} onOpenChange={setPartnerOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary text-xl">Заявка на партнёрство</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePartnerSubmit} className="space-y-4">
            <Input placeholder="Ваше имя" value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} className="bg-secondary border-border" required />
            <Input type="email" placeholder="Email" value={partnerForm.email} onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })} className="bg-secondary border-border" required />
            <Input placeholder="Телефон" value={partnerForm.phone} onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })} className="bg-secondary border-border" required />
            <Textarea placeholder="Опыт в туризме" value={partnerForm.experience} onChange={(e) => setPartnerForm({ ...partnerForm, experience: e.target.value })} className="bg-secondary border-border min-h-[80px]" />
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
