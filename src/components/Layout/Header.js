import React, { memo } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import useBookingStore from '../../store/bookingStore';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import styles from './Header.module.css';

const Header = memo(({ onLoadMockData, onFilterClick }) => {
  const selectedDate = useBookingStore(s => s.selectedDate);
  const setSelectedDate = useBookingStore(s => s.setSelectedDate);
  const fetchBookings = useBookingStore(s => s.fetchBookings);
  const searchQuery = useBookingStore(s => s.searchQuery);
  const setSearchQuery = useBookingStore(s => s.setSearchQuery);

  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const activeTab = useUIStore(s => s.activeTab);
  const setActiveTab = useUIStore(s => s.setActiveTab);
  const dateObj = parseISO(selectedDate);
  const displayDate = format(dateObj, 'EEE, MMM d');
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  const navigate = (dir) => {
    const newDate = dir === 'next' ? addDays(dateObj, 1) : subDays(dateObj, 1);
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    setSelectedDate(newDateStr);
    fetchBookings({ date: newDateStr });
  };

  const goToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setSelectedDate(today);
    fetchBookings({ date: today });
  };

  const NAV_LINKS = ['Home', 'Therapists', 'Sales', 'Clients', 'Transactions', 'Reports'];

  return (
    <header className={styles.header}>
      {/* Top dark brown bar */}
      <div className={styles.topBar}>
        {/* Logo */}
        <div className={styles.logo}>
          Logo
        </div>

        {/* Spacer — pushes nav + icons to the right */}
        <div className={styles.spacer} />

        {/* Nav links */}
        <nav className={styles.nav}>
          {NAV_LINKS.map(link => (
            <a
              key={link}
              href="#"
              className={`${styles.navLink} ${link === activeTab ? styles.navLinkActive : ''}`}
              onClick={e => { e.preventDefault(); setActiveTab(link); }}
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Right icons */}
        <div className={styles.rightIcons}>
          <span className={styles.notifIcon}>🔔</span>
          <div
            onClick={logout}
            title="Logout"
            className={styles.userAvatar}
          >
            {(user?.name || 'U')[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Sub-toolbar */}
      <div className={styles.toolbar}>
        {/* Left: outlet (top) + display (below) */}
        <div className={styles.outletInfo}>
          <div className={styles.outletName}>
            <span className={styles.outletNameText}>Liat Towers</span>
            <span className={styles.outletNameArrow}>▼</span>
          </div>
          <div className={styles.displayRow}>
            <span className={styles.displayText}>Display : 15 Min</span>
            <span className={styles.displayArrow}>▼</span>
          </div>
        </div>

        {/* Right: search → filter → today → date nav → calendar icon → mock data */}
        <div className={styles.toolbarRight}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.6 13.6L9.86669 9.86666M11.1111 6.75555C11.1111 9.16106 9.16109 11.1111 6.75558 11.1111C4.35007 11.1111 2.40002 9.16106 2.40002 6.75555C2.40002 4.35004 4.35007 2.39999 6.75558 2.39999C9.16109 2.39999 11.1111 4.35004 11.1111 6.75555Z" stroke="#111827" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <input
              type="text"
              defaultValue={searchQuery}
              onChange={e => {
                clearTimeout(window._searchTimer);
                window._searchTimer = setTimeout(() => setSearchQuery(e.target.value), 300);
              }}
              placeholder="Search Sales by phone/name"
              className={styles.searchInput}
            />
          </div>

          {/* Filter */}
          <button
            onClick={onFilterClick}
            className={styles.toolbarBtn}
          >
            Filter <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 10.5C11.1529 10.5 11.707 10.9177 11.9131 11.5H13.5C13.7761 11.5 14 11.7239 14 12C14 12.2761 13.7761 12.5 13.5 12.5H11.9131C11.707 13.0823 11.1529 13.5 10.5 13.5C9.67157 13.5 9 12.8284 9 12C9 11.1716 9.67157 10.5 10.5 10.5ZM7.5 11.5C7.77614 11.5 8 11.7239 8 12C8 12.2761 7.77614 12.5 7.5 12.5H2.5C2.22386 12.5 2 12.2761 2 12C2 11.7239 2.22386 11.5 2.5 11.5H7.5ZM5.5 6.5C6.32843 6.5 7 7.17157 7 8C7 8.82843 6.32843 9.5 5.5 9.5C4.84707 9.5 4.29297 9.08234 4.08691 8.5H2.5C2.22386 8.5 2 8.27614 2 8C2 7.72386 2.22386 7.5 2.5 7.5H4.08691C4.29297 6.91766 4.84707 6.5 5.5 6.5ZM13.5 7.5C13.7761 7.5 14 7.72386 14 8C14 8.27614 13.7761 8.5 13.5 8.5H8.5C8.22386 8.5 8 8.27614 8 8C8 7.72386 8.22386 7.5 8.5 7.5H13.5ZM12.5 2.5C13.3284 2.5 14 3.17157 14 4C14 4.82843 13.3284 5.5 12.5 5.5C11.6716 5.5 11 4.82843 11 4C11 3.17157 11.6716 2.5 12.5 2.5ZM9.5 3.5C9.77614 3.5 10 3.72386 10 4C10 4.27614 9.77614 4.5 9.5 4.5H2.5C2.22386 4.5 2 4.27614 2 4C2 3.72386 2.22386 3.5 2.5 3.5H9.5Z" fill="#3C2212" /></svg>
          </button>

          {/* Today */}
          <button
            onClick={goToday}
            className={styles.toolbarBtn}
          >Today</button>

          {/* Date nav */}
          <div className={styles.dateNav}>
            <button
              onClick={() => navigate('prev')}
              className={`${styles.dateNavBtn} ${styles.dateNavBtnPrev}`}
            >‹</button>
            <span className={styles.dateLabel}>
              {displayDate}
            </span>
            <button
              onClick={() => navigate('next')}
              className={`${styles.dateNavBtn} ${styles.dateNavBtnNext}`}
            >›</button>
          </div>

          {/* Calendar icon */}
          <button className={styles.calendarIconBtn}>📅</button>

          {/* Mock data */}
          {onLoadMockData && (
            <button
              onClick={onLoadMockData}
              className={styles.mockBtn}
            >Mock Data</button>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
