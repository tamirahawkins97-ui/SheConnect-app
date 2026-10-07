import React from 'react';
import { type Conversation } from '../../types/chat';

interface ChatListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  currentUserId?: string;
  loading?: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  currentUserId,
  loading = false,
}) => {
  return (
    <aside className="w-full md:w-80 border-r border-rose-100 flex flex-col bg-rose-50/20 h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-rose-100/60 flex items-center justify-between">
        <h3 className="font-serif font-bold text-zinc-800 text-sm tracking-wide">
          Direct Messages
        </h3>
        <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
          {conversations.length}
        </span>
      </div>

      {/* Threads Scrollable Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-rose-50/60">
        {loading ? (
          <div className="p-6 text-center text-xs text-zinc-400 animate-pulse">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400 font-light">
            No active chats yet 🌸
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = conv._id === activeId;
            // Filter out current user to get the partner
            const partner = conv.participants?.find((p) => p._id !== currentUserId) || 
                            conv.participants?.[0] || 
                            { name: 'Mama Friend', avatar: '🌸' };

            const initial = partner.username?.[0] || partner.name?.[0] || '✦';

            return (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`w-full p-3.5 flex items-center gap-3 text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-rose-100/50 shadow-inner'
                    : 'hover:bg-rose-50/60 active:scale-[0.99]'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-200 to-pink-100 border border-rose-200 flex items-center justify-center font-serif font-bold text-rose-700 text-sm shadow-inner">
                    {partner.avatar && partner.avatar.length <= 4 ? partner.avatar : initial}
                  </div>
                  <span className="absolute bottom-0 left-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
                </div>

                {/* Preview Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="text-xs font-semibold text-zinc-800 truncate">
                      {partner.username || partner.name}
                    </p>
                    {conv.updatedAt && (
                      <span className="text-[10px] text-zinc-400 shrink-0 ml-1">
                        {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {conv.lastMessage || 'Sent a sparkle...'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};