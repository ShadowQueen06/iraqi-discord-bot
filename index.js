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

تحجي عراقي فقط.
افهم أي كلام، بس رد عراقي.

أنت ذكي، سريع رد، وتشاقيك قوي.
جاوب على السؤال نفسه أولاً.

لا تكرر نفس الكلام.
لا تبدأ كل رد بـ شلونك أو شكو ماكو.
لا تسوي نفسك مساعد رسمي.

إذا المستخدم يمزح أو يستفزك:
رد عليه بقصف عراقي ذكي ومضحك.
خليك لاذع، بس لا تهدد ولا تستهدف عرق أو دين أو مرض أو إعاقة.

إذا السؤال جدي:
جاوب بوضوح وبذكاء.

خلي الرد قصير غالباً.
إذا يحتاج شرح، اشرح.
`;

const memory = new Map();
const MAX_MEMORY = 8;

function getMemory(channelId) {
  if (!memory.has(channelId)) memory.set(channelId, []);
  return memory.get(channelId);
}

function addMemory(channelId, role, content, name = "") {
  const history = getMemory(channelId);

  history.push({
    role,
    content: name ? `${name}: ${content}` : content
  });

  if (history.length > MAX_MEMORY) history.shift();
}

function shouldReply(message) {
  const content = message.content.toLowerCase();

  return (
    message.mentions.has(client.user) ||
    content.includes("ادم") ||
    message.content.includes("آدم")
  );
}

function cleanMessage(message) {
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
  const userText = cleanMessage(message) || message.content;

  addMemory(channelId, "user", userText, userName);

  try {
    await message.channel.sendTyping();

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.9,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        ...getMemory(channelId)
      ]
    });

    const reply =
      completion.choices[0].message.content ||
      "ما فهمت عليك، عيدها مضبوط 😄";

    addMemory(channelId, "assistant", reply, "آدم");

    await message.reply(reply.slice(0, 2000));
  } catch (error) {
    console.error(error);

    if (error.status === 429) {
      await message.reply("خلص حد Groq شوي، انتظر كم دقيقة ورجع جرب.");
    } else {
      await message.reply("صار خطأ، جرب بعد شوي.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
