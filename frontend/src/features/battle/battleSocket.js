import { io } from 'socket.io-client'
import api from '../../shared/api/axios'

let socket = null

export const connectBattleSocket = async () => {
  if (socket?.connected) return socket

  // get fresh token from backend
  let token = null
  try {
    const res = await api.get('/auth/token')
    token = res.data.token
  } catch (err) {
    console.error('Failed to get token for socket')
  }

  socket = io('https://codefront.duckdns.org/battle', {
    auth: { token },
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => console.log('Battle socket connected'))
  socket.on('disconnect', () => console.log('Battle socket disconnected'))
  socket.on('connect_error', (err) => console.error('Battle socket error:', err.message))

  return socket
}

export const getBattleSocket = () => socket

export const disconnectBattleSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}