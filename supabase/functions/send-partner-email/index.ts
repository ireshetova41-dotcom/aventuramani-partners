import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { name, email, phone, experience } = await req.json();

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Email to the agent
    const agentEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Aventuramania Partners <partners@aventuramania.ru>",
        to: [email],
        subject: "Ваша заявка принята",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; background: #ffffff; border-radius: 12px;">
            <h2 style="color: #1A1A2E; margin-bottom: 16px;">Здравствуйте, ${name}!</h2>
            <p style="color: #333; line-height: 1.6;">
              Ваша заявка получена. Мы свяжемся с вами в ближайшее время.
            </p>
            <p style="color: #333; line-height: 1.6;">
              С уважением, команда <strong>Aventuramania</strong>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">Aventuramania Partners</p>
          </div>
        `,
      }),
    });

    if (!agentEmailRes.ok) {
      const err = await agentEmailRes.text();
      console.error("Failed to send agent email:", err);
      return new Response(
        JSON.stringify({ error: "Не удалось отправить письмо с подтверждением", details: err }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Email to admin
    const adminEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Aventuramania Partners <partners@aventuramania.ru>",
        to: ["agent@aventuramania.ru"],
        subject: "Новая заявка агента",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; background: #ffffff; border-radius: 12px;">
            <h2 style="color: #1A1A2E; margin-bottom: 16px;">Новая заявка на партнёрство</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">Имя:</td><td style="padding: 8px 0; color: #333; font-weight: bold;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0; color: #333; font-weight: bold;">${email}</td></tr>
              ${phone ? `<tr><td style="padding: 8px 0; color: #666;">Телефон:</td><td style="padding: 8px 0; color: #333; font-weight: bold;">${phone}</td></tr>` : ""}
              ${experience ? `<tr><td style="padding: 8px 0; color: #666;">Опыт:</td><td style="padding: 8px 0; color: #333;">${experience}</td></tr>` : ""}
            </table>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">Aventuramania Partners — автоматическое уведомление</p>
          </div>
        `,
      }),
    });

    if (!adminEmailRes.ok) {
      const err = await adminEmailRes.text();
      console.error("Failed to send admin email:", err);
      return new Response(
        JSON.stringify({ error: "Письмо агенту отправлено, но уведомление администратору не ушло", details: err }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-partner-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
