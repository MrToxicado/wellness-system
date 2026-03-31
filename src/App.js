import React, { useEffect, useCallback, useState, lazy, Suspense } from 'react';
import useAuthStore from './store/authStore';
import useBookingStore from './store/bookingStore';
import useTherapistStore from './store/therapistStore';
import useUIStore from './store/uiStore';
import ErrorBoundary from './components/common/ErrorBoundary';
import ToastContainer from './components/common/Toast';
import Header from './components/Layout/Header';
import LoginPage from './components/Layout/LoginPage';
import { generateMockBookings } from './utils/bookingUtils';
import logger from './utils/logger';
import './index.css';
import appStyles from './App.module.css';
import sharedStyles from './styles/shared.module.css';

// Code-split heavy components — loaded only when first needed
const CalendarBoard = lazy(() => import('./components/Calendar/CalendarBoard'));
const BookingPanel = lazy(() => import('./components/Booking/BookingPanel'));
const CreateBookingModal = lazy(() => import('./components/Booking/CreateBookingModal'));
const EditBookingModal = lazy(() => import('./components/Booking/EditBookingModal'));
const CancelModal = lazy(() => import('./components/Booking/CancelModal'));
const FilterDropdown = lazy(() => import('./components/common/FilterDropdown'));

const MOCK_THERAPISTS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: ['Lily', 'James', 'Emma', 'Lucas', 'Sophia', 'Oliver', 'Ava', 'Noah', 'Isabella', 'Liam',
         'Mia', 'William', 'Charlotte', 'Elijah', 'Amelia', 'Mason', 'Harper', 'Logan', 'Evelyn', 'Aiden'][i],
  gender: i % 3 === 1 ? 'Male' : 'Female',
  specialization: ['Swedish', 'Deep Tissue', 'Hot Stone', 'Aromatherapy', 'Facial'][i % 5],
}));

const PlaceholderPage = ({ title }) => (
  <div className={appStyles.loadingContainer}>
    <span className={appStyles.placeholderEmoji}>🚧</span>
    <span className={appStyles.placeholderTitle}>{title}</span>
    <span className={appStyles.loadingText}>This page is coming soon</span>
  </div>
);

const MainApp = () => {
  const [showFilter, setShowFilter] = useState(false);
  const activeTab = useUIStore(s => s.activeTab);

  const therapists = useTherapistStore(s => s.therapists);
  const fetchTherapists = useTherapistStore(s => s.fetchTherapists);
  const fetchServices = useTherapistStore(s => s.fetchServices);
  const fetchRooms = useTherapistStore(s => s.fetchRooms);
  const fetchClients = useTherapistStore(s => s.fetchClients);
  const loadMockTherapists = useTherapistStore(s => s.loadMockTherapists);

  const fetchBookings = useBookingStore(s => s.fetchBookings);
  const loadMockData = useBookingStore(s => s.loadMockData);
  const setSelectedBooking = useBookingStore(s => s.setSelectedBooking);
  const selectedDate = useBookingStore(s => s.selectedDate);
  const isLoading = useBookingStore(s => s.isLoading);
  const error = useBookingStore(s => s.error);

  const openPanel = useUIStore(s => s.openPanel);
  const openCreateModal = useUIStore(s => s.openCreateModal);

  useEffect(() => {
    const handler = () => useAuthStore.getState().logout();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      logger.info('App initializing data...');
      // Fetch all reference data in parallel
      const [therapistResult] = await Promise.all([
        fetchTherapists(),
        fetchServices(),
        fetchRooms(),
        fetchClients(),
        fetchBookings({ date: selectedDate }),
      ]);
      if (!therapistResult?.length) loadMockTherapists(MOCK_THERAPISTS);
    };
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBookingClick = useCallback((booking) => {
    setSelectedBooking(booking);
    openPanel();
    logger.userAction('view_booking', { id: booking.id });
  }, [setSelectedBooking, openPanel]);

  const handleSlotClick = useCallback((therapist, timeStr) => {
    openCreateModal({ therapist_id: therapist.id, start_time: timeStr, date: selectedDate });
    logger.userAction('click_empty_slot', { therapistId: therapist.id, time: timeStr });
  }, [openCreateModal, selectedDate]);

  const handleLoadMockData = useCallback(() => {
    const activeTherapists = therapists.length ? therapists : MOCK_THERAPISTS;
    if (!therapists.length) loadMockTherapists(MOCK_THERAPISTS);
    const mocks = generateMockBookings(activeTherapists, selectedDate, 2000);
    loadMockData(mocks);
  }, [therapists, selectedDate, loadMockData, loadMockTherapists]);

  const activeTherapists = therapists.length ? therapists : MOCK_THERAPISTS;

  return (
    <div className={appStyles.app}>
      {/* Header with filter button position context */}
      <div className={appStyles.headerWrapper}>
        <Header
          onLoadMockData={handleLoadMockData}
          onFilterClick={() => setShowFilter(v => !v)}
        />
        {showFilter && (
          <div className={appStyles.filterWrapper}>
            <Suspense fallback={null}>
              <FilterDropdown onClose={() => setShowFilter(false)} />
            </Suspense>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className={appStyles.errorBanner}>
          <span>⚠ {error}</span>
          <button onClick={() => useBookingStore.getState().clearError()}
            className={appStyles.errorCloseBtn}>×</button>
        </div>
      )}

      {/* Page content */}
      <div className={appStyles.content}>
        {activeTab !== 'Home' ? (
          <PlaceholderPage title={activeTab} />
        ) : isLoading && !activeTherapists.length ? (
          <div className={appStyles.loadingContainer}>
            <div className={sharedStyles.spinner} />
            <span className={appStyles.loadingText}>Loading schedule...</span>
          </div>
        ) : (
          <ErrorBoundary>
            <Suspense fallback={
              <div className={appStyles.loadingContainer}>
                <div className={sharedStyles.spinner} />
                <span className={appStyles.loadingText}>Loading calendar...</span>
              </div>
            }>
              <CalendarBoard
                therapists={activeTherapists}
                onBookingClick={handleBookingClick}
                onSlotClick={handleSlotClick}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>

      {/* Right panels (overlays) — lazy loaded, no visible fallback needed */}
      <Suspense fallback={null}>
        <BookingPanel />
        <CreateBookingModal />
        <EditBookingModal />
        <CancelModal />
      </Suspense>
      <ToastContainer />
    </div>
  );
};

const App = () => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return (
    <ErrorBoundary>
      {isAuthenticated ? <MainApp /> : <LoginPage />}
    </ErrorBoundary>
  );
};

export default App;
