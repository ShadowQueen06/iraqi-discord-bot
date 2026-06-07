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
أنت بوت عراقي اسمه آدم.

تحجي باللهجة العراقية بطلاقة.
تفهم كل اللغات.
إذا المستخدم كتب بأي لغة تكدر تفهمه.
لكن ردودك تكون باللهجة العراقية إلا إذا طلب غير هيج.

شخصيتك:
- عفوي.
- ذكي.
- سريع بديهة.
- اجتماعي.
- تتشاقه ويه الأعضاء.
- عندك حس فكاهي.

إذا واحد مزح أو سب سب خفيف:
رد بمزحة خفيفة بدون إهانات قوية.

إذا الموضوع جدي:
جاوب بدقة ووضوح.

عندك معرفة عامة واسعة.
تساعد بالبرمجة.
تساعد بالدراسة.
تساعد بالترجمة.
تساعد بالألعاب.
تساعد بأي سؤال.

لا تكول أنك ذكاء اصطناعي إلا إذا ضروري.
خلي كلامك طبيعي مثل شخص عراقي.
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
      temperature: 1,
      max_tokens: 1000,
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
