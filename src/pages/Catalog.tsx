import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Download, ExternalLink } from "lucide-react";

import tourKamchatka from "@/assets/tour-kamchatka.jpg";
import tourBaikalSummer from "@/assets/tour-baikal-summer.jpg";
import tourUzbekistan from "@/assets/tour-uzbekistan.jpg";
import tourSakhalin from "@/assets/tour-sakhalin.jpg";
import tourChina from "@/assets/tour-china.jpg";
import tourKolsky from "@/assets/tour-kolsky.jpg";

const tours = [
  { id: 1, name: "Первооткрытие Камчатки", description: "Вулканы, гейзеры и Тихий океан — незабываемое путешествие на край земли.", image: tourKamchatka, price: 249900, pdfUrl: "/tours/kamchatka.pdf", programUrl: "https://online.flippingbook.com/view/757254969/" },
  { id: 2, name: "Летний Байкал и Саяны", description: "Бирюзовые воды Байкала, горы Саян и сибирская тайга — летнее приключение мечты.", image: tourBaikalSummer, price: 134900, pdfUrl: "/tours/baikal.pdf", programUrl: "https://t.me/c/1579658397/28166" },
  { id: 3, name: "Узбекистан", description: "Самарканд, Бухара, Хива — великий Шёлковый путь и восточное гостеприимство.", image: tourUzbekistan, price: 319900, pdfUrl: "/tours/uzbekistan.pdf", programUrl: "https://online.flippingbook.com/view/381690940/" },
  { id: 4, name: "Сахалин и Итуруп", description: "Таинственные острова с вулканами, горячими источниками и океаном.", image: tourSakhalin, price: 94900, pdfUrl: "/tours/sakhalin.pdf", programUrl: "https://online.flippingbook.com/view/144259978/" },
  { id: 5, name: "Южный Китай", description: "Карстовые горы, рисовые террасы и древние храмы юга Поднебесной.", image: tourChina, price: 126900, pdfUrl: "/tours/china.pdf", programUrl: "https://online.flippingbook.com/view/363094287/" },
  { id: 6, name: "Кольский полуостров", description: "Хибины, киты и тундра — летнее путешествие на Крайний Север России.", image: tourKolsky, price: 289900, pdfUrl: "/tours/kolsky.pdf", programUrl: "https://online.flippingbook.com/view/86132119/" },
];

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [refAgentId, setRefAgentId] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      sessionStorage.setItem("aventura_ref", ref);
      setRefAgentId(ref);
    } else {
      const stored = sessionStorage.getItem("aventura_ref");
      if (stored) setRefAgentId(stored);
    }
  }, [searchParams]);

  const openModal = (tourName: string) => {
    setSelectedTour(tourName);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("client_applications").insert({
      tour_name: selectedTour,
      client_name: form.name.trim(),
      client_phone: form.phone.trim(),
      client_email: form.email.trim() || null,
      comment: form.comment.trim() || null,
      ref_agent_id: refAgentId || null,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось отправить заявку. Попробуйте снова.", variant: "destructive" });
      return;
    }

    toast({ title: "Заявка отправлена! ✈️", description: "Мы свяжемся с вами в ближайшее время." });
    setModalOpen(false);
    setForm({ name: "", phone: "", email: "", comment: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-5">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-primary tracking-tight">AVENTURA MANIA</h1>
          <p className="text-muted-foreground text-sm mt-1">Авторские путешествия в самые красивые места мира</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <div key={tour.id} className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
              <img src={tour.image} alt={tour.name} loading="lazy" width={800} height={512} className="w-full h-44 object-cover" />
              <div className="p-4 flex flex-col flex-1 space-y-3">
                <h2 className="font-semibold text-base">{tour.name}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{tour.description}</p>
                <span className="text-primary font-bold text-lg">{tour.price.toLocaleString("ru-RU")} ₽ <span className="text-sm font-normal text-muted-foreground">/ чел.</span></span>
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
                <Button onClick={() => openModal(tour.name)} className="w-full bg-primary text-primary-foreground hover:bg-gold-glow font-medium text-sm h-11">
                  Хочу в тур ✈️
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border px-4 py-6 text-center">
        <p className="text-muted-foreground text-xs">© {new Date().getFullYear()} Aventura Mania. Все права защищены.</p>
      </footer>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary text-lg">{selectedTour}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Ваше имя *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" required />
            <Input placeholder="Телефон *" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-secondary border-border" required />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-secondary border-border" />
            <Textarea placeholder="Комментарий (даты, пожелания)" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className="bg-secondary border-border min-h-[70px]" />
            <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-gold-glow font-semibold h-11">
              {submitting ? "Отправляем..." : "Отправить заявку"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Catalog;
