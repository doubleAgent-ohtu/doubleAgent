import { useState, useRef } from 'react';

const useAlert = () => {
  const [alertIsVisible, setAlertIsVisible] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [alertType, setAlertType] = useState('');
  const timeout = useRef(null);

  const showAlert = (text, type = 'info') => {
    setAlertIsVisible(true);
    setAlertText(text);
    setAlertType(type);

    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      setAlertIsVisible(false);
      setAlertText('');
      setAlertType('');
    }, 5000);
  };

  return { alertIsVisible, alertText, alertType, showAlert };
};

export default useAlert;
