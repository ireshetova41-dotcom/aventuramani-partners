import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const { email, agentName, tourName, clientName } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = agentName || email.split("@")[0];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Авентурамания <partners@aventuramania.ru>",
        to: [email],
        subject: `Заявка принята — ${tourName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; background: #ffffff; border-radius: 12px;">
            <h2 style="color: #1A1A2E; margin-bottom: 16px;">Заявка принята, ${name}!</h2>
            <p style="color: #333; line-height: 1.7; font-size: 15px;">
              Ваша заявка на тур <strong>${tourName}</strong> для клиента <strong>${clientName}</strong> успешно принята.
            </p>
            <p style="color: #333; line-height: 1.7; font-size: 15px;">
              Мы уже взяли её в работу и очень оперативно подтвердим. Следите за статусом в личном кабинете.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="https://aventuramani-partners.lovable.app/dashboard"
                 style="display: inline-block; background: #D4AF37; color: #1A1A2E; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px;">
                Открыть личный кабинет
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">Авентурамания Partners</p>
          </div>
        `,
      }),
    });

    const resBody = await res.text();
    console.log("Resend response:", res.status, resBody);

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
