import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { text, sender_name, user_id, image_url, audio_url } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const { error: authError } = await supabase.auth.admin.getUserById(user_id);
    if (authError) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all active linked telegram chats
    const { data: chats, error: chatsError } = await supabase
      .from('telegram_chats')
      .select('group_id')
      .eq('is_active', true);

    if (chatsError) {
      return new Response(JSON.stringify({ error: chatsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Forward message to each linked Telegram group
    const results = await Promise.allSettled(
      (chats || []).map(async (chat) => {
        if (audio_url) {
          const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAudio`;
          const body: Record<string, unknown> = {
            chat_id: chat.group_id,
            voice: audio_url,
            caption: `💬 *${sender_name || 'Equipo'}:*`,
            parse_mode: 'Markdown',
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const err = await response.text();
            console.error(`Telegram sendAudio failed for chat ${chat.group_id}:`, err);
            throw new Error(`Failed for chat ${chat.group_id}`);
          }

          return response.json();
        } else if (image_url) {
          const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
          const body: Record<string, unknown> = {
            chat_id: chat.group_id,
            photo: image_url,
            caption: `💬 *${sender_name || 'Equipo'}:*\n${text || ''}`,
            parse_mode: 'Markdown',
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const err = await response.text();
            console.error(`Telegram sendPhoto failed for chat ${chat.group_id}:`, err);
            throw new Error(`Failed for chat ${chat.group_id}`);
          }

          return response.json();
        } else {
          const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
          const body: Record<string, unknown> = {
            chat_id: chat.group_id,
            text: `💬 *${sender_name || 'Equipo'}:*\n${text || ''}`,
            parse_mode: 'Markdown',
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const err = await response.text();
            console.error(`Telegram sendMessage failed for chat ${chat.group_id}:`, err);
            throw new Error(`Failed for chat ${chat.group_id}`);
          }

          return response.json();
        }
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failCount = results.filter((r) => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({
        success: true,
        forwarded_to: successCount,
        failures: failCount,
        total_chats: chats?.length || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Telegram forward error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
