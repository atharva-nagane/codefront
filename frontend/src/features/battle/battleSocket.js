import { io } from 'socket.io-client'

let socket = null

export const connectBattleSocket = (token) => {
  if (socket?.connected) return socket

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