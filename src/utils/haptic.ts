/**
 * Trigger a vibration pattern if the device supports it.
 * Pass a number (ms) for a single pulse, or an array for a pattern
 * of [vibrate, pause, vibrate, ...] durations.
 */
export function haptic(pattern: number | number[]): void {
  navigator.vibrate?.(pattern);
}
