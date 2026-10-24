// Created/resumed only inside a user gesture; no network, microphone or analytics.
let context: AudioContext | undefined;
export function prepareFeedbackSound() {
 try {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume().catch(() => {});
 } catch { /* Audio is optional; learning must remain usable. */ }
}
export function playSuccessSound() {
 if (!context || context.state !== 'running' || document.hidden) return;
 try {
  const start = context.currentTime;
  [660, 880].forEach((frequency, index) => {
   const oscillator = context!.createOscillator();
   const gain = context!.createGain();
   const at = start + index * .1;
   oscillator.type = 'sine';
   oscillator.frequency.value = frequency;
   gain.gain.setValueAtTime(0, at);
   gain.gain.linearRampToValueAtTime(.055, at + .015);
   gain.gain.exponentialRampToValueAtTime(.001, at + .16);
   oscillator.connect(gain); gain.connect(context!.destination);
   oscillator.start(at); oscillator.stop(at + .18);
   oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
 } catch { /* Never turn an audio failure into an answer failure. */ }
}
