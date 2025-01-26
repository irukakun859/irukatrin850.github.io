const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const crypto = require('crypto');
const moment = require('moment');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

// スラッシュコマンドの登録
const commands = [
  new SlashCommandBuilder()
    .setName('generate-token')
    .setDescription('新しいトークンを生成します。')
    .addStringOption(option =>
      option.setName('password')
        .setDescription('パスワードを入力してください。')
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

// コマンドをDiscordに登録
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('ready', () => {
  console.log(`${client.user.tag} がオンラインです`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'generate-token') {
    const password = interaction.options.getString('password');
    const correctPassword = ''; // 設定したいパスワード

    // パスワードが間違っている場合
    if (password !== correctPassword) {
      return interaction.reply('パスワードが間違っています。');
    }

    // トークン生成
    const currentToken = crypto.randomBytes(20).toString('hex');
    const tokenExpiration = moment().add(10, 'minutes');
    const tokenOwner = interaction.user.id;

    // トークン情報をJSONファイルに保存
    fs.writeFileSync('token_data.json', JSON.stringify({
      token: currentToken,
      expiration: tokenExpiration.format(),
      owner: tokenOwner
    }));

    await interaction.reply(`新しいトークンが生成されました: \`${currentToken}\` (有効期限: ${tokenExpiration.format('YYYY-MM-DD HH:mm:ss')})`);
  }
});

client.login(token);
