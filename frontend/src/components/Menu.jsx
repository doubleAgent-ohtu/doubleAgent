import axios from 'axios';
import { useChatSession } from '../contexts/ChatSessionContext';
import ThemeToggle from './ThemeToggle';

const Menu = ({ onOpenUserGuide }) => {
  const { conversationList, isLoadingConversationList, openChat, startNewChat } = useChatSession();

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      window.location.href = '/';
    }
  };

  const toggleDrawer = () => {
    const cb = document.getElementById('my-drawer-4');
    if (cb) cb.checked = !cb.checked;
  };

  return (
    <div className="bg-base-200 flex flex-col justify-between min-h-full sidebar p-2">
      <div>
        <ul className="menu w-full space-y-1">
          <li>
            <button
              onClick={() => {
                startNewChat();
                const drawer = document.getElementById('my-drawer-4');
                if (drawer) drawer.checked = false;
              }}
              className="gap-3"
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
                  className="inline-block h-5 w-5"
                >
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
              </span>
              <span className="label-text">New Chat</span>
            </button>
          </li>

          <li>
            <button onClick={onOpenUserGuide} className="gap-3">
              <span className="icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="inline-block h-5 w-5"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                </svg>
              </span>
              <span className="label-text">User Guide</span>
            </button>
          </li>

          <li>
            <button onClick={handleLogout} className="gap-3">
              <span className="icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="inline-block h-5 w-5"
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

        {/* LOADING SPINNER */}
        {isLoadingConversationList && (
          <div className="mt-8 flex justify-center opacity-50">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        )}

        {/* Saved Conversations List */}
        {!isLoadingConversationList && conversationList && conversationList.length > 0 && (
          <div className="mt-6 is-drawer-close:hidden px-2">
            <div className="divider divider-start text-xs opacity-60 my-2">
              <span className="font-semibold">Chat History</span>
            </div>
            <div className="w-full space-y-1">
              {conversationList.map((c) => {
                const text = c.conversation_starter || 'Untitled conversation';
                const displayText = text.length > 80 ? text.slice(0, 80) + '...' : text;
                return (
                  <button
                    key={c.id}
                    className="btn btn-ghost btn-sm w-full justify-start text-left normal-case font-normal hover:bg-base-300 active:bg-base-300 rounded-lg p-3 h-auto min-h-12"
                    onClick={() => openChat(c)}
                  >
                    <span className="whitespace-normal wrap-break-word text-xs leading-tight line-clamp-2 overflow-hidden text-ellipsis">
                      {displayText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="m-2 flex flex-col items-end gap-2">
        <ThemeToggle />

        <button
          onClick={toggleDrawer}
          aria-label="Toggle sidebar"
          className="btn btn-ghost btn-circle btn-sm flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2"
            fill="none"
            stroke="currentColor"
            className="inline-block h-5 w-5"
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
