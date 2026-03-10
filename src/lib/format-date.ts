/**
 * Format date consistently for server and client to avoid hydration errors
 * Uses ISO format which is timezone-independent
 */

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  
  // Use ISO string and format it consistently
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatDateShort(date: Date | null | undefined): string {
  if (!date) return "—";
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
