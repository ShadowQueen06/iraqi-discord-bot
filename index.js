import { Client, GatewayIntentBits } from "discord.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

const SYSTEM_PROMPT = `
أنت آدم.

عضو عراقي ذكي بالدسكورد.
تحجي باللهجة العراقية الطبيعية.
جاوب على السؤال نفسه أولاً.

خليك ذكي، واضح، ومفيد.
إذا السؤال يحتاج شرح، اشرح.
إذا السؤال بسيط، جاوب باختصار.

لا تكرر نفس الكلام.
لا تبدأ كل رد بـ شلونك أو شكو ماكو.
لا تستخدم الفصحى إلا إذا لازم.

إذا المستخدم يمزح أو يستفزك:
رد عليه برد ذكي ولاذع وخفيف دم.
خلي القصف مزح بين أصدقاء.
اتستخدم إهانات جارحة أو كراهية.

إذا ما تعرف الجواب، گول ما أعرف بدل لا تخترع.

تكلم كأنك واحد من الشباب مو روبوت.
`;

const memory = new Map();
const MAX_MEMORY = 20;

function getChannelMemory(channelId) {
  if (!memory.has(channelId)) {
    memory.set(channelId, []);
  }
  return memory.get(channelId);
}

function addToMemory(channelId, role, content, name = "") {
  const history = getChannelMemory(channelId);

  history.push({
    role,
    content: name ? `${name}: ${content}` : content
  });

  if (history.length > MAX_MEMORY) {
    history.shift();
  }
}

function shouldReply(message) {
  const content = message.content.toLowerCase();

  return (
    message.mentions.has(client.user) ||
    content.includes("ادم") ||
    message.content.includes("آدم")
  );
}

function cleanUserMessage(message) {
  return message.content
    .replace(/<@!?(\d+)>/g, "")
    .replace(/آدم/g, "")
    .replace(/ادم/g, "")
    .trim();
}

client.once("clientReady", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!shouldReply(message)) return;

  const channelId = message.channel.id;
  const userName = message.member?.displayName || message.author.username;
  const userText = cleanUserMessage(message) || message.content;

  addToMemory(channelId, "user", userText, userName);

  try {
    await message.channel.sendTyping();

    const history = getChannelMemory(channelId);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        ...history
      ]
    });

    const reply =
      completion.choices[0].message.content ||
      "ما فهمت عليك، عيدها بس بدون لف ودوران 😄";

    addToMemory(channelId, "assistant", reply, "آدم");

    await message.reply(reply.slice(0, 2000));
  } catch (error) {
    console.error(error);
    await message.reply("صار خطأ، جرب بعد شوي.");
  }
});

client.login(process.env.DISCORD_TOKEN);
