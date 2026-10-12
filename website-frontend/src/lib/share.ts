export async function copyPostLink(postId: string, locale = 'vi'): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const origin = window.location.origin || '';
  const url = `${origin}/${locale}/posts/${postId}`;

  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // Fallback if clipboard permission is denied
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}
