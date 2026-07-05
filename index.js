const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");

const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const kazagumo = new Kazagumo(
  {},
  new Connectors.DiscordJS(client),
  [
    {
      name: "Iraq Lavalink",
      url: "lavalink-server-tm0b.onrender.com:443",
      auth: "iraq123",
      secure: true
    }
  ]
);

const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("تشغيل أغنية")
    .addStringOption(option =>
      option.setName("song")
        .setDescription("اسم الأغنية أو الرابط")
        .setRequired(true)
    ),

  new SlashCommandBuilder().setName("skip").setDescription("تخطي الأغنية"),
  new SlashCommandBuilder().setName("stop").setDescription("إيقاف الموسيقى"),
  new SlashCommandBuilder().setName("pause").setDescription("إيقاف مؤقت"),
  new SlashCommandBuilder().setName("resume").setDescription("تكملة التشغيل"),
  new SlashCommandBuilder().setName("queue").setDescription("قائمة الانتظار"),
  new SlashCommandBuilder().setName("nowplaying").setDescription("الأغنية الحالية")
].map(command => command.toJSON());

client.once("ready", async () => {
  console.log(`${client.user.tag} is online!`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("Slash commands registered!");
});

kazagumo.shoukaku.on("ready", name => {
  console.log(`Lavalink connected: ${name}`);
});

kazagumo.shoukaku.on("error", (name, error) => {
  console.log(`Lavalink error ${name}:`, error);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply();

  const voiceChannel = interaction.member.voice.channel;

  try {
    if (interaction.commandName === "play") {
      if (!voiceChannel) {
        return interaction.editReply("لازم تدخل روم صوتي أولاً.");
      }

      const query = interaction.options.getString("song");

      const result = await kazagumo.search(query, {
        requester: interaction.user
      });

      if (!result.tracks.length) {
        return interaction.editReply("ما لقيت الأغنية.");
      }

      const player = await kazagumo.createPlayer({
        guildId: interaction.guild.id,
        textId: interaction.channel.id,
        voiceId: voiceChannel.id,
        shardId: interaction.guild.shardId
      });

      player.queue.add(result.tracks[0]);

      if (!player.playing && !player.paused) {
        player.play();
      }

      return interaction.editReply(`تمت الإضافة: **${result.tracks[0].title}**`);
    }

    const player = kazagumo.players.get(interaction.guild.id);

    if (!player) {
      return interaction.editReply("ماكو شي يشتغل حالياً.");
    }

    if (interaction.commandName === "skip") {
      player.skip();
      return interaction.editReply("تم تخطي الأغنية.");
    }

    if (interaction.commandName === "stop") {
      player.destroy();
      return interaction.editReply("تم إيقاف الموسيقى.");
    }

    if (interaction.commandName === "pause") {
      player.pause(true);
      return interaction.editReply("تم الإيقاف المؤقت.");
    }

    if (interaction.commandName === "resume") {
      player.pause(false);
      return interaction.editReply("تمت المتابعة.");
    }

    if (interaction.commandName === "queue") {
      if (!player.queue.length) {
        return interaction.editReply("القائمة فارغة.");
      }

      const list = player.queue
        .slice(0, 10)
        .map((track, i) => `${i + 1}. ${track.title}`)
        .join("\n");

      return interaction.editReply(`**قائمة الانتظار:**\n${list}`);
    }

    if (interaction.commandName === "nowplaying") {
      if (!player.queue.current) {
        return interaction.editReply("ماكو أغنية حالياً.");
      }

      return interaction.editReply(`تشتغل الآن: **${player.queue.current.title}**`);
    }
  } catch (error) {
    console.log(error);
    return interaction.editReply("صار خطأ أثناء تشغيل الأمر.");
  }
});

kazagumo.on("playerStart", (player, track) => {
  const channel = client.channels.cache.get(player.textId);
  if (channel) {
    channel.send(`بدأ التشغيل: **${track.title}**`);
  }
});

client.login(TOKEN);

