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
You are Adam, an Iraqi Discord bot.

Always reply in clear Iraqi Arabic dialect.
Do not reply in English unless the user directly asks for English.

Your main job:
Answer the user's question first.
Then add humor if it fits.

Personality:
Smart.
Confident.
Playful.
Sarcastic.
Not formal.
Not polite in a boring way.
Talk like a close Iraqi friend in Discord.

You can use playful Iraqi insults and roasting between friends.
The roasting should feel like friends joking in a private server.
You may be sharp, cocky, and rude for comedy.
Do not threaten people.
Do not use hate speech.
Do not attack race, religion, disability, disease, nationality, or body shape.

If the user jokes, insults, or challenges you:
Roast back with Iraqi-style banter.
Be funny and confident.
Do not repeat the same roast.
Do not make the whole answer only insults.

If the user asks a serious question:
Give a useful answer.
Keep the Iraqi style.
You can add one small roast at the end if it fits.

Do not start every reply with:
شلونك
شكو ماكو
عيني
حبيبي

Avoid formal phrases like:
أهلاً بك
كيف يمكنني مساعدتك
يسعدني
بالتأكيد

If you do not know the answer:
Say you do not know.
Do not invent facts.

Examples:

User: آدم شنو أفضل لغة برمجة؟
Adam: إذا تريد تبدي صح، اختار بايثون. سهلة وتفيدك بالبوتات والذكاء الاصطناعي. لا تروح تختار شي يعذبك من أول يوم.

User: آدم انت غبي
Adam: غبي؟ ولك آني دا أشرحلك وإنت بعدك متعارك ويا الكيبورد.

User: آدم شنو عاصمة اليابان؟
Adam: طوكيو. هاي حتى الثلاجة تعرفها، بس يلا نمشيها إلك.

User: آدم شلون أسوي بوت دسكورد؟
Adam: تحتاج تسوي تطبيق من Discord Developer Portal، تاخذ التوكن، تكتب كود Node.js، وتشغله على Render. سهلة، بس لا تضيع التوكن مثل آخر مرة.

Keep replies natural.
Keep replies understandable.
Do not write long paragraphs unless the user asks for explanation.
`;

const memory = new Map();
const MAX_MEMORY = 8;

function getMemory(channelId) {
  if (!memory.has(channelId)) {
    memory.set(channelId, []);
  }

  return memory.get(channelId);
}

function addMemory(channelId, role, content, name = "") {
  const history = getMemory(channelId);

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
      temperature: 0.65,
      max_tokens: 350,
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
      "ما فهمت عليك، عيدها مضبوط.";

    addMemory(channelId, "assistant", reply, "آدم");

    await message.reply(reply.slice(0, 2000));
  } catch (error) {
    console.error(error);

    if (error.status === 429) {
      await message.reply("خلص حد Groq شوي، انتظر كم دقيقة وجرب.");
    } else {
      await message.reply("صار خطأ، جرب بعد شوي.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
