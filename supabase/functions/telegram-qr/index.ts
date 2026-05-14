import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_BOT_USERNAME = Deno.env.get('TELEGRAM_BOT_USERNAME') || 'ZBSforcabot';
const BASE_URL = Deno.env.get('BASE_URL') || 'https://zbs-forcall.vercel.app';

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique deep link code for this user
    const code = `zbs${userId.slice(0, 8)}`;

    // Create Telegram deep link via bot API
    const botUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createForumTopicInviteLink`;
    // Since we don't know the group yet, we provide a generic invite link approach
    // The actual QR will encode a URL that opens Telegram with a pre-filled message

    const telegramDeepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=ZBS${userId}`;

    // Alternative: generate a QR-compatible URL
    const qrUrl = `${BASE_URL}/api/telegram-callback?user_id=${userId}`;

    return new Response(JSON.stringify({
      success: true,
      deep_link: telegramDeepLink,
      qr_url: qrUrl,
      bot_username: TELEGRAM_BOT_USERNAME,
      instructions: 'Escanea el QR o abre el enlace con Telegram para vincular tu cuenta',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});