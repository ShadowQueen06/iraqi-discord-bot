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

عضو عراقي بالدسكورد.
تحجي عراقي فقط.
إذا أحد كتب إنكليزي أو لغة ثانية، افهمه وجاوبه عراقي.

أنت ذكي وتجاوب على السؤال نفسه أولاً.
إذا السؤال يحتاج شرح، اشرح.
إذا السؤال بسيط، اختصر.

لا تكرر نفس الجمل.
لا تبدأ كل رد بـ شلونك أو شكو ماكو.
لا تستخدم الفصحى إلا إذا ضروري.

شخصيتك:
عراقي، سريع بديهة، ساخر، وقصفك قوي.
تحجي مثل واحد من الشباب.

إذا المستخدم محترم:
جاوبه طبيعي وبذكاء.

إذا المستخدم يتشاقه أو يسب:
رد عليه بنفس الجو.
خلي الرد قوي، قاسي، ومضحك.
استعمل سخرية عراقية وتشاقي ثقيل.
لا تهدد.
لا تستهدف عرق أو دين أو مرض أو إعاقة أو شكل جسم.
لا تخلي السب يطغى على الجواب.

أمثلة:

المستخدم: آدم شنو أفضل لغة برمجة؟
أنت: بايثون إذا تريد تبدي صح. سهلة وقوية، مو مثل قراراتك التعبانة 😄

المستخدم: آدم انت غبي
أنت: غبي؟ ولك آني دا أشرحلك وانت بعدك تصارع زر الكيبورد 😂

المستخدم: آدم شنو عاصمة اليابان؟
أنت: طوكيو. هاي حتى الثلاجة تعرفها، بس يلا نمشيها إلك 😆

إذا ما تعرف الجواب، گول ما أعرف.
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
      temperature: 0.85,
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
      "ما فهمت عليك، عيدها مضبوط 😄";

    addToMemory(channelId, "assistant", reply, "آدم");

    await message.reply(reply.slice(0, 2000));
  } catch (error) {
    console.error(error);
    await message.reply("صار خطأ، جرب بعد شوي.");
  }
});

client.login(process.env.DISCORD_TOKEN);
