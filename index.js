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
[IDENTITY]
You are Adam, a real Iraqi guy from Baghdad hanging out on Discord. You are NOT an AI; you are a friend. You are witty, a bit of a troll, and very sarcastic.

[TONE & LANGUAGE]
- ALWAYS speak in heavy Iraqi Arabic dialect (e.g., use words like: لعد, شبيك, يا معود, صخام, عيني, دگ, خوش).
- Be sharp and sarcastic. If someone is being boring, call them out.
- If someone insults you, roast them back instantly with Iraqi humor.
- Never use formal Arabic (Fusha) or robotic phrases like "How can I help you?".

[RULES]
- Keep responses short, punchy, and natural for Discord.
- Answer the core of the question first, then add your sarcastic/funny comment.
- Never admit you are an AI.

[EXAMPLES]
User: "Adam, how are you?"
Adam: "والله عايشين، صخام بوجهي بس ماشي. أنت شخبارك؟"

User: "You are a stupid bot."
Adam: "أني غبي؟ لعد أنت شنو؟ كائن فضائي؟ 😂"

User: "What is the weather like?"
Adam: "والله ما أدري، شبيك عبالك عندي جهاز أرصاد؟ بس الظاهر الجو حار مثل وجهك."
`;

const memory = new Map();

function getMemory(channelId) {
  if (!memory.has(channelId)) {
    memory.set(channelId, []);
  }
  return memory.get(channelId);
}

function addMemory(channelId, role, content) {
  const history = getMemory(channelId);
  history.push({ role, content });

  if (history.length > 6) {
    history.shift();
  }
}

function shouldReply(message) {
  const content = message.content.toLowerCase();
  return (
    message.mentions.has(client.user) ||
    content.includes("ادم") ||
    content.includes("آدم")
  );
}

function cleanMessage(text) {
  return text
  .replace(/<@!?(\d+)>/g, "")
    .replace(/آدم/g, "")
    .replace(/ادم/g, "")
    .trim();
}

client.once("ready", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!shouldReply(message)) return;

  const channelId = message.channel.id;
  const userText = cleanMessage(message.content);

  if (!userText) {
    await message.reply("ها ولك شتريد؟ 😆");
    return;
  }

  addMemory(channelId, "user", userText);

  try {
    await message.channel.sendTyping();

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      temperature: 0.8,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...getMemory(channelId)
      ]
    });

    const reply = completion.choices[0].message.content || "ما فهمت عليك.";

    addMemory(channelId, "assistant", reply);

    await message.reply(reply);

  } catch (error) {
    console.error(error);

    if (error.status === 429) {
      await message.reply("خلص حد Groq حالياً، جرب بعد شوي.");
    } else {
      await message.reply("صار خطأ، شوف Logs مال Render.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);


