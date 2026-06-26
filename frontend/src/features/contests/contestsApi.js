import api from '../../shared/api/axios'

export const getContests = async () => {
  const res = await api.get('/contests')
  return res.data.contests
}

export const getContest = async (id) => {
  const res = await api.get(`/contests/${id}`)
  return res.data.contest
}

export const registerForContest = async (id) => {
  const res = await api.post(`/contests/${id}/register`)
  return res.data
}

export const unregisterFromContest = async (id) => {
  const res = await api.post(`/contests/${id}/unregister`)
  return res.data
}

export const submitToContest = async (id, data) => {
  const res = await api.post(`/contests/${id}/submit`, data)
  return res.data
}

export const getContestSubmission = async (contestId, submissionId) => {
  const res = await api.get(`/contests/${contestId}/submissions/${submissionId}`)
  return res.data.submission
}

export const getContestLeaderboard = async (id) => {
  const res = await api.get(`/contests/${id}/leaderboard`)
  return res.data
}

export const getMyContestSubmissions = async (id) => {
  const res = await api.get(`/contests/${id}/my-submissions`)
  return res.data.submissions
}

export const createContest = async (data) => {
  const res = await api.post('/contests', data)
  return res.data.contest
}