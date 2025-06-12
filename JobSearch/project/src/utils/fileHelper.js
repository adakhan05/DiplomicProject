/**
 * Преобразует локальный URL в полный URL с IP-адресом сервера
 * @param {string} url - URL для преобразования
 * @returns {string} - Полный URL с IP-адресом вместо localhost
 */
export const getFileUrl = (url) => {
  if (!url) {
    console.error("[fileHelper] URL не предоставлен");
    return "";
  }

  try {
    console.log("[fileHelper] Исходный URL:", url);

    // Создаем URL объект
    const urlObj = new URL(url);

    // Если URL уже содержит полный хост и это не localhost, оставляем как есть
    if (
      urlObj.hostname &&
      !["localhost", "127.0.0.1"].includes(urlObj.hostname)
    ) {
      console.log(
        "[fileHelper] URL уже содержит не-localhost хост, возвращаем как есть:",
        url
      );
      return url;
    }

    // Получаем IP-адрес из window.location (текущего URL страницы)
    const currentHostname = window.location.hostname;
    const currentPort = window.location.port;
    const protocol = window.location.protocol;

    console.log(
      `[fileHelper] Текущие параметры: hostname=${currentHostname}, port=${currentPort}, protocol=${protocol}`
    );

    // Заменяем localhost на IP-адрес
    urlObj.hostname = currentHostname;
    urlObj.protocol = protocol;

    // Добавляем порт, если он есть
    if (currentPort) {
      urlObj.port = currentPort;
    }

    console.log(`[fileHelper] Преобразован URL: ${url} -> ${urlObj.href}`);
    return urlObj.href;
  } catch (error) {
    console.error("[fileHelper] Ошибка при преобразовании URL:", error);
    console.error("[fileHelper] Проблемный URL:", url);

    // Если произошла ошибка при парсинге URL, пробуем простую замену
    try {
      if (url.includes("localhost")) {
        const currentHostname = window.location.hostname;
        const replacement = url.replace("localhost", currentHostname);
        console.log(`[fileHelper] Простая замена: ${url} -> ${replacement}`);
        return replacement;
      }
    } catch (simpleReplaceError) {
      console.error(
        "[fileHelper] Ошибка при простой замене:",
        simpleReplaceError
      );
    }

    // Возвращаем исходный URL в случае ошибки
    return url;
  }
};

export default {
  getFileUrl,
};
