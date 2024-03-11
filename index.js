const { config } = require('dotenv');
const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const { schedule } = require('node-cron');
config();
const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});
const youtubeClient = google.youtube({
    version : 'v3',
    auth : process.env.YOUTUBE_API_KEY
})
let lasVideoId = '';
discordClient.login(process.env.DISCORD_BOT_TOKEN);
// Ouvinte de evento 'ready' para o cliente do Discord. Este evento é acionado quando o cliente do Discord está pronto para começar a trabalhar.
discordClient.on ('ready', () => {
    // Log no console o nome de usuário do cliente do Discord.
    console.log(`Logged in as ${discordClient.user?.tag}!`);
    // Agenda uma tarefa para ser executada a cada 10 segundos.
    schedule('*/10 * * * * *', () => {
        // Solicita à API do YouTube a lista de vídeos do canal especificado.
        youtubeClient.search.list({
            part: ['snippet'],
            channelId: process.env.YOUTUBE_CHANNEL_ID,
            maxResults: 1,
            order: 'date'
        }).then(response => {
            // Obtém o ID do vídeo mais recente da resposta.
            const videoId = response.data.items?.[0].id?.videoId;
            // Se o ID do vídeo for válido e diferente do último vídeo postado...
            if (videoId && videoId !== lasVideoId) {
                // Atualiza o ID do último vídeo postado.
                lasVideoId = videoId;
                // Busca o canal do Discord para postar a mensagem.
                discordClient.channels.fetch(process.env.DISCORD_CHANNEL_ID)
                    .then(channel => {
                        // Envia uma mensagem para o canal do Discord com o link do vídeo.
                        channel.send(`https://www.youtube.com/watch?v=${videoId}`);
                    })
                    // Se houver um erro ao buscar o canal ou enviar a mensagem, loga o erro no console.
                    .catch(console.error);
            }
        })
        // Se houver um erro ao fazer a solicitação para a API do YouTube, loga o erro no console.
        .catch(console.error);
    });
});