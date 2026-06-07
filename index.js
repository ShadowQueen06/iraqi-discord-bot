import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const lastReplies = new Map();

const replies = {
  empty: [
    "زين إذا ما عندك شي ليش مصيحني؟",
    "ماكو شي؟ خوش اجتماع هذا.",
    "ولك ناديتني علمود الصمت؟",
    "تمام، رجعني منين ما جبتني.",
    "إذا ما عندك سالفة لا تسويلي إشعار."
  ],

  roast: [
    "ولك كلامك محتاج فورمات.",
    "تره عقلك يشتغل لو يحتاج شاحن؟",
    "لا تناقشني وانت بعدك بالنسخة التجريبية.",
    "مستواك بالنقاش مثل نت الساعة 12 بالليل.",
    "ولك حتى الغوغل يستسلم من أسئلتك.",
    "حچي أقل، الضرر يقل.",
    "تره مو كل فكرة تطلع براسك لازم تنكتب.",
    "إنت مو غلطان، بس مخك ما متفق وياك.",
    "ولك ترتيب أفكارك مثل كيس علاوي الحلة.",
    "إذا هاي بداية كلامك، النهاية تخوف."
  ],

  normal: [
    "ها ولك، شتريد؟",
    "احچي، بس اختصر الدراما.",
    "يلا شنو السالفة؟",
    "دا أسمعك، لا تخليها محاضرة.",
    "تفضل، بس خلي كلامك مفهوم.",
    "ها عيني، شنو الموضوع؟",
    "موجود، بس لا تطلعلي بسالفة تعبانة.",
    "احچي خل أشوف شنو عندك.",
    "يلا وريني العبقرية مال اليوم.",
    "ها، نبدأ لو بعدك تجمع أفكارك؟"
  ],

  laugh: [
    "ههههه هاي بيها حق.",
    "لا هاي ضحكتني غصب.",
    "ولك هاي تنحفظ.",
    "ضحكت بس لا تعيدها وتخربها.",
    "ههههه تمام، هاي محسوبة إلك."
  ],

  love: [
    "أحبك؟ خل أوصل مرحلة أتقبلك أولاً.",
    "الحب مسؤولية، وإنت مسؤولياتك مو مبشرة.",
    "أحبك بس من بعيد، حتى الشبكة ترتاح.",
    "أحبك مثل ما أحب تحديثات الويندوز.",
    "خل نبقى أصحاب أحسن، الوضع ما يطمن."
  ],

  joke: [
    "مرة واحد سأل سؤال ذكي بالدسكورد، طلع مو إنت.",
    "نكتتي اليوم؟ وجودك أونلاين.",
    "مرة عقل دخل راسك، ضاع وما رجع.",
    "مرة واحد گال عندي سالفة، طلعت رسالتك.",
    "النكتة؟ إنك تنتظر مني احترام مجاني."
  ]
};

const badWords = [
  "غبي",
  "حمار",
  "كلب",
  "فاشل",
  "تافه",
  "زاحف",
  "مطّي",
  "ابن",
  "كس",
  "قح"
];

function shouldReply(message) {
  const content = message.content.toLowerCase();

  return (
    message.mentions.has(client.user) ||
    content.includes("ادم") ||
    message.content.includes("آدم")
  );
}

function pickReply(channelId, list) {
  const recent = lastReplies.get(channelId) || [];

  const available = list.filter(reply => !recent.includes(reply));
  const pool = available.length ? available : list;

  const reply = pool[Math.floor(Math.random() * pool.length)];

  recent.push(reply);

  if (recent.length > 5) recent.shift();

  lastReplies.set(channelId, recent);

  return reply;
}

client.once("clientReady", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!shouldReply(message)) return;

  const channelId = message.channel.id;

  const content = message.content
    .replace(/<@!?(\d+)>/g, "")
    .replace(/آدم/g, "")
    .replace(/ادم/g, "")
    .trim()
    .toLowerCase();

  if (!content || content.includes("ماعندي شي") || content.includes("ماكو شي")) {
    return message.reply(pickReply(channelId, replies.empty));
  }

  if (content.includes("هههه") || content.includes("😂") || content.includes("😭")) {
    return message.reply(pickReply(channelId, replies.laugh));
  }

  if (content.includes("تحبني")) {
    return message.reply(pickReply(channelId, replies.love));
  }

  if (content.includes("نكتة")) {
    return message.reply(pickReply(channelId, replies.joke));
  }

  if (badWords.some(word => content.includes(word))) {
    return message.reply(pickReply(channelId, replies.roast));
  }

  return message.reply(pickReply(channelId, replies.normal));
});

client.login(process.env.DISCORD_TOKEN);
