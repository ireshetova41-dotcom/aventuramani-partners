import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { LogOut, User, Star } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

import tourKamchatka from "@/assets/tour-kamchatka.jpg";
import tourBaikal from "@/assets/tour-baikal.jpg";
import tourAltai from "@/assets/tour-altai.jpg";
import tourSakhalin from "@/assets/tour-sakhalin.jpg";
import tourChina from "@/assets/tour-china.jpg";

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
};

const tours = [
  { id: 1, name: "Первооткрытие Камчатки", description: "Вулканы, гейзеры и Тихий океан — незабываемое путешествие на край земли.", image: tourKamchatka },
  { id: 2, name: "Все грани Байкала", description: "Глубочайшее озеро планеты: лёд, тайга и сибирское гостеприимство.", image: tourBaikal },
  { id: 3, name: "Путешествие на Алтай", description: "Горные перевалы, бирюзовые реки и дикая природа Горного Алтая.", image: tourAltai },
  { id: 4, name: "Сахалин и Итуруп", description: "Таинственные острова с вулканами, горячими источниками и океаном.", image: tourSakhalin },
  { id: 5, name: "Южный Китай", description: "Карстовые горы, рисовые террасы и древние храмы юга Поднебесной.", image: tourChina },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [applications, setApplications] = useState<Tables<"applications">[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState("");
  const [form, setForm] = useState({ clientName: "", clientContact: "", dates: "", comment: "", touristsCount: "1" });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }
      setUserId(user.id);

      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile(prof);

      const { data: apps } = await supabase.from("applications").select("*").eq("agent_id", user.id).order("created_at", { ascending: false });
      setApplications(apps || []);
    };
    init();
  }, [navigate]);

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

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Мои заявки</h3>
          {applications.length === 0 ? (
            <p className="text-muted-foreground text-sm bg-card rounded-xl p-4 border border-border">
              У вас пока нет заявок. Выберите тур из каталога ниже.
            </p>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => (
                <div key={app.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{app.tour_name}</p>
                    <p className="text-muted-foreground text-xs">
                      Клиент: {app.client_name} · {new Date(app.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{STATUS_LABELS[app.status] || app.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Каталог туров</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <div key={tour.id} className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
                <img src={tour.image} alt={tour.name} loading="lazy" width={800} height={512} className="w-full h-40 object-cover" />
                <div className="p-4 flex flex-col flex-1 space-y-3">
                  <h4 className="font-semibold text-sm">{tour.name}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{tour.description}</p>
                  <Badge className="w-fit bg-primary/20 text-primary border-0 text-xs">Комиссия 10%</Badge>
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
