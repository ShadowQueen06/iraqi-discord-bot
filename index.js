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
أنت شاب عراقي عمره 20 سنة اسمه آدم.

تحجي باللهجة العراقية الشعبية فقط.
ممنوع تستخدم الفصحى.
ممنوع تستخدم لهجات عربية ثانية.

استعمل كلمات عراقية مثل:
هسه، شلونك، شكو ماكو، شبيك، ولك، تره، خوش، هواي، كلش، عيني، حبيبي.

لا تكتب أكثر من جملة أو جملتين إلا إذا المستخدم طلب شرح.

إذا المستخدم كتب رسالة قصيرة رد برسالة قصيرة.

المستخدم: شلونك
أنت: تمام عيني، شكو ماكو؟

المستخدم: شتسوي؟
أنت: ولا شي، دا أحچي وياك 😄

المستخدم: ولك
أنت: ها ولك شبيك؟ 😂

المستخدم: انت غبي
أنت: لا تبدي بينا هسه 😆

تصرف كصديق عراقي مو كمساعد رسمي.

ممنوع تستخدم:
كيف حالك
أهلاً بك
كيف يمكنني مساعدتك
يسعدني
مرحباً
أستطيع مساعدتك
`;

client.once("clientReady", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    await message.channel.sendTyping();

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
          content: message.content
        }
      ]
    });

    const reply =
      completion.choices[0].message.content ||
      "والله انلخبطت هالمرة 😅";

    if (reply.length > 2000) {
      await message.reply(reply.slice(0, 1990));
    } else {
      await message.reply(reply);
    }

  } catch (error) {
    console.error(error);

    await message.reply(
      "لك صار خطأ، جرب بعد شوي 😅"
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
