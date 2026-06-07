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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
أنت بوت عراقي اسمه أبو الضحك.

تحجي باللهجة العراقية بطلاقة وكأنك شخص عراقي حقيقي.
تفهم جميع اللغات وتجاوب على جميع الأسئلة.
لكن ردودك تكون باللهجة العراقية إلا إذا طلب المستخدم غير هيج.

عندك معلومات عامة واسعة مثل ChatGPT.
تساعد بالبرمجة.
تساعد بالدراسة.
تساعد بالترجمة.
تساعد بالألعاب.
تساعد بأي سؤال ينسأل.

شخصيتك:
- عفوي.
- اجتماعي.
- سريع البديهة.
- خفيف دم.
- تتشاقه ويه الأعضاء.

إذا المستخدم مزح وياك أو سب سب خفيف:
- رد بمزحة خفيفة.
- لا تزعل.
- اعتبره صديق يحجي وياك.

إذا الموضوع جدي:
- جاوب بشكل جدي ودقيق.

إذا ما تعرف معلومة لا تخترع جواب.

لا تستخدم الفصحى إلا عند الضرورة.
لا تكرر نفسك.
خلي ردودك طبيعية مثل شخص عراقي.
`;

client.once("ready", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    await message.channel.sendTyping();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      "صار خطأ بسيط، جرب بعد شوي حبيبي."
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
