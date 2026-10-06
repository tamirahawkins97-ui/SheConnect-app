import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Smile,
  Sparkles,
  Users,
} from 'lucide-react';
import type { ConversationType, User } from '../types';
import { apiFetch } from '../utils/api';
import { decodeToken } from '../utils/auth';

type ChatPerson = Pick<User, '_id' | 'username'>;
type ChatMessage = {
  _id: string;
  sender: ChatPerson | string;
  text: string;
  read: boolean;
  createdAt: string;
  pending?: boolean;
};
type ConversationSummary = {
  _id: string;
  type: ConversationType;
  groupTitle?: string;
  participant: ChatPerson | null;
  participants: ChatPerson[];
  lastMessage: Pick<ChatMessage, '_id' | 'text' | 'sender' | 'createdAt'> | null;
  unreadCount: number;
  updatedAt: string;
};
type ConversationDetails = {
  _id: string;
  type: ConversationType;
  groupTitle?: string;
  participants: ChatPerson[];
  messages: ChatMessage[];
};

function senderId(sender: ChatMessage['sender']): string {
  return typeof sender === 'string' ? sender : sender?._id || '';
}

function formatTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function initials(name?: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('') || '♡';
}

function SocialHub() {
  const [searchParams] = useSearchParams();
  const requestedUserId = searchParams.get('userId');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesConversationId, setMessagesConversationId] = useState<string | null>(null);
  const [messageFailure, setMessageFailure] = useState<{ conversationId: string; message: string } | null>(null);
  const tokenPayload = decodeToken();
  const currentUserClaim = tokenPayload?._id || tokenPayload?.id;
  const currentUserId = typeof currentUserClaim === 'string' ? currentUserClaim : '';
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const loadingMessages = activeId !== null && messagesConversationId !== activeId;
  const visibleMessages = useMemo(
    () => activeId && messagesConversationId === activeId ? messages : [],
    [activeId, messages, messagesConversationId]
  );
  const messageError = activeId && messageFailure?.conversationId === activeId
    ? messageFailure.message
    : '';

  useEffect(() => {
    let active = true;
    apiFetch<ConversationSummary[]>('/api/conversations')
      .then((items) => {
        if (!active) return;
        setConversations(items);
        if (requestedUserId) {
          const matchingConversation = items.find((item) =>
            item.participant?._id === requestedUserId
          );
          setActiveId(matchingConversation?._id || null);
        } else {
          setActiveId((selected) => selected || items[0]?._id || null);
        }
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'We couldn’t load your conversations.');
        }
      })
      .finally(() => {
        if (active) setLoadingThreads(false);
      });

    return () => {
      active = false;
    };
  }, [requestedUserId]);

  useEffect(() => {
    if (!activeId) {
      return;
    }

    let active = true;
    apiFetch<ConversationDetails>(`/api/conversations/${encodeURIComponent(activeId)}/messages`)
      .then((conversation) => {
        if (!active) return;
        setMessages(conversation.messages || []);
        setMessagesConversationId(activeId);
        setMessageFailure(null);
        setConversations((items) =>
          items.map((item) => item._id === activeId ? { ...item, unreadCount: 0 } : item)
        );
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setMessages([]);
          setMessagesConversationId(activeId);
          setMessageFailure({
            conversationId: activeId,
            message: fetchError instanceof Error ? fetchError.message : 'We couldn’t open this conversation.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [activeId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [visibleMessages, activeId]);

  const selected = conversations.find((conversation) => conversation._id === activeId) || null;
  const selectedName = selected?.type === 'group'
    ? selected.groupTitle || 'Your group'
    : selected?.participant?.username || 'Your conversation';

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) => {
      const name = conversation.type === 'group'
        ? conversation.groupTitle || ''
        : conversation.participant?.username || '';
      return name.toLocaleLowerCase().includes(term) ||
        conversation.lastMessage?.text.toLocaleLowerCase().includes(term);
    });
  }, [conversations, search]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeId || sending) return;

    const conversationId = activeId;
    const optimisticId = `pending-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      _id: optimisticId,
      sender: currentUserId,
      text,
      read: false,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((items) => [...items, optimisticMessage]);
    setConversations((items) =>
      items.map((item) =>
        item._id === conversationId
          ? { ...item, lastMessage: { _id: optimisticId, text, sender: currentUserId, createdAt: optimisticMessage.createdAt }, updatedAt: optimisticMessage.createdAt }
          : item
      )
    );
    setDraft('');
    setSending(true);
    setMessageFailure(null);

    try {
      const savedMessage = await apiFetch<ChatMessage>(
        `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
        { method: 'POST', body: { text } }
      );
      setMessages((items) => items.map((item) => item._id === optimisticId ? savedMessage : item));
      setConversations((items) =>
        items.map((item) =>
          item._id === conversationId
            ? { ...item, lastMessage: { _id: savedMessage._id, text: savedMessage.text, sender: savedMessage.sender, createdAt: savedMessage.createdAt }, updatedAt: savedMessage.createdAt }
            : item
        )
      );
    } catch (sendError) {
      setMessages((items) => items.filter((item) => item._id !== optimisticId));
      setConversations((items) =>
        items.map((item) =>
          item._id === conversationId
            ? { ...item, lastMessage: visibleMessages.length ? { _id: visibleMessages[visibleMessages.length - 1]._id, text: visibleMessages[visibleMessages.length - 1].text, sender: visibleMessages[visibleMessages.length - 1].sender, createdAt: visibleMessages[visibleMessages.length - 1].createdAt } : null }
            : item
        )
      );
      setDraft(text);
      setMessageFailure({
        conversationId,
        message: sendError instanceof Error ? sendError.message : 'Your message could not be sent. Please try again.',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(ellipse_at_top_left,_rgba(255,228,230,0.62),_transparent_42%),linear-gradient(145deg,#fffdfc_0%,#fff7f7_52%,#fffaf4_100%)] px-4 py-7 text-zinc-700 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-100/80 bg-white/75 px-3 py-1.5 text-xs font-medium tracking-wide text-rose-500 shadow-sm">
              <Sparkles size={14} aria-hidden="true" />
              YOUR SHECONNECT CIRCLE
            </div>
            <h1 className="font-glam text-3xl font-semibold tracking-tight text-zinc-800 sm:text-4xl">A little closer, even from afar.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">A soft place to check in, share the little things, and show up for one another.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3 py-2 text-xs text-zinc-500 shadow-sm sm:flex">
            <span className="size-2 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
            Your community is here
          </div>
        </header>

        <div className="grid min-h-[min(72vh,760px)] overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/75 shadow-[0_10px_30px_rgba(244,63,94,0.06)] backdrop-blur-xl md:grid-cols-[330px_minmax(0,1fr)]">
          <aside className={`${activeId ? 'hidden md:flex' : 'flex'} min-h-[min(72vh,760px)] flex-col border-b border-rose-100/80 bg-white/70 md:border-b-0 md:border-r`}>
            <div className="border-b border-rose-100/80 px-5 pb-4 pt-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-glam text-xl font-semibold text-zinc-800">Messages</h2>
                  <p className="mt-0.5 text-xs text-zinc-400">Your circle, all in one place</p>
                </div>
                <span className="grid size-10 place-items-center rounded-2xl bg-rose-50 text-rose-400">
                  <Heart size={18} aria-hidden="true" />
                </span>
              </div>
              <label className="flex h-11 items-center gap-2.5 rounded-full border border-rose-100 bg-rose-50/50 px-4 text-zinc-400 transition focus-within:border-rose-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-100/60">
                <Search size={16} aria-hidden="true" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find a conversation"
                  aria-label="Find a conversation"
                />
              </label>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto p-3">
              {loadingThreads && (
                <div className="space-y-2 p-1" aria-label="Loading conversations">
                  {[0, 1, 2, 3].map((item) => (
                    <div className="flex animate-pulse items-center gap-3 rounded-2xl p-3" key={item}>
                      <div className="size-12 rounded-full bg-rose-100/80" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded-full bg-rose-100" />
                        <div className="h-2.5 w-full rounded-full bg-zinc-100" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingThreads && error && (
                <div className="m-2 rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-sm text-rose-700" role="alert">
                  <p className="font-semibold">We couldn’t load your messages.</p>
                  <p className="mt-1 text-xs leading-5">{error}</p>
                </div>
              )}

              {!loadingThreads && !error && conversations.length === 0 && (
                <div className="mx-auto flex max-w-[245px] flex-col items-center px-3 py-12 text-center">
                  <span className="mb-4 grid size-14 place-items-center rounded-[1.25rem] bg-rose-50 text-rose-400">
                    <MessageCircle size={24} aria-hidden="true" />
                  </span>
                  <h3 className="font-glam text-lg font-semibold text-zinc-700">Your circle starts here</h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">When a conversation finds its way to you, you’ll find it here. Every lovely connection begins with a hello.</p>
                </div>
              )}

              {!loadingThreads && !error && conversations.length > 0 && filteredConversations.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-zinc-400">No conversations match that search.</p>
              )}

              {!loadingThreads && filteredConversations.map((conversation, index) => {
                const name = conversation.type === 'group'
                  ? conversation.groupTitle || 'Your group'
                  : conversation.participant?.username || 'SheConnect member';
                const isSelected = activeId === conversation._id;
                const isOwnLastMessage = conversation.lastMessage
                  ? senderId(conversation.lastMessage.sender) === currentUserId
                  : false;
                const palette = ['bg-rose-100 text-rose-600', 'bg-orange-100 text-orange-700', 'bg-fuchsia-100 text-fuchsia-700', 'bg-pink-100 text-pink-700'][index % 4];

                return (
                  <button
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 hover:scale-[1.01] hover:bg-rose-50/70 ${
                      isSelected ? 'border-rose-100 bg-rose-50/80 shadow-sm' : 'border-transparent bg-transparent'
                    }`}
                    key={conversation._id}
                    type="button"
                    onClick={() => setActiveId(conversation._id)}
                    aria-pressed={isSelected}
                  >
                    <span className={`relative grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold ring-4 ring-white ${palette}`}>
                      {conversation.type === 'group' ? <Users size={19} aria-hidden="true" /> : initials(name)}
                      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-400" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${conversation.unreadCount ? 'font-semibold text-zinc-800' : 'font-medium text-zinc-700'}`}>{name}</span>
                        <span className="shrink-0 text-[10px] text-zinc-400">{formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1 truncate text-xs text-zinc-500">
                          {isOwnLastMessage && <CheckCheck size={13} className="shrink-0 text-rose-400" aria-label="You sent the last message" />}
                          <span className="truncate">{conversation.lastMessage?.text || 'Send a little hello…'}</span>
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-rose-100/80 px-5 py-3 text-[11px] text-zinc-400">
              A little kindness goes a long way <span className="text-rose-400">♡</span>
            </div>
          </aside>

          <section className={`${activeId ? 'flex' : 'hidden md:flex'} min-h-[min(72vh,760px)] min-w-0 flex-col bg-[linear-gradient(180deg,rgba(255,250,250,0.8),rgba(255,255,255,0.9))]`}>
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <span className="mb-4 grid size-16 place-items-center rounded-[1.5rem] border border-rose-100 bg-white text-rose-300 shadow-[0_10px_30px_rgba(244,63,94,0.06)]">
                  <Heart size={27} aria-hidden="true" />
                </span>
                <h2 className="font-glam text-2xl font-semibold text-zinc-700">A little room for connection</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Choose a conversation to catch up, or come back when your circle has a new hello for you.</p>
              </div>
            ) : (
              <>
                <header className="flex min-h-[76px] items-center gap-3 border-b border-rose-100/80 bg-white/65 px-4 sm:px-6">
                  <button className="grid size-9 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:scale-105 hover:bg-rose-50 md:hidden" type="button" onClick={() => setActiveId(null)} aria-label="Back to conversations">
                    <ArrowLeft size={18} />
                  </button>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100 text-sm font-semibold text-rose-600 ring-2 ring-white">
                    {selected.type === 'group' ? <Users size={18} aria-hidden="true" /> : initials(selectedName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-glam text-lg font-semibold text-zinc-800">{selectedName}</h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      {selected.type === 'group' ? `${selected.participants.length} in your circle` : 'Here for a little chat'}
                    </p>
                  </div>
                  <button className="grid size-9 place-items-center rounded-full text-zinc-400 transition hover:scale-105 hover:bg-rose-50 hover:text-rose-500" type="button" aria-label="More conversation options">
                    <MoreHorizontal size={20} />
                  </button>
                </header>

                <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7">
                  <div className="flex justify-center">
                    <span className="rounded-full border border-rose-100/80 bg-white/80 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-400">A SAFE SPACE TO BE YOU</span>
                  </div>

                  {loadingMessages && (
                    <div className="space-y-5 py-3" aria-label="Loading messages">
                      <div className="h-14 w-3/5 animate-pulse rounded-2xl rounded-bl-none bg-white shadow-sm" />
                      <div className="ml-auto h-12 w-1/2 animate-pulse rounded-2xl rounded-br-none bg-rose-100" />
                      <div className="h-16 w-2/3 animate-pulse rounded-2xl rounded-bl-none bg-white shadow-sm" />
                    </div>
                  )}

                  {!loadingMessages && messageError && visibleMessages.length === 0 && (
                    <div className="mx-auto max-w-sm rounded-2xl border border-rose-100 bg-white p-4 text-center text-sm text-rose-700" role="alert">
                      <p className="font-medium">This conversation needs a moment.</p>
                      <p className="mt-1 text-xs text-zinc-500">{messageError}</p>
                    </div>
                  )}

                  {!loadingMessages && !messageError && visibleMessages.length === 0 && (
                    <div className="flex min-h-48 flex-col items-center justify-center text-center">
                      <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-400"><Heart size={20} /></span>
                      <h3 className="font-glam text-lg font-medium text-zinc-700">A fresh little beginning</h3>
                      <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">No messages here just yet. A simple hello can be the start of something lovely.</p>
                    </div>
                  )}

                  {!loadingMessages && visibleMessages.map((message) => {
                    const isMine = senderId(message.sender) === currentUserId;
                    const senderName = typeof message.sender === 'string' ? selectedName : message.sender.username;
                    return (
                      <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`} key={message._id}>
                        {!isMine && <span className="mb-1 grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-100 to-rose-100 text-[9px] font-semibold text-rose-600">{initials(senderName)}</span>}
                        <div className={`max-w-[82%] sm:max-w-[72%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                          <p className={`mb-1 px-1 text-[10px] text-zinc-400 ${isMine ? 'text-right' : ''}`}>{isMine ? 'You' : senderName}</p>
                          <div className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                            isMine
                              ? 'rounded-br-none bg-gradient-to-br from-rose-400 to-pink-500 text-white'
                              : 'rounded-bl-none border border-rose-100 bg-white text-zinc-700'
                          } ${message.pending ? 'opacity-70' : ''}`}>
                            {message.text}
                          </div>
                          <div className={`mt-1 flex items-center gap-1 px-1 text-[10px] text-zinc-400 ${isMine ? 'justify-end' : ''}`}>
                            <span>{formatTime(message.createdAt)}</span>
                            {isMine && (message.read ? <CheckCheck size={12} className="text-rose-400" /> : <Check size={12} />)}
                            {message.pending && <span>Sending…</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>

                <div className="sticky bottom-0 border-t border-rose-100/80 bg-white/90 px-3 pb-3 pt-3 backdrop-blur-lg sm:px-5">
                  {messageError && visibleMessages.length > 0 && <p className="mb-2 px-2 text-xs text-rose-600" role="alert">{messageError}</p>}
                  <form className="flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/50 p-1.5 pl-4 shadow-inner transition focus-within:border-rose-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-100/60" onSubmit={handleSend}>
                    <button className="grid size-8 shrink-0 place-items-center rounded-full text-rose-300 transition hover:scale-110 hover:bg-rose-100 hover:text-rose-500" type="button" aria-label="Add a reaction">
                      <Smile size={19} />
                    </button>
                    <input
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Write a little something…"
                      aria-label="Message text"
                      maxLength={5000}
                      disabled={loadingMessages || sending}
                    />
                    <span className="hidden text-[10px] text-zinc-300 sm:inline">{draft.length}/5000</span>
                    <button
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md shadow-rose-200/70 transition duration-200 hover:scale-105 hover:shadow-lg hover:shadow-rose-200/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                      type="submit"
                      aria-label="Send message"
                      disabled={!draft.trim() || sending || loadingMessages}
                    >
                      <Send size={16} className={sending ? 'animate-pulse' : ''} />
                    </button>
                  </form>
                  <p className="mt-2 text-center text-[10px] text-zinc-400">A little love goes a long way <span className="text-rose-400">♡</span></p>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default SocialHub;
