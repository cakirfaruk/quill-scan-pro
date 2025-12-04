// Badge API for displaying unread count on app icon
// Works on supported browsers (Chrome, Edge on desktop, some Android browsers)

/**
 * Update the app badge with a count
 * @param count - Number to display on the badge (0 clears the badge)
 */
export const updateAppBadge = async (count: number): Promise<boolean> => {
  try {
    if (!('setAppBadge' in navigator)) {
      console.log('Badge API not supported');
      return false;
    }

    if (count > 0) {
      await (navigator as any).setAppBadge(count);
      console.log(`📛 Badge updated: ${count}`);
    } else {
      await (navigator as any).clearAppBadge();
      console.log('📛 Badge cleared');
    }
    return true;
  } catch (error) {
    console.error('Error updating app badge:', error);
    return false;
  }
};

/**
 * Clear the app badge
 */
export const clearAppBadge = async (): Promise<boolean> => {
  return updateAppBadge(0);
};

/**
 * Check if Badge API is supported
 */
export const isBadgeApiSupported = (): boolean => {
  return 'setAppBadge' in navigator;
};

/**
 * Update badge based on unread notifications count
 * Call this whenever notifications change
 */
export const syncBadgeWithNotifications = async (unreadCount: number): Promise<void> => {
  await updateAppBadge(unreadCount);
};
