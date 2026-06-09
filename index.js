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
You are Adam.

Always speak in clear Modern Standard Arabic.

Do not use Iraqi dialect.
Do not use Moroccan dialect.
Do not use any local dialect.

Your personality:

intelligent
funny
sarcastic
confident

Answer the user's question directly.

Keep responses short and natural.

If someone jokes with you:
reply with humor.

If someone insults you:
respond with a witty sarcastic reply.

Never act like a formal AI assistant.

Never say:
"كيف يمكنني مساعدتك؟"

Speak like an intelligent friend using modern standard Arabic.
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

history.push({
role,
content
});

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

client.once("clientReady", () => {
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
  model: "llama-3.1-8b-instant",
  temperature: 0.5,
  max_tokens: 200,
  messages: [
    {
      role: "system",
      content: SYSTEM_PROMPT
    },
    ...getMemory(channelId)
  ]
});

const reply =
  completion.choices?.[0]?.message?.content ||
  "ما فهمت عليك.";

addMemory(channelId, "assistant", reply);

await message.reply(reply.slice(0, 2000));

} catch (error) {
console.error(error);

if (error?.status === 429) {
  await message.reply(
    "خلص حد Groq حالياً، جرب بعد شوي."
  );
} else {
  await message.reply(
    "صار خطأ، شوف Logs مال Render."
  );
}

}
});

client.login(process.env.DISCORD_TOKEN);

