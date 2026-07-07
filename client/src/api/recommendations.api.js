import api from './client';

export const getRecommendations = (params) => api.get('/recommendations', { params });
export const refreshRecommendations = (params) => api.post('/recommendations/refresh', null, { params });
export const dismissRecommendation = (id) => api.patch(`/recommendations/${id}`, { dismissed: true });
