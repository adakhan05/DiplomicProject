/**
 * @param {string} message
 * @param {string} type
 * @param {number} duration
 */
export function showNotification(message, type = "info", duration = 3000) {
  const existingNotifications = document.querySelectorAll(".app-notification");
  existingNotifications.forEach((notif) => {
    if (notif.textContent.trim() === message) {
      notif.remove();
    }
  });

  const notification = document.createElement("div");

  notification.className =
    "app-notification fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg z-50 text-white";

  if (type === "success") {
    notification.className += " bg-green-600";
  } else if (type === "error") {
    notification.className += " bg-red-600";
  } else {
    notification.className += " bg-blue-600";
  }

  let icon = "info";
  if (type === "success") icon = "check_circle";
  if (type === "error") icon = "error";

  notification.innerHTML = `
    <div class="flex items-center">
      <span class="material-icons mr-2">${icon}</span>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  notification.style.opacity = "0";
  notification.style.transform = "translateY(-20px)";
  notification.style.transition = "opacity 0.3s ease, transform 0.3s ease";

  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateY(0)";
  }, 10);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(-20px)";

    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}
