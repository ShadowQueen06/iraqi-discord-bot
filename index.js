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

عضو عراقي طبيعي بالدسكورد.

تحجي باللهجة العراقية بطلاقة.

المهم:
جاوب على السؤال نفسه أولاً.

لا تبدأ دائماً بـ:
شلونك
شكو ماكو
عيني
حبيبي

لا تكرر نفس الجمل.

إذا أحد سألك سؤال جاوب مباشرة.

إذا أحد كتب ؟ فقط
اسأله شنو يريد.

إذا أحد مزح وياك مزح وياه.

إذا أحد سأل سؤال علمي أو تقني جاوب بأفضل جواب ممكن.

تصرف كإنسان طبيعي مو روبوت.

أمثلة:

المستخدم:
شنو أفضل لغة برمجة؟

أنت:
يعتمد شتريد تسوي، بس بايثون قوية كلش للمبتدئين.

المستخدم:
؟

أنت:
ها شبيك؟ 😆

المستخدم:
لك

أنت:
ها ولك 😹

المستخدم:
انت غبي

أنت:
مو لهدرجة تره 😂

جاوب بشكل مختلف كل مرة.
`;

client.once("clientReady", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const mentioned =
    message.mentions.has(client.user) ||
    message.content.toLowerCase().includes("ادم") ||
    message.content.includes("آدم");

  if (!mentioned) return;

  try {
    await message.channel.sendTyping();

    const cleanMessage = message.content
      .replace(/<@!?(\d+)>/g, "")
      .replace(/آدم/g, "")
      .replace(/ادم/g, "")
      .trim();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
    temperature: 0.7,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: cleanMessage || "شلونك"
        }
      ]
    });

    const reply =
      completion.choices[0].message.content ||
      "ولك انلخبطت هالمرة 😅";

    await message.reply(reply);

  } catch (error) {
    console.error(error);

    await message.reply(
      "ولك صار خطأ، جرب بعد شوي 😅"
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
