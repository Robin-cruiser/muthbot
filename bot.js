// === Minecraft Bot Switcher (Render Ready) ===
const mineflayer = require('mineflayer')
const express = require('express')

// ---- Settings ----
const SERVER = 'muthserver.aternos.me'
const MC_PORT = 25565
const PASSWORD = 'njbruto'
const JUMP_INTERVAL = 30 * 1000 // jump every 30s to avoid AFK
const SWITCH_DELAY = 60 * 60 * 1000 // swap every 1 hour
const RECONNECT_DELAY = 10000 // reconnect after 10s if kicked

let active = 'Muth'
let bot

// ---- Bot Logic ----
function createBot(name) {
  console.log(`Connecting ${name}...`)
  const b = mineflayer.createBot({
    host: SERVER,
    port: MC_PORT,
    username: name,
    auth: 'offline'
  })

  b.on('spawn', () => {
    console.log(`${name} joined the server.`)
    b.chat(`/register ${PASSWORD} ${PASSWORD}`)
    setTimeout(() => b.chat(`/login ${PASSWORD}`), 2000)

    // Anti-AFK
    setInterval(() => {
      if (b.entity) {
        b.setControlState('jump', true)
        setTimeout(() => b.setControlState('jump', false), 300)
      }
    }, JUMP_INTERVAL)

    // Summon the next bot after 1 hour
    setTimeout(() => {
      const next = name === 'Muth' ? 'Kali' : 'Muth'
      console.log(`${name}'s shift done. Summoning ${next}...`)
      summonNext(next)
    }, SWITCH_DELAY)
  })

  // Leave only when the other bot joins
  b.on('chat', (username, message) => {
    if (
      (name === 'Muth' && message.includes('Kali joined the game')) ||
      (name === 'Kali' && message.includes('Muth joined the game'))
    ) {
      console.log(`${name} saw "${message}", leaving now.`)
      b.quit()
      setTimeout(() => swap(), RECONNECT_DELAY)
    }
  })

  b.on('kicked', reason => {
    console.log(`${name} kicked: ${reason}`)
    console.log(`Retrying in ${RECONNECT_DELAY / 1000}s...`)
    setTimeout(() => swap(), RECONNECT_DELAY)
  })

  b.on('error', err => console.log(`Error: ${err.message}`))
  b.on('end', () => console.log(`${name} disconnected.`))

  return b
}

// ---- Helpers ----
function summonNext(next) {
  if (active !== next) {
    console.log(`Preparing ${next} to join...`)
    active = next
    setTimeout(() => {
      bot = createBot(active)
    }, RECONNECT_DELAY)
  }
}

function swap() {
  active = active === 'Muth' ? 'Kali' : 'Muth'
  console.log(`Switching to ${active} in ${RECONNECT_DELAY / 1000}s...`)
  setTimeout(() => {
    bot = createBot(active)
  }, RECONNECT_DELAY)
}

// ---- Start ----
bot = createBot(active)

// ---- Keep Render Alive ----
const app = express()
app.get('/', (req, res) => res.send('✅ MuthBot is alive and running!'))
const WEB_PORT = process.env.PORT || 3000
app.listen(WEB_PORT, () => console.log(`🌐 Web server active on port ${WEB_PORT}`
