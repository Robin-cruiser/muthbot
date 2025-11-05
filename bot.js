const mineflayer = require('mineflayer')
const express = require('express')

const SERVER = 'muthserver.aternos.me'
const MC_PORT = 25565
const PASSWORD = 'njbruto'
const JUMP_INTERVAL = 30 * 1000
const SWITCH_DELAY = 60 * 60 * 1000 // 1 hour
const RECONNECT_DELAY = 10000 // 10s

let active = 'Muth'
let bot
let nextJoinPlanned = false

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

    // Anti-AFK jump
    setInterval(() => {
      try {
        b.setControlState('jump', true)
        setTimeout(() => b.setControlState('jump', false), 300)
      } catch {}
    }, JUMP_INTERVAL)

    // Schedule the other bot to join after 1h
    if (!nextJoinPlanned) {
      nextJoinPlanned = true
      setTimeout(() => {
        const next = name === 'Muth' ? 'Kali' : 'Muth'
        console.log(`${name} shift done → Summoning ${next}`)
        summonNext(next)
      }, SWITCH_DELAY)
    }
  })

  // When the other bot joins, this one leaves
  function detectJoin(msg) {
    const text = msg.toLowerCase()
    if (
      (name === 'Muth' && text.includes('kali joined')) ||
      (name === 'Kali' && text.includes('muth joined'))
    ) {
      console.log(`${name} saw the other bot join → leaving...`)
      b.quit()
    }
  }

  b.on('message', msg => {
    if (msg?.toString) detectJoin(msg.toString())
  })

  b.on('chat', (_, msg) => detectJoin(msg))
  b.on('kicked', r => console.log(`${name} kicked: ${r}`))
  b.on('error', e => console.log(`${name} error: ${e.message}`))
  b.on('end', () => console.log(`${name} disconnected.`))

  return b
}

function summonNext(next) {
  console.log(`Preparing ${next} to join...`)
  active = next
  nextJoinPlanned = false
  setTimeout(() => {
    bot = createBot(active)
  }, RECONNECT_DELAY)
}

// Start first bot
bot = createBot(active)

// Keep render alive
const app = express()
app.get('/', (_, res) => res.send('✅ MuthBot active.'))
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🌐 Web server on ${PORT}`))
