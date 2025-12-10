import { useEffect, useState } from 'react';
import axios from 'axios';

const Menu = ({ onOpenUserGuide, onSelectConversation, onNewChat }) => {
  const [isDark, setIsDark] = useState(false);
  const [starters, setStarters] = useState([]);
  // initializes theme
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const current = saved || document.documentElement.getAttribute('data-theme') || 'light';
    const darkMode = current === 'dark';
    setIsDark(darkMode);
    document.documentElement.setAttribute('data-theme', current);
    console.log('Theme initialized:', current);
  }, []);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setIsDark(!isDark);
    console.log('Theme toggled to:', next);
  };
  const handleLogout = async () => {
    try {
      try {
        sessionStorage.setItem('postLogoutMessage', 'Chathistory');
      } catch (e) {
        /* ignore */
      }
      const res = await axios.post('/api/logout', {}, { withCredentials: true });
      // Axios doesn't follow redirects automatically for POST, so check response
      if (res.status === 200) {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Logout failed:', err);
      // Even if there's an error, redirect to home
      window.location.href = '/';
    }
  };
  // ensures that there is no page jump when toggling
  const toggleDrawer = () => {
    const cb = document.getElementById('my-drawer-4');
    if (cb) cb.checked = !cb.checked;
  };

  // load user's saved conversations (conversation_starter) to show as starters
  // shared loader for starters (used by initial load and refresh handler)
  const loadStarters = async () => {
    try {
      const res = await fetch('/api/conversations', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data || [];
    } catch (err) {
      console.warn('Failed to fetch conversation starters', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      const data = await loadStarters();
      if (mounted && data) setStarters(data);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // refresh starters when other parts of the app signal updates (e.g. after saving)
  useEffect(() => {
    const handler = async () => {
      const data = await loadStarters();
      if (data) setStarters(data);
    };

    window.addEventListener('conversations:updated', handler);
    return () => window.removeEventListener('conversations:updated', handler);
  }, []);

  return (
    <div className="bg-base-200 flex flex-col justify-between min-h-full sidebar p-2">
      <div>
        <ul className="menu w-full">
          <li>
            <button>
              <span className="icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="inline-block size-4 my-1.5"
                >
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
              </span>
              <span className="label-text">Homepage</span>
            </button>
          </li>

          <li>
            <button
              onClick={() => {
                // dispatch a global event so other components (Conversation/HomePage)
                // can clear selected system prompts and reset their state
                try {
                  window.dispatchEvent(new CustomEvent('new-chat:start'));
                } catch (e) {
                  // ignore if dispatch fails in old browsers
                }

                if (typeof onNewChat === 'function') {
                  onNewChat();
                  return;
                }
                if (typeof onSelectConversation === 'function') {
                  onSelectConversation(null);
                  return;
                }
                console.log('New chat requested');
              }}
            >
              <span className="icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="inline-block h-4 w-4 my-1.5"
                >
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
              </span>
              <span className="label-text">New chat</span>
            </button>
          </li>

          <li>
            <button onClick={onOpenUserGuide}>
              <span className="icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="inline-block size-4 my-1.5"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                </svg>
              </span>
              <span className="label-text">User Guide</span>
            </button>
          </li>

          <li>
            <button>
              <span className="icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="inline-block size-4 my-1.5"
                >
                  <path d="M20 7h-9"></path>
                  <path d="M14 17H5"></path>
                  <circle cx="17" cy="17" r="3"></circle>
                  <circle cx="7" cy="7" r="3"></circle>
                </svg>
              </span>
              <span className="label-text">Settings</span>
            </button>
          </li>

          <li>
            <button onClick={handleLogout}>
              <span className="icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="inline-block size-4 my-1.5"
                >
                  <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"></path>
                  <path d="M9 12h12l-3-3"></path>
                  <path d="M18 15l3-3"></path>
                </svg>
              </span>
              <span className="label-text">Logout</span>
            </button>
          </li>
        </ul>
        {/* Conversation starters under the icons (only visible when menu is expanded) */}
        {starters && starters.length > 0 && (
          <div className="mt-4 is-drawer-close:hidden">
            <p className="label-text text-sm opacity-70 mb-2">Chat history</p>
            <ul className="menu w-full">
              {starters.map((c) => (
                <li key={c.id}>
                  <button
                    className="btn btn-ghost btn-xs w-full justify-start text-sm whitespace-normal break-words"
                    onClick={() => {
                      if (onSelectConversation) onSelectConversation(c);
                      else console.log('open', c.id);
                    }}
                  >
                    {c.conversation_starter && c.conversation_starter.length > 40
                      ? c.conversation_starter.slice(0, 40) + '...'
                      : c.conversation_starter}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="m-2 flex flex-col items-end gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="btn btn-ghost btn-circle btn-sm flex items-center justify-center mr-1"
        >
          {isDark ? (
            <svg
              className="h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleDrawer}
          aria-label="Toggle sidebar"
          className="btn btn-ghost btn-circle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2"
            fill="none"
            stroke="currentColor"
            className="inline-block size-4 my-1.5"
          >
            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
            <path d="M9 4v16"></path>
            <path d="M14 10l2 2l-2 2"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Menu;
