import API from './index'

export const listBucket = () => API.get('/api/bucket')
export const pushBucket = (formData, config = {}) => API.post('/api/bucket/push', formData, config)
export const pullBucket = (id) => API.get(`/api/bucket/pull/${id}`)
export const deleteBucket = (id) => API.delete(`/api/bucket/delete/${id}`)
