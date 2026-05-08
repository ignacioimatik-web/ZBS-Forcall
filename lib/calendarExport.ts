export interface CalendarEvent {
  summary: string;
  start: Date;
  end?: Date;
  description?: string;
}

export function generateICS(events: CalendarEvent[]): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1) + 'Z';
  };

  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ZBS Forcall//ES\r\nCALSCALE:GREGORIAN\r\n';
  
  events.forEach(event => {
    const uid = `${event.start.getTime()}@zbsforcall`;
    const dtstart = formatDate(event.start);
    const dtend = event.end ? formatDate(event.end) : formatDate(new Date(event.start.getTime() + 3600000)); // +1 hora por defecto
    
    ics += 'BEGIN:VEVENT\r\n';
    ics += `UID:${uid}\r\n`;
    ics += `DTSTART:${dtstart}\r\n`;
    ics += `DTEND:${dtend}\r\n`;
    ics += `SUMMARY:${event.summary}\r\n`;
    if (event.description) {
      ics += `DESCRIPTION:${event.description}\r\n`;
    }
    ics += 'END:VEVENT\r\n';
  });
  
  ics += 'END:VCALENDAR';
  return ics;
}

export function downloadICS(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
