export const formatDate = (date: string | Date | null | undefined, includeTime = false): string => {
  if (!date) return "-";
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  return new Date(date).toLocaleDateString('es-ES', options);
};
