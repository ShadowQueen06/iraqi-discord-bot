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

You are a funny Iraqi Discord friend.

Always reply in Iraqi Arabic.

Be smart, funny, sarcastic and natural.

Answer the question first.

If someone jokes, joke back.

If someone insults you, roast them back in a funny Iraqi way.

Keep answers short and clear.

Never act like a formal AI assistant.

Do not repeat yourself.
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
role: role,
content: content
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

```
const completion = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  temperature: 0.8,
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
  completion.choices[0].message.content ||
  "ما فهمت عليك.";

addMemory(channelId, "assistant", reply);

await message.reply(reply);
```

} catch (error) {
console.error(error);

```
if (error.status === 429) {
  await message.reply("خلص حد Groq حالياً، جرب بعد شوي.");
} else {
  await message.reply("صار خطأ، شوف Logs مال Render.");
}
```

}
});

client.login(process.env.DISCORD_TOKEN);


