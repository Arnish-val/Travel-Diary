import api from './client';

export const getTrips            = (params)      => api.get('/trips', { params });
export const getTrip             = (id)          => api.get(`/trips/${id}`);
export const createTrip          = (data)        => api.post('/trips', data);
export const updateTrip          = (id, data)    => api.patch(`/trips/${id}`, data);
export const deleteTrip          = (id)          => api.delete(`/trips/${id}`);
export const getTripDestinations = (id)          => api.get(`/trips/${id}/destinations`);
export const addDestination      = (id, data)    => api.post(`/trips/${id}/destinations`, data);
export const removeDestination   = (id, destId)  => api.delete(`/trips/${id}/destinations/${destId}`);
