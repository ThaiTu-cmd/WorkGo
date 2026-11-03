// The ONSITE check-in code is returned once, when the order is paid (order-service
// stores only its hash). Keep it in this browser so the client can read it to the
// provider later. Storage can be unavailable (private mode): fail quietly.
const key = (orderId) => `workgo.checkinCode.${orderId}`;

export function saveCheckinCode(orderId, code) {
  try {
    localStorage.setItem(key(orderId), code);
  } catch {
    // The code is still shown once in the payment dialog.
  }
}

export function loadCheckinCode(orderId) {
  try {
    return localStorage.getItem(key(orderId));
  } catch {
    return null;
  }
}
