import { useEffect, useState } from 'react';

export const useFundingCountdown = () => {
  const [timeRemaining, setTimeRemaining] = useState('00:00:00');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();

      const currentMinutes = now.getUTCMinutes();
      const currentSeconds = now.getUTCSeconds();
      const currentMilliseconds = now.getUTCMilliseconds();

      const secondsUntilNextHour = (60 - currentMinutes - 1) * 60 + (60 - currentSeconds) - 1;

      const actualSecondsRemaining =
        currentMilliseconds < 100 ? secondsUntilNextHour + 1 : secondsUntilNextHour;

      const minutes = Math.floor(actualSecondsRemaining / 60);
      const seconds = actualSecondsRemaining % 60;

      const formattedHours = '00';
      const formattedMinutes = String(minutes).padStart(2, '0');
      const formattedSeconds = String(seconds).padStart(2, '0');

      setTimeRemaining(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return timeRemaining;
};
