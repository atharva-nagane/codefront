import api from '../../shared/api/axios'

export const getMySubmissions = async (problemId = null) => {
  const params = problemId ? { problemId } : {}
  const res = await api.get('/submissions', { params })
  return res.data.submissions
}

export const getSubmissionById = async (id) => {
  const res = await api.get(`/submissions/${id}`)
  return res.data.submission
}