import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { setUser, logout } from '../../store/slices/authSlice'
import { getMe } from '../../features/auth/authApi'

const useAuth = () => {
  const dispatch = useDispatch()
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true

    const checkAuth = async () => {
      try {
        const data = await getMe()
        dispatch(setUser(data.user))
      } catch {
        dispatch(logout())
      }
    }
    checkAuth()
  }, [dispatch])
}

export default useAuth