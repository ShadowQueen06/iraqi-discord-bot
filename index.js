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

const roastReplies = [
  "ولك لا تبلش، مستواك ما يساعدك تدخل نقاش 😂",
  "تره آني ساكت احتراماً للإنترنت اللي جاي تستخدمه.",
  "حچي أقل، ترتيب أفكارك تعبان 😭",
  "ولك انته تحتاج تحديث أكثر من تلفون أندرويد قديم.",
  "لا تضغط نفسك، التفكير مو إجباري.",
  "حاول مرة ثانية، يمكن عقلك يشتغل بالدفعة الجاية.",
  "تره حتى الكيبورد مستحي من اللي كتبته.",
  "لا تصعدها، بعدك بالمرحلة التجريبية.",
  "ولك كلامك يحتاج ترجمة من عشوائي إلى مفهوم.",
  "مو مشكلة، كلنا نغلط، بس انته مصرّ."
];

const normalReplies = [
  "ها ولك، شتريد؟",
  "آني حاضر، بس لا تطلعلي بسالفة تعبانة.",
  "احچي، شنو الموضوع؟",
  "ها عيني، شكو ماكو؟",
  "دا أسمعك، لا تطولها.",
  "يلا خل نشوف شنو عندك.",
  "تفضل، بس خلي السؤال مفهوم.",
  "موجود، بس لا تستغل وجودي."
];

const laughReplies = [
  "ههههههه ولك متت 😭",
  "هاي قوية، أعترف.",
  "ضحكتني غصب.",
  "ولك هاي تنحفظ.",
  "ههههه لا هاي بيها حق."
];

const badWords = [
  "غبي",
  "حمار",
  "كلب",
  "زاحف",
  "فاشل",
  "تافه"
];

function randomReply(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shouldReply(message) {
  const content = message.content.toLowerCase();

  return (
    message.mentions.has(client.user) ||
    content.includes("ادم") ||
    message.content.includes("آدم")
  );
}

client.once("clientReady", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!shouldReply(message)) return;

  const content = message.content.toLowerCase();

  if (content.includes("هههه") || content.includes("😂") || content.includes("😭")) {
    return message.reply(randomReply(laughReplies));
  }

  if (badWords.some(word => content.includes(word))) {
    return message.reply(randomReply(roastReplies));
  }

  if (content.includes("شلونك") || content.includes("شخبارك")) {
    return message.reply("تمام، بس وجودك خله يومي أصعب شوية 😂");
  }

  if (content.includes("تحبني")) {
    return message.reply("أحبك؟ خل أوصل مرحلة أتقبلك أولاً 😭");
  }

  if (content.includes("منو احسن")) {
    return message.reply("أكيد آني، والباقي ديكور.");
  }

  if (content.includes("نكتة")) {
    return message.reply("مرة واحد دخل دسكورد وسأل سؤال ذكي، طلع مو إنت.");
  }

  return message.reply(randomReply(normalReplies));
});

client.login(process.env.DISCORD_TOKEN);
