import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { LogOut, ShieldCheck, FileText, Clock, CheckCircle, XCircle, Users } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Application = Tables<"applications"> & { agent_name?: string };

type ClientApplication = {
  id: string;
  tour_name: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  comment: string | null;
  ref_agent_id: string | null;
  created_at: string;
  agent_name?: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const TOUR_NAMES = [
  "Первооткрытие Камчатки",
  "Летний Байкал и Саяны",
  "Узбекистан",
  "Сахалин и Итуруп",
  "Южный Китай",
  "Кольский полуостров",
];

const Admin = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [clientApps, setClientApps] = useState<ClientApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTour, setFilterTour] = useState<string>("all");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/"); return; }
    const { data: hasRole } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!hasRole) {
      toast({ title: "Доступ запрещён", description: "У вас нет прав администратора", variant: "destructive" });
      navigate("/dashboard");
      return;
    }
    fetchAll();
  };

  const fetchAll = async () => {
    setLoading(true);
    const [appsRes, clientRes] = await Promise.all([
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase.from("client_applications").select("*").order("created_at", { ascending: false }),
    ]);

    // Collect all agent IDs from both tables
    const agentIds = new Set<string>();
    (appsRes.data || []).forEach((a) => agentIds.add(a.agent_id));
    (clientRes.data || []).forEach((a: any) => { if (a.ref_agent_id) agentIds.add(a.ref_agent_id); });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", [...agentIds]);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p.display_name || p.email || "Неизвестный"])
    );

    setApplications(
      (appsRes.data || []).map((a) => ({ ...a, agent_name: profileMap.get(a.agent_id) || "Неизвестный" }))
    );
    setClientApps(
      (clientRes.data || []).map((a: any) => ({
        ...a,
        agent_name: a.ref_agent_id ? profileMap.get(a.ref_agent_id) || "Неизвестный" : undefined,
      }))
    );
    setLoading(false);
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase.from("applications").update({ status: newStatus as any }).eq("id", appId);
    if (error) { toast({ title: "Ошибка обновления", variant: "destructive" }); return; }
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus as any } : a)));
    toast({ title: "Статус обновлён" });
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const filtered = applications.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterTour !== "all" && a.tour_name !== filterTour) return false;
    return true;
  });

  const counts = {
    total: applications.length,
    new: applications.filter((a) => a.status === "new").length,
    in_progress: applications.filter((a) => a.status === "in_progress").length,
    confirmed: applications.filter((a) => a.status === "confirmed").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-primary tracking-tight">AVENTURAMANIA</h1>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              <ShieldCheck className="w-3 h-3 mr-1" /> Админ
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Выйти
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Всего заявок", value: counts.total, icon: FileText, color: "text-foreground" },
            { label: "Новых", value: counts.new, icon: Clock, color: "text-blue-400" },
            { label: "В работе", value: counts.in_progress, icon: Clock, color: "text-yellow-400" },
            { label: "Подтверждённых", value: counts.confirmed, icon: CheckCircle, color: "text-green-400" },
          ].map((c) => (
            <div key={c.label} className="bg-card rounded-2xl border border-border p-5 space-y-2">
              <div className="flex items-center gap-2">
                <c.icon className={`w-4 h-4 ${c.color}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="agent" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="agent" className="text-sm">
              <FileText className="w-4 h-4 mr-1.5" /> Заявки агентов ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="client" className="text-sm">
              <Users className="w-4 h-4 mr-1.5" /> Заявки клиентов ({clientApps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agent" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48 bg-card border-border"><SelectValue placeholder="Статус" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="new">Новая</SelectItem>
                  <SelectItem value="in_progress">В работе</SelectItem>
                  <SelectItem value="confirmed">Подтверждена</SelectItem>
                  <SelectItem value="cancelled">Отменена</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTour} onValueChange={setFilterTour}>
                <SelectTrigger className="w-full sm:w-56 bg-card border-border"><SelectValue placeholder="Тур" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Все туры</SelectItem>
                  {TOUR_NAMES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <p className="text-muted-foreground text-center py-12">Загрузка...</p>
            ) : filtered.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Заявок не найдено</p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Агент</TableHead>
                      <TableHead className="text-muted-foreground">Тур</TableHead>
                      <TableHead className="text-muted-foreground">Клиент</TableHead>
                      <TableHead className="text-muted-foreground">Туристов</TableHead>
                      <TableHead className="text-muted-foreground">Дата</TableHead>
                      <TableHead className="text-muted-foreground">Статус</TableHead>
                      <TableHead className="text-muted-foreground">Действие</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((app) => (
                      <TableRow key={app.id} className="border-border">
                        <TableCell className="font-medium text-sm">{app.agent_name}</TableCell>
                        <TableCell className="text-sm">{app.tour_name}</TableCell>
                        <TableCell className="text-sm">
                          <div>{app.client_name}</div>
                          <div className="text-xs text-muted-foreground">{app.client_contact}</div>
                        </TableCell>
                        <TableCell className="text-sm">{app.tourists_count || 1}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString("ru-RU")}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border ${STATUS_COLORS[app.status]}`}>{STATUS_LABELS[app.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select value={app.status} onValueChange={(v) => updateStatus(app.id, v)}>
                            <SelectTrigger className="w-36 h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="new">Новая</SelectItem>
                              <SelectItem value="in_progress">В работе</SelectItem>
                              <SelectItem value="confirmed">Подтверждена</SelectItem>
                              <SelectItem value="cancelled">Отменена</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="client" className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-center py-12">Загрузка...</p>
            ) : clientApps.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Клиентских заявок пока нет</p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Тур</TableHead>
                      <TableHead className="text-muted-foreground">Клиент</TableHead>
                      <TableHead className="text-muted-foreground">Телефон</TableHead>
                      <TableHead className="text-muted-foreground">Email</TableHead>
                      <TableHead className="text-muted-foreground">Комментарий</TableHead>
                      <TableHead className="text-muted-foreground">Реферал (агент)</TableHead>
                      <TableHead className="text-muted-foreground">Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientApps.map((app) => (
                      <TableRow key={app.id} className="border-border">
                        <TableCell className="text-sm font-medium">{app.tour_name}</TableCell>
                        <TableCell className="text-sm">{app.client_name}</TableCell>
                        <TableCell className="text-sm">{app.client_phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{app.client_email || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{app.comment || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {app.agent_name ? (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{app.agent_name}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Прямой</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString("ru-RU")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
