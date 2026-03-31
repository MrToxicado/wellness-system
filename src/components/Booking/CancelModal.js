import React, { useState } from 'react';
import useBookingStore from '../../store/bookingStore';
import useUIStore from '../../store/uiStore';
import sharedStyles from '../../styles/shared.module.css';
import styles from './CancelModal.module.css';

const CancelModal = () => {
  const [cancelType, setCancelType] = useState('normal');

  const selectedBooking = useBookingStore(s => s.selectedBooking);
  const cancelBooking = useBookingStore(s => s.cancelBooking);
  const isSaving = useBookingStore(s => s.isSaving);

  const isCancelModalOpen = useUIStore(s => s.isCancelModalOpen);
  const closeCancelModal = useUIStore(s => s.closeCancelModal);
  const closePanel = useUIStore(s => s.closePanel);
  const showSuccess = useUIStore(s => s.showSuccess);
  const showError = useUIStore(s => s.showError);

  const handleNext = async () => {
    if (cancelType === 'delete') {
      showError('Bookings with a deposit cannot be deleted. Please cancel instead.');
      return;
    }
    const reason = cancelType === 'noshow' ? 'No Show' : 'Normal Cancellation';
    // Get the booking_item id from the nested structure
    const itemGroups = selectedBooking.booking_item ?? {};
    const firstItem = Object.values(itemGroups).flat()[0];
    const bookingItemId = firstItem?.id;
    const result = await cancelBooking(selectedBooking.id, bookingItemId, reason);
    if (result.success) {
      showSuccess('Booking cancelled successfully');
      closeCancelModal();
      closePanel();
    } else {
      showError(result.error || 'Failed to cancel booking');
    }
  };

  const handleClose = () => {
    closeCancelModal();
    setCancelType('normal');
  };

  if (!isCancelModalOpen) return null;

  const RadioOption = ({ value, label, description }) => (
    <div
      className={`${styles.option} ${description ? styles.optionLast : ''}`}
      onClick={() => setCancelType(value)}
    >
      <div className={`${styles.radioBtn} ${cancelType === value ? styles.radioBtnChecked : ''}`}>
        {cancelType === value && <div className={styles.radioDot} />}
      </div>
      <div>
        <span className={`${styles.optionLabel} ${cancelType === value ? styles.optionLabelActive : ''}`}>
          {label}
        </span>
        {description && <p className={styles.optionDescription}>{description}</p>}
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <div className={sharedStyles.overlayDark} onClick={handleClose} />

      {/* Modal */}
      <div className={styles.modal}>
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>Cancel / Delete Booking</h2>
          <p className={styles.subtitle}>Please select the cancellation type.</p>

          {/* Options */}
          <div>
            <RadioOption value="normal" label="Normal Cancellation" />
            <RadioOption value="noshow" label="No Show" />
            <RadioOption
              value="delete"
              label="Just Delete It"
              description="Bookings with a deposit cannot be deleted. Please cancel instead to retain a proper record."
            />
          </div>

          {/* Buttons */}
          <div className={styles.btnRow}>
            <button onClick={handleClose} className={sharedStyles.btnSecondary}>Cancel</button>
            <button
              onClick={handleNext}
              disabled={isSaving}
              className={`${sharedStyles.btnPrimary} ${styles.nextBtn}`}
            >{isSaving ? 'Processing...' : 'Next'}</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CancelModal;
