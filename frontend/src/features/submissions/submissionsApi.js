import api from '../../shared/api/axios'

export const getMySubmissions = async (problemId = null, page = 1, limit = 20) => {
  const params = { page, limit }
  if (problemId) params.problemId = problemId
  const res = await api.get('/submissions', { params })
  return res.data
}

export const getSubmissionById = async (id) => {
  const res = await api.get(`/submissions/${id}`)
  return res.data.submission
}