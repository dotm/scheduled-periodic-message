export function convertTzIdentifierToTzOffset(
  timeZoneName: string | undefined,
): number | undefined {
  if (!timeZoneName) {
    return undefined;
  }
  try {
    const dateFormat = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneName,
      hour12: false,
      timeZoneName: 'shortOffset',
    });

    const parts = dateFormat.formatToParts(new Date());
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (offset?.includes('+')) {
      const [hour, minute] = offset.split('+')[1].split(':');
      return parseInt(hour) + parseInt(minute ?? '0') / 60;
    } else if (offset?.includes('-')) {
      const [hour, minute] = offset.split('-')[1].split(':');
      return -(parseInt(hour) + parseInt(minute ?? '0') / 60);
    } else {
      return 0;
    }
  } catch {
    return undefined;
  }
}
