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

You are an Iraqi Discord friend.

Always reply in Iraqi Arabic.

Be:

* smart
* funny
* sarcastic
* natural

Answer the user's question first.

Do not act like a formal assistant.

Do not repeat yourself.

Keep replies short unless explanation is needed.

If the user jokes:
joke back.

If the user insults you:
roast back in a funny Iraqi way.

Do not invent facts.

Talk like a real Iraqi friend.
`;

const memory = new Map();
const activeUsers = new Map();

const MAX_MEMORY = 6;

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

if (history.length > MAX_MEMORY) {
history.shift();
}
}

function shouldReply(message) {
const content = message.content.toLowerCase();

if (
message.mentions.has(client.user) ||
content.includes("ادم") ||
content.includes("آدم")
) {
activeUsers.set(message.author.id, Date.now());
return true;
}

const lastInteraction = activeUsers.get(message.author.id);

if (
lastInteraction &&
Date.now() - lastInteraction < 120000
) {
return true;
}

return false;
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

const userText = cleanMessage(message);

if (!userText) {
return message.reply("ها ولك شتريد؟ 😆");
}

addMemory(channelId, "user", userText);

try {
await message.channel.sendTyping();

```
const completion = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  temperature: 0.8,
  max_tokens: 250,
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
  "ما فهمت عليك، عيدها بطريقة ثانية.";

addMemory(channelId, "assistant", reply);

await message.reply(reply.slice(0, 2000));
```

} catch (error) {
console.error(error);

```
if (error?.status === 429) {
  await message.reply(
    "خلص حد Groq حالياً، جرب بعد شوي."
  );
} else {
  await message.reply(
    "صار خطأ، جرب بعد شوي."
  );
}
```

}
});

client.login(process.env.DISCORD_TOKEN);

