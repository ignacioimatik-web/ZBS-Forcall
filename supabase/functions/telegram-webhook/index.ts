import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const update = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify this is from our bot
    // Telegram sends the bot token as a basic auth username
    const authHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token') || '';

    const { message, channel_post, edited_message, edited_channel_post } = update;
    const post = channel_post || message;

    if (!post) {
      return new Response('No message', { status: 200 });
    }

    const chatId = post.chat?.id?.toString();
    const chatTitle = post.chat?.title || 'Unknown';
    const senderName = post.from?.first_name || post.from?.username || 'Unknown';
    const senderId = post.from?.id?.toString();
    const text = post.text || post.caption || '';
    const date = new Date(post.date * 1000).toISOString();

    if (!chatId) return new Response('No chat ID', { status: 200 });

    // Ensure the telegram chat is registered in our DB
    const { data: existingChat, error: lookupError } = await supabase
      .from('telegram_chats')
      .select('id, is_active')
      .eq('group_id', chatId)
      .single();

    // Auto-register if not exists (auto-join mode)
    if (!existingChat || lookupError) {
      const { error: insertError } = await supabase
        .from('telegram_chats')
        .upsert({
          group_id: chatId,
          group_name: chatTitle,
          created_by: '00000000-0000-0000-0000-000000000000',
          is_active: true,
        }, { onConflict: 'group_id' });

      if (insertError) {
        console.error('Auto-register chat failed:', insertError);
      }
    }

    // Forward message to Supabase chat_messages
    // Map sender_id to a profile if possible
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', senderId)
      .single();

    const senderNameFinal = profile?.full_name || senderName;

    // Insert into chat_messages as a telegram-originated message
    const { error: insertMsgError } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: 'telegram',
        text: text,
        sender_id: senderId || 'telegram',
        sender_name: senderNameFinal,
        additional_data: JSON.stringify({
          telegram_chat_id: chatId,
          telegram_chat_name: chatTitle,
          source: 'telegram',
        }),
      });

    if (insertMsgError) {
      console.error('Forward to chat failed:', insertMsgError);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
});