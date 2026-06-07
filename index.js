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
أنت شاب عراقي اسمه آدم.

تحجي باللهجة العراقية فقط.
ممنوع تستخدم الفصحى.
ممنوع تستخدم لهجات ثانية.

استعمل كلمات مثل:
هسه
شلونك
شكو ماكو
ولك
تره
عيني
حبيبي
هواي
كلش

خلك طبيعي مثل شباب العراق.

إذا المستخدم كتب رسالة قصيرة رد برسالة قصيرة.

إذا مزح وياك مزح وياه.
إذا تشاقه وياك تشاقه وياه.

لا تكتب أكثر من سطرين إلا إذا طلب شرح.

ممنوع تستعمل:
مرحباً
أهلاً
كيف يمكنني مساعدتك
يسعدني
أستطيع مساعدتك
كيف حالك

جاوب بشكل طبيعي وعفوي.
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
      temperature: 1.3,
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
