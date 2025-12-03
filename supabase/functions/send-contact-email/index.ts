import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  category: string;
  message: string;
}

const categoryLabels: Record<string, string> = {
  technical: "Teknik Destek",
  billing: "Ödeme ve Fatura",
  feature: "Özellik Önerisi",
  bug: "Hata Bildirimi",
  account: "Hesap Sorunları",
  other: "Diğer",
};

// HTML escape function to prevent injection
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, category, message }: ContactRequest = await req.json();

    // Validate inputs
    if (!name || !email || !category || !message) {
      throw new Error("Tüm alanlar zorunludur");
    }

    if (name.length > 100) {
      throw new Error("Ad soyad çok uzun");
    }

    if (email.length > 255 || !email.includes("@")) {
      throw new Error("Geçersiz e-posta adresi");
    }

    if (message.length > 2000) {
      throw new Error("Mesaj çok uzun");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store contact message in database for tracking
    const { error: dbError } = await supabase.from("contact_messages").insert({
      name,
      email,
      category,
      message,
      status: "pending",
    });

    if (dbError) {
      console.error("Database error:", dbError);
      // Continue even if DB insert fails - we still want to try sending the email
    }

    // Sanitize user inputs to prevent HTML injection
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);
    const safeCategory = escapeHtml(categoryLabels[category] || category);

    // Try to send email via Resend if API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      // Use fetch to call Resend API directly
      const supportEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Stellara <onboarding@resend.dev>",
          to: ["destek@stellara.app"],
          subject: `[${safeCategory}] Yeni İletişim Formu - ${safeName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B5CF6;">Yeni İletişim Formu Mesajı</h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Ad Soyad:</strong> ${safeName}</p>
                <p><strong>E-posta:</strong> ${safeEmail}</p>
                <p><strong>Kategori:</strong> ${safeCategory}</p>
                <p><strong>Mesaj:</strong></p>
                <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 4px;">${safeMessage}</p>
              </div>
              <p style="color: #666; font-size: 12px;">Bu mesaj Stellara iletişim formundan gönderilmiştir.</p>
            </div>
          `,
        }),
      });

      if (!supportEmailResponse.ok) {
        console.error("Failed to send support email:", await supportEmailResponse.text());
      }

      // Send confirmation email to user
      const userEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Stellara <onboarding@resend.dev>",
          to: [email],
          subject: "Mesajınız Alındı - Stellara",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B5CF6;">Merhaba ${safeName},</h2>
              <p>Mesajınız başarıyla alınmıştır. En kısa sürede size geri dönüş yapacağız.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Kategori:</strong> ${safeCategory}</p>
                <p><strong>Mesajınız:</strong></p>
                <p style="white-space: pre-wrap;">${safeMessage}</p>
              </div>
              <p>Teşekkürler,<br>Stellara Ekibi</p>
            </div>
          `,
        }),
      });

      if (!userEmailResponse.ok) {
        console.error("Failed to send user confirmation email:", await userEmailResponse.text());
      }

      console.log("Emails sent successfully");
    } else {
      console.log("RESEND_API_KEY not configured, message saved to database only");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Mesajınız başarıyla gönderildi" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Mesaj gönderilemedi" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
