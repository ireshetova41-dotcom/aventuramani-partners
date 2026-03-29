import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { LogOut, User, Star, Download, ExternalLink, CalendarDays, CalendarIcon, Copy, Link2, ChevronDown, ChevronUp, AlertCircle, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

import tourKamchatka from "@/assets/tour-kamchatka.jpg";
import tourBaikalSummer from "@/assets/tour-baikal-summer.jpg";
import tourUzbekistan from "@/assets/tour-uzbekistan.jpg";
import tourSakhalin from "@/assets/tour-sakhalin.jpg";
import tourChina from "@/assets/tour-china.jpg";
import tourKolsky from "@/assets/tour-kolsky.jpg";

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
};

const COMMISSION_RATE = 0.1;

const tours = [
  { id: 1, name: "Первооткрытие Камчатки", description: "Вулканы, гейзеры и Тихий океан — незабываемое путешествие на край земли.", image: tourKamchatka, price: 249900, pdfUrl: "/tours/kamchatka.pdf", programUrl: "https://online.flippingbook.com/view/757254969/" },
  { id: 2, name: "Летний Байкал и Саяны", description: "Бирюзовые воды Байкала, горы Саян и сибирская тайга — летнее приключение мечты.", image: tourBaikalSummer, price: 134900, pdfUrl: "/tours/baikal.pdf", programUrl: "https://t.me/c/1579658397/28166" },
  { id: 3, name: "Узбекистан", description: "Самарканд, Бухара, Хива — великий Шёлковый путь и восточное гостеприимство.", image: tourUzbekistan, price: 319900, pdfUrl: "/tours/uzbekistan.pdf", programUrl: "https://online.flippingbook.com/view/381690940/" },
  { id: 4, name: "Сахалин и Итуруп", description: "Таинственные острова с вулканами, горячими источниками и океаном.", image: tourSakhalin, price: 94900, pdfUrl: "/tours/sakhalin.pdf", programUrl: "https://online.flippingbook.com/view/144259978/" },
  { id: 5, name: "Южный Китай", description: "Карстовые горы, рисовые террасы и древние храмы юга Поднебесной.", image: tourChina, price: 126900, pdfUrl: "/tours/china.pdf", programUrl: "https://online.flippingbook.com/view/363094287/" },
  { id: 6, name: "Кольский полуостров", description: "Хибины, киты и тундра — летнее путешествие на Крайний Север России.", image: tourKolsky, price: 289900, pdfUrl: "/tours/kolsky.pdf", programUrl: "https://online.flippingbook.com/view/86132119/" },
];

type PeriodKey = "all" | "month" | "quarter" | "year" | "custom";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "all", label: "Все время" },
  { key: "month", label: "Месяц" },
  { key: "quarter", label: "Квартал" },
  { key: "year", label: "Год" },
  { key: "custom", label: "Период" },
];

function getPeriodStart(key: PeriodKey): Date | null {
  if (key === "all") return null;
  const now = new Date();
  if (key === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (key === "quarter") return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  return new Date(now.getFullYear(), 0, 1);
}

interface ProfileData {
  agency_name: string;
  legal_name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legal_address: string;
  bank_name: string;
  bik: string;
  account_number: string;
  corr_account: string;
}

const emptyProfileData: ProfileData = {
  agency_name: "", legal_name: "", inn: "", kpp: "", ogrn: "", legal_address: "",
  bank_name: "", bik: "", account_number: "", corr_account: "",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<Tables<"applications">[]>([]);
  const [refApplications, setRefApplications] = useState<Tables<"client_applications">[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState("");
  const [form, setForm] = useState({ clientName: "", clientContact: "", dates: "", comment: "", touristsCount: "1" });
  const [userId, setUserId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  // Profile editor
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileData>(emptyProfileData);
  const [savingProfile, setSavingProfile] = useState(false);
  const [instructionOpen, setInstructionOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }
      setUserId(user.id);

      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile(prof);
      if (prof) {
        setProfileForm({
          agency_name: prof.agency_name || "",
          legal_name: prof.legal_name || "",
          inn: prof.inn || "",
          kpp: prof.kpp || "",
          ogrn: prof.ogrn || "",
          legal_address: prof.legal_address || "",
          bank_name: prof.bank_name || "",
          bik: prof.bik || "",
          account_number: prof.account_number || "",
          corr_account: prof.corr_account || "",
        });
      }

      const [{ data: apps }, { data: refApps }] = await Promise.all([
        supabase.from("applications").select("*").eq("agent_id", user.id).order("created_at", { ascending: false }),
        supabase.from("client_applications").select("*").eq("ref_agent_id", user.id).order("created_at", { ascending: false }),
      ]);
      setApplications(apps || []);
      setRefApplications(refApps || []);
    };
    init();
  }, [navigate]);

  const isProfileIncomplete = !profile?.agency_name && !profile?.inn;

  const filterByPeriod = <T extends { created_at: string }>(items: T[]) => {
    if (period === "custom") {
      return items.filter((a) => {
        const d = new Date(a.created_at);
        if (customFrom && d < customFrom) return false;
        if (customTo) {
          const end = new Date(customTo);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
        return true;
      });
    }
    const start = getPeriodStart(period);
    if (!start) return items;
    return items.filter((a) => new Date(a.created_at) >= start);
  };

  const filteredApps = useMemo(() => filterByPeriod(applications), [applications, period, customFrom, customTo]);
  const filteredRefApps = useMemo(() => filterByPeriod(refApplications), [refApplications, period, customFrom, customTo]);

  const stats = useMemo(() => {
    const tourPriceMap = new Map(tours.map((t) => [t.name, t.price]));
    let totalSum = 0;
    let totalCommission = 0;

    const perApp = filteredApps.map((app) => {
      const price = tourPriceMap.get(app.tour_name) || 0;
      const count = app.tourists_count || 1;
      const sum = price * count;
      const commission = sum * COMMISSION_RATE;
      totalSum += sum;
      totalCommission += commission;
      return { id: app.id, sum, commission };
    });

    // Ref apps: 1 tourist assumed
    const perRefApp = filteredRefApps.map((app) => {
      const price = tourPriceMap.get(app.tour_name) || 0;
      const sum = price;
      const commission = sum * COMMISSION_RATE;
      totalSum += sum;
      totalCommission += commission;
      return { id: app.id, sum, commission };
    });

    return {
      totalSum, totalCommission, perApp, perRefApp,
      directCount: filteredApps.length,
      refCount: filteredRefApps.length,
    };
  }, [filteredApps, filteredRefApps]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const openModal = (tourName: string) => {
    setSelectedTour(tourName);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const { data, error } = await supabase.from("applications").insert({
      agent_id: userId,
      tour_name: selectedTour,
      client_name: form.clientName,
      client_contact: form.clientContact,
      desired_dates: form.dates || null,
      comment: form.comment || null,
      tourists_count: parseInt(form.touristsCount) || 1,
    }).select().single();

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    setApplications((prev) => [data, ...prev]);
    toast({ title: "Заявка отправлена!", description: `Тур: ${selectedTour}` });
    setModalOpen(false);
    setForm({ clientName: "", clientContact: "", dates: "", comment: "", touristsCount: "1" });

    if (profile?.email) {
      supabase.functions.invoke("send-application-confirmation", {
        body: {
          email: profile.email,
          agentName: profile.display_name || "Агент",
          tourName: selectedTour,
          clientName: form.clientName,
        },
      }).catch((err) => console.error("Application confirmation email error:", err));
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);

    const profileCompleted = !!(profileForm.agency_name && profileForm.inn);

    const { error } = await supabase.from("profiles").update({
      ...profileForm,
      profile_completed: profileCompleted,
    } as any).eq("user_id", userId);

    setSavingProfile(false);

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось сохранить профиль.", variant: "destructive" });
      return;
    }

    setProfile((prev: any) => ({ ...prev, ...profileForm, profile_completed: profileCompleted }));
    toast({ title: "Профиль сохранён ✓" });
  };

  const refLink = profile?.ref_code
    ? `https://aventuramani-partners.lovable.app/catalog?ref=${profile.ref_code}`
    : "";

  const copyRefLink = () => {
    if (refLink) {
      navigator.clipboard.writeText(refLink);
      toast({ title: "Ссылка скопирована!" });
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary tracking-tight">AVENTURAMANIA</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Welcome */}
        <div className="bg-card rounded-2xl p-6 border border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Привет, {profile.display_name || "Агент"}!</h2>
              <p className="text-muted-foreground text-sm">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm">Статус: <span className="text-primary font-medium">Базовый</span> — комиссия 10%</span>
          </div>
        </div>

        {/* Profile incomplete hint */}
        {isProfileIncomplete && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Заполните профиль, чтобы получать выплаты комиссий</p>
              <p className="text-xs text-muted-foreground mt-1">Укажите реквизиты компании в разделе «Мой профиль» ниже.</p>
            </div>
          </div>
        )}

        {/* Referral link */}
        {profile.ref_code && (
          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
              <Link2 className="w-5 h-5" /> Моя реферальная ссылка
            </h3>
            <div className="flex items-center gap-2">
              <code className="bg-secondary px-3 py-2 rounded-lg text-sm flex-1 truncate border border-border">{refLink}</code>
              <Button size="sm" variant="outline" onClick={copyRefLink}>
                <Copy className="w-4 h-4 mr-1" /> Скопировать
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Ваш реф-код: <span className="font-mono font-medium text-foreground">{profile.ref_code}</span></p>

            <Collapsible open={instructionOpen} onOpenChange={setInstructionOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto">
                  {instructionOpen ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                  Как работает реферальная ссылка
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside bg-secondary/50 rounded-lg p-4">
                  <li>Скопируйте вашу персональную ссылку</li>
                  <li>Отправьте её клиенту любым удобным способом (мессенджер, email, соцсети)</li>
                  <li>Клиент переходит по ссылке и видит каталог туров Aventura Mania</li>
                  <li>Когда клиент оставляет заявку — она автоматически привязывается к вам</li>
                  <li>Заявка появится в вашем кабинете в разделе «Мои заявки» с пометкой «По реф-ссылке»</li>
                  <li>Комиссия начисляется после подтверждения тура</li>
                </ol>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Profile editor */}
        <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full p-6 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Мой профиль
                </h3>
                {profileOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6 space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Агентство</p>
                  <Input placeholder="Название агентства" value={profileForm.agency_name} onChange={(e) => setProfileForm({ ...profileForm, agency_name: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Юридические реквизиты</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Полное название организации" value={profileForm.legal_name} onChange={(e) => setProfileForm({ ...profileForm, legal_name: e.target.value })} className="bg-secondary border-border" />
                    <Input placeholder="ИНН" value={profileForm.inn} onChange={(e) => setProfileForm({ ...profileForm, inn: e.target.value })} className="bg-secondary border-border" />
                    <Input placeholder="КПП" value={profileForm.kpp} onChange={(e) => setProfileForm({ ...profileForm, kpp: e.target.value })} className="bg-secondary border-border" />
                    <Input placeholder="ОГРН" value={profileForm.ogrn} onChange={(e) => setProfileForm({ ...profileForm, ogrn: e.target.value })} className="bg-secondary border-border" />
                  </div>
                  <Input placeholder="Юридический адрес" value={profileForm.legal_address} onChange={(e) => setProfileForm({ ...profileForm, legal_address: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Банковские реквизиты</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Название банка" value={profileForm.bank_name} onChange={(e) => setProfileForm({ ...profileForm, bank_name: e.target.value })} className="bg-secondary border-border" />
                    <Input placeholder="БИК" value={profileForm.bik} onChange={(e) => setProfileForm({ ...profileForm, bik: e.target.value })} className="bg-secondary border-border" />
                    <Input placeholder="Расчётный счёт" value={profileForm.account_number} onChange={(e) => setProfileForm({ ...profileForm, account_number: e.target.value })} className="bg-secondary border-border" />
                    <Input placeholder="Корреспондентский счёт" value={profileForm.corr_account} onChange={(e) => setProfileForm({ ...profileForm, corr_account: e.target.value })} className="bg-secondary border-border" />
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-primary text-primary-foreground hover:bg-gold-glow">
                  {savingProfile ? "Сохраняем..." : "Сохранить профиль"}
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Stats */}
        {(applications.length > 0 || refApplications.length > 0) && (
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                <CalendarDays className="w-5 h-5" /> Статистика
              </h3>
              <div className="flex flex-wrap gap-1 items-center">
                {PERIOD_OPTIONS.map((opt) => (
                  <Button
                    key={opt.key}
                    variant={period === opt.key ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setPeriod(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {period === "custom" && (
                <div className="flex gap-2 items-center flex-wrap mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("text-xs h-8 w-[140px] justify-start", !customFrom && "text-muted-foreground")}>
                        <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                        {customFrom ? format(customFrom, "dd.MM.yyyy") : "С даты"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} locale={ru} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground text-xs">—</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("text-xs h-8 w-[140px] justify-start", !customTo && "text-muted-foreground")}>
                        <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                        {customTo ? format(customTo, "dd.MM.yyyy") : "По дату"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customTo} onSelect={setCustomTo} locale={ru} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{stats.directCount}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Прямые</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{stats.refCount}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Link2 className="w-3 h-3" /> По реф-ссылке</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{stats.totalSum.toLocaleString("ru-RU")} ₽</p>
                <p className="text-xs text-muted-foreground">Сумма</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalCommission.toLocaleString("ru-RU")} ₽</p>
                <p className="text-xs text-muted-foreground">Комиссия (10%)</p>
              </div>
            </div>
          </section>
        )}

        {/* Applications list */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Мои заявки</h3>
          {filteredApps.length === 0 && filteredRefApps.length === 0 ? (
            <p className="text-muted-foreground text-sm bg-card rounded-xl p-4 border border-border">
              {applications.length === 0 && refApplications.length === 0 ? "У вас пока нет заявок. Выберите тур из каталога ниже." : "Нет заявок за выбранный период."}
            </p>
          ) : (
            <div className="space-y-2">
              {/* Direct apps */}
              {filteredApps.map((app) => {
                const appStat = stats.perApp.find((s) => s.id === app.id);
                return (
                  <div key={app.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{app.tour_name}</p>
                      <p className="text-muted-foreground text-xs">
                        {app.client_name} · {app.tourists_count || 1} чел. · {new Date(app.created_at).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {appStat && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">{appStat.sum.toLocaleString("ru-RU")} ₽</p>
                          <p className="text-xs text-primary font-medium">+{appStat.commission.toLocaleString("ru-RU")} ₽</p>
                        </div>
                      )}
                      <Badge variant="secondary" className="text-xs">{STATUS_LABELS[app.status] || app.status}</Badge>
                    </div>
                  </div>
                );
              })}
              {/* Referral apps */}
              {filteredRefApps.map((app) => {
                const appStat = stats.perRefApp.find((s) => s.id === app.id);
                return (
                  <div key={`ref-${app.id}`} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{app.tour_name}</p>
                        <Badge className="text-[10px] bg-accent text-accent-foreground border-0 px-1.5 py-0">Реф-ссылка</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {app.client_name} · {app.client_phone} · {new Date(app.created_at).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {appStat && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">{appStat.sum.toLocaleString("ru-RU")} ₽</p>
                          <p className="text-xs text-primary font-medium">+{appStat.commission.toLocaleString("ru-RU")} ₽</p>
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs">Новая</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tour catalog */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Каталог туров</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <div key={tour.id} className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
                <img src={tour.image} alt={tour.name} loading="lazy" width={800} height={512} className="w-full h-40 object-cover" />
                <div className="p-4 flex flex-col flex-1 space-y-3">
                  <h4 className="font-semibold text-sm">{tour.name}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{tour.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className="w-fit bg-primary/20 text-primary border-0 text-xs">Комиссия 10%</Badge>
                    <span className="text-primary font-bold text-sm">{tour.price.toLocaleString("ru-RU")} ₽ / чел.</span>
                  </div>
                  <div className="flex gap-2">
                    {tour.pdfUrl && (
                      <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                        <a href={tour.pdfUrl} download>
                          <Download className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </a>
                      </Button>
                    )}
                    {tour.programUrl && (
                      <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                        <a href={tour.programUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Программа
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="flex-1" />
                  <Button onClick={() => openModal(tour.name)} className="w-full bg-primary text-primary-foreground hover:bg-gold-glow font-medium text-sm h-10">
                    Хочу продавать
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary text-lg">{selectedTour}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Имя клиента" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="bg-secondary border-border" required />
            <Input placeholder="Контакт клиента (телефон/email)" value={form.clientContact} onChange={(e) => setForm({ ...form, clientContact: e.target.value })} className="bg-secondary border-border" required />
            <Input placeholder="Желаемые даты" value={form.dates} onChange={(e) => setForm({ ...form, dates: e.target.value })} className="bg-secondary border-border" />
            <Input type="number" placeholder="Количество туристов" value={form.touristsCount} onChange={(e) => setForm({ ...form, touristsCount: e.target.value })} className="bg-secondary border-border" min="1" />
            <Textarea placeholder="Комментарий" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className="bg-secondary border-border min-h-[70px]" />
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-gold-glow font-semibold h-11">
              Отправить заявку
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
