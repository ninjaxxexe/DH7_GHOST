const {
  default: makeWASocket,
  useSingleFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  downloadMediaMessage
} = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const axios = require("axios");
const ytdl = require("ytdl-core");
const { exec } = require("child_process");
const chalk = require("chalk");
const moment = require("moment");

const { state, saveState } = useSingleFileAuthState("./session.json");

async function startBot() {
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
    version
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        startBot();
      } else {
        console.log("Bot logged out.");
      }
    } else if (connection === "open") {
      console.log(chalk.green("Bot Adam_D'H7 X Ninjaxx konekte ak siksè!"));
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const sender = m.key.remoteJid;
    const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
    const command = body.trim().split(" ")[0].toLowerCase();
    const args = body.trim().split(" ").slice(1).join(" ");

    // --- Menu ---
    if (command === ".menu") {
      const menuText = `
╔══『 *Adam_D'H7 X Ninjaxx* 』
║
╠⟶ *.ping*
╠⟶ *.owner*
╠⟶ *.sticker*
╠⟶ *.toimg*
╠⟶ *.tomp3*
╠⟶ *.ytmp3 [link]*
╠⟶ *.ytmp4 [link]*
╠⟶ *.tiktok [link]*
╠⟶ *.ig [link]*
╠⟶ *.mediafire [link]*
╠⟶ *.ai [kesyon]*
╠⟶ *.kick @user*
╠⟶ *.add 123456*
╠⟶ *.promote @user*
╠⟶ *.demote @user*
╠⟶ *.truth | .dare | .rate*
╠⟶ *.attp [tèks]*
╠⟶ *.logo [tèks]*
╠⟶ *.qrcode [tèks]*
╠⟶ *.readqr*
╠⟶ *.calc 5*5*
╠⟶ *.shorturl [lyen]*
╚═════════════════
`;
      await sock.sendMessage(sender, { text: menuText });
    }

    // Ping
    else if (command === ".ping") {
      await sock.sendMessage(sender, { text: "✅ Bot la ap mache byen!" });
    }

    // Owner
    else if (command === ".owner") {
      await sock.sendMessage(sender, { text: "👑 Pwopriyetè: D'H7 | Tergene\nWhatsApp: wa.me/50932042755" });
    }

    // Sticker
    else if (command === ".sticker") {
      const media = await downloadMediaMessage(m, "buffer", {}, { logger: P({ level: "silent" }) });
      await sock.sendMessage(sender, { sticker: media }, { quoted: m });
    }

    // Toimg (Sticker to image)
    else if (command === ".toimg") {
      const media = await downloadMediaMessage(m, "buffer", {}, { logger: P({ level: "silent" }) });
      fs.writeFileSync("./temp.webp", media);
      exec("ffmpeg -i temp.webp temp.png", async (err) => {
        if (!err) {
          const buffer = fs.readFileSync("./temp.png");
          await sock.sendMessage(sender, { image: buffer, caption: "Imaj konvèti!" });
        }
      });
    }

    // YouTube MP3
    else if (command === ".ytmp3") {
      if (!args.includes("youtube.com")) return sock.sendMessage(sender, { text: "Antre yon lyen YouTube valab!" });
      const info = await ytdl.getInfo(args);
      const audio = ytdl(args, { filter: "audioonly" });
      const path = "./yt.mp3";
      audio.pipe(fs.createWriteStream(path)).on("finish", async () => {
        const buffer = fs.readFileSync(path);
        await sock.sendMessage(sender, { audio: buffer, mimetype: "audio/mp4" }, { quoted: m });
      });
    }

    // AI Repons
    else if (command === ".ai") {
      if (!args) return sock.sendMessage(sender, { text: "Ekri kesyon ou!" });
      // Simulated response
      await sock.sendMessage(sender, { text: `🤖 Repons AI (sipoze): ${args}` });
    }

    // Add plis lòd si ou vle...
  });
}

startBot();
