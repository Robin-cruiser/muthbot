// ---- Imports ----
const mineflayer = require('mineflayer')
const express = require('express')

// ---- Settings ----
const SERVER = 'muthserver.aternos.me'
const MC_PORT = 25565
const PASSWORD = 'njbruto'
const JUMP_INTERVAL = 30 * 1000      // 30 s
const SWITCH_DELAY = 60 * 60 * 1000  // 1 h
const RECONNECT_DELAY = 10000        // 10 s

let active = 'Muth'
let bot

// ---- Bot Creation ----
function createBot(name) {
  console.log(`Connecting ${name}...`)
  const b = mineflayer.createBot({
    host: SERVER,
    port: MC_PORT,
    username: name,
    auth: 'offline'
  })

  b.on('spawn', () => {
    console.log(`${name} joined.`)
    b.chat(`/register ${PASSWORD} ${PASSWORD}`)
    setTimeout(() => b.chat(`/login ${PASSWORD}`), 2000)

    // Anti-AFK jumping
    setInterval(() => {
      try {
        b.setControlState('jump', true)
        setTimeout(() => b.setControlState('jump', false), 300)
      } catch {}
    }, JUMP_INTERVAL)

    // After 1 h, summon the other bot
    setTimeout(() => {
      const next = name === 'Muth' ? 'Kali' : 'Muth'
      console.log(`${name}'s shift done → Summoning ${next}`)
      summonNext(next)
    }, SWITCH_DELAY)
  })

  // Leave only when the other joins
  b.on('chat', (user, msg) => {
    if (
      (name === 'Muth' && msg.includes('Kali joined')) ||
      (name === 'Kali' && msg.includes('Muth joined'))
    ) {
      console.log(`${name} saw "${msg}", leaving...`)
      b.quit()
      setTimeout(() => swap(), RECONNECT_DELAY)
    }
  })

  b.on('kicked', reason => {
    console.log(`${name} kicked: ${reason}`)
    setTimeout(() => swap(), RECONNECT_DELAY)
  })

  b.on('error', err => console.log(`${name} error: ${err.message}`))
  b.on('end', () => console.log(`${name} disconnected.`))

  return b
}

// ---- Helpers ----
function summonNext(next) {
  if (active !== next) {
    console.log(`Preparing ${next} to join...`)
    active = next
    setTimeout(() => (bot = createBot(active)), RECONNECT_DELAY)
  }
}

function swap() {
  active = active === 'Muth' ? 'Kali' : 'Muth'
  console.log(`Switching to ${active} in ${RECONNECT_DELAY / 1000}s...`)
  setTimeout(() => (bot = createBot(active)), RECONNECT_DELAY)
}

// ---- Start ----
bot = createBot(active)

// ---- Keep Render Alive ----
const app = express()
app.get('/', (_, res) => res.send('✅ MuthBot is running!'))
const WEB_PORT = process.env.PORT || 3000
app.listen(WEB_PORT, () => console.log(`🌐 Web server on ${WEB_PORT}`))
