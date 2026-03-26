import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardEdit, Globe, Plane, CheckCircle, Coins, Mail, ArrowLeft } from "lucide-react";

const steps = [
  {
    icon: ClipboardEdit,
    emoji: "📝",
    title: "Регистрация",
    text: "Перейдите на сайт, нажмите «Зарегистрироваться». Введите email и придумайте пароль. После регистрации вы сразу попадаете в каталог туров.",
  },
  {
    icon: Globe,
    emoji: "🌍",
    title: "Каталог туров",
    text: "В каталоге — все актуальные туры. В карточке каждого тура сразу видна ваша комиссия. Выберите подходящий тур для клиента и нажмите «Забронировать».",
  },
  {
    icon: Plane,
    emoji: "✈️",
    title: "Заявка на бронирование",
    text: "Заполните форму: имя клиента, даты поездки, количество человек. Нажмите «Отправить заявку».",
  },
  {
    icon: CheckCircle,
    emoji: "✅",
    title: "Подтверждение",
    text: "Заявка мгновенно поступает менеджеру Aventuramania. Мы подтверждаем бронирование в течение рабочего дня.",
  },
  {
    icon: Coins,
    emoji: "💰",
    title: "Комиссия",
    text: "Ваша комиссия указана в карточке тура — вы видите её до отправки заявки. После подтверждения и оплаты клиентом комиссия выплачивается вам.",
  },
];

const Instructions = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
            <ArrowLeft size={16} />
            На главную
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight">
            Как начать работу с Aventuramania Partners
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Пошаговая инструкция для турагентов — от регистрации до первой заявки
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-6 flex gap-5 items-start"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                {step.emoji}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Шаг {i + 1}. {step.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Остались вопросы?</h2>
          <p className="text-muted-foreground text-sm">
            Напишите нам, и мы поможем разобраться
          </p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold h-11 px-6">
            <a href="mailto:agent@aventuramania.ru">
              <Mail size={18} className="mr-2" />
              Написать на email
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
