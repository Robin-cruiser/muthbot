const mineflayer = require('mineflayer')
const express = require('express')

const SERVER = 'muthserver.aternos.me'
const MC_PORT = 25565
const PASSWORD = 'njbruto'
const JUMP_INTERVAL = 30 * 1000
const SWITCH_DELAY = 60 * 60 * 1000
const RECONNECT_DELAY = 10000

let active = 'Muth'
let bot

function createBot(name) {
  console.log(`Connecting ${name}...`)
  const b = mineflayer.createBot({
    host: SERVER,
    port: MC_PORT,
    username: name,
    auth: 'offline',
  })

  b.on('spawn', () => {
    console.log(`${name} joined the server.`)
    b.chat(`/register ${PASSWORD} ${PASSWORD}`)
    setTimeout(() => b.chat(`/login ${PASSWORD}`), 2000)

    // Anti-AFK jump
    setInterval(() => {
      try {
        b.setControlState('jump', true)
        setTimeout(() => b.setControlState('jump', false), 300)
      } catch {}
    }, JUMP_INTERVAL)

    // After 1 hour, trigger next bot
    setTimeout(() => {
      const next = name === 'Muth' ? 'Kali' : 'Muth'
      console.log(`${name}'s shift done → Summoning ${next}`)
      summonNext(next)
    }, SWITCH_DELAY)
  })

  // Detect join messages (system or chat)
  const detectJoin = msg => {
    const text = msg.toLowerCase()
    if (
      (name === 'Muth' && text.includes('kali')) ||
      (name === 'Kali' && text.includes('muth'))
    ) {
      if (text.includes('joined') || text.includes('has joined')) {
        console.log(`${name} detected that the other joined → leaving...`)
        b.quit()
        setTimeout(() => swap(), RECONNECT_DELAY)
      }
    }
  }

  b.on('chat', (_, message) => detectJoin(message))
  b.on('message', message => {
    if (message?.toString) detectJoin(message.toString())
  })

  b.on('kicked', reason => {
    console.log(`${name} kicked: ${reason}`)
    setTimeout(() => swap(), RECONNECT_DELAY)
  })

  b.on('error', err => console.log(`${name} error: ${err.message}`))
  b.on('end', () => console.log(`${name} disconnected.`))

  return b
}

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

// Start first bot
bot = createBot(active)

// Keep Render alive
const app = express()
app.get('/', (_, res) => res.send('✅ MuthBot is active.'))
const WEB_PORT = process.env.PORT || 3000
app.listen(WEB_PORT, () => console.log(`🌐 Web server on ${WEB_PORT}`))
