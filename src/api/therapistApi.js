import { MOCK_THERAPISTS, MOCK_SERVICES, MOCK_ROOMS, MOCK_CLIENTS } from '../data/mockData';

export const fetchTherapists = async () => MOCK_THERAPISTS;

export const fetchTherapistById = async (id) => MOCK_THERAPISTS.find(t => String(t.id) === String(id));

export const fetchServices = async () => MOCK_SERVICES;

export const fetchRooms = async () => MOCK_ROOMS;

export const fetchClients = async () => MOCK_CLIENTS;

export const createClient = async (payload) => {
  return {
    id: Date.now(),
    name: payload.name || payload.first_name || 'Client',
    lastname: payload.lastname || payload.last_name || '',
    phone: payload.phone || '+65 9123 4567',
  };
};
