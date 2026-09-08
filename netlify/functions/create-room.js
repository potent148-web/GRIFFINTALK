export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const apiKey = process.env.DAILY_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'DAILY_API_KEY not set in Netlify env vars' }) }
  }

  try {
    const { roomKey, isHost, displayName } = JSON.parse(event.body || '{}')
    if (!roomKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'roomKey is required' }) }
    }

    const roomName = `griffin-${roomKey}`.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40)

    let roomUrl
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (getRes.ok) {
      const room = await getRes.json()
      roomUrl = room.url
    } else {
      const createRes = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'private',
          properties: {
            exp: Math.round(Date.now() / 1000) + 60 * 60 * 6,
            enable_chat: true,
            enable_screenshare: true,
            max_participants: 50,
          },
        }),
      })
      if (!createRes.ok) {
        const errBody = await createRes.text()
        return { statusCode: 500, body: JSON.stringify({ error: 'Daily room creation failed', details: errBody }) }
      }
      const room = await createRes.json()
      roomUrl = room.url
    }

    let token = null
    if (isHost) {
      const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            is_owner: true,
            user_name: displayName || 'Host',
          },
        }),
      })
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json()
        token = tokenData.token
      }
    }

    return { statusCode: 200, body: JSON.stringify({ url: roomUrl, token }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
