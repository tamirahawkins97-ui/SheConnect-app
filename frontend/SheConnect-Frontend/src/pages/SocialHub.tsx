import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Smile,
  Sparkles,
  Users,
  X,
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

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';

  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return time;

  const day = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  return `${day} · ${time}`;
}

function initials(name?: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('') || '♡';
}

function SocialHub() {
  const navigate = useNavigate();
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
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [communityUsers, setCommunityUsers] = useState<ChatPerson[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [peopleError, setPeopleError] = useState('');
  const [newConversationType, setNewConversationType] = useState<ConversationType>('direct');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [createConversationError, setCreateConversationError] = useState('');
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
        const loadedMessages = conversation.messages || [];
        setMessages(loadedMessages);
        setMessagesConversationId(activeId);
        setMessageFailure(null);

        const unreadIncoming = loadedMessages.filter(
          (message) => senderId(message.sender) !== currentUserId && !message.read
        );
        if (unreadIncoming.length === 0) return;

        Promise.all(
          unreadIncoming.map((message) =>
            apiFetch<{ message: string }>(
              `/api/conversations/${encodeURIComponent(activeId)}/messages/${encodeURIComponent(message._id)}/read`,
              { method: 'PATCH' }
            )
          )
        )
          .then(() => {
            if (!active) return;
            const readIds = new Set(unreadIncoming.map((message) => message._id));
            setMessages((items) => items.map((message) => readIds.has(message._id) ? { ...message, read: true } : message));
            setConversations((items) =>
              items.map((item) => item._id === activeId ? { ...item, unreadCount: 0 } : item)
            );
          })
          .catch((readError: unknown) => {
            if (active) {
              setMessageFailure({
                conversationId: activeId,
                message: readError instanceof Error ? readError.message : 'Messages loaded, but read receipts could not be updated.',
              });
            }
          });
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
    if (!newMessageOpen) return;

    let active = true;
    setLoadingPeople(true);
    setPeopleError('');
    apiFetch<ChatPerson[]>('/api/users')
      .then((items) => {
        if (active) setCommunityUsers(items);
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setPeopleError(fetchError instanceof Error ? fetchError.message : 'Unable to load community members.');
        }
      })
      .finally(() => {
        if (active) setLoadingPeople(false);
      });

    return () => {
      active = false;
    };
  }, [newMessageOpen]);

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
  const filteredPeople = useMemo(() => {
    const term = peopleSearch.trim().toLocaleLowerCase();
    if (!term) return communityUsers;
    return communityUsers.filter((person) => person.username.toLocaleLowerCase().includes(term));
  }, [communityUsers, peopleSearch]);

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

  function toggleRecipient(userId: string) {
    setSelectedRecipientIds((selectedIds) => {
      if (selectedIds.includes(userId)) {
        return selectedIds.filter((id) => id !== userId);
      }
      return newConversationType === 'direct' ? [userId] : [...selectedIds, userId];
    });
  }

  async function handleCreateConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingConversation) return;

    if (newConversationType === 'direct' && selectedRecipientIds.length !== 1) {
      setCreateConversationError('Choose one person to start a direct message.');
      return;
    }
    if (newConversationType === 'group' && selectedRecipientIds.length < 2) {
      setCreateConversationError('Choose at least two people for a group conversation.');
      return;
    }
    if (newConversationType === 'group' && !newGroupTitle.trim()) {
      setCreateConversationError('Add a name for your group conversation.');
      return;
    }

    setCreatingConversation(true);
    setCreateConversationError('');
    try {
      const conversation = await apiFetch<ConversationSummary>('/api/conversations', {
        method: 'POST',
        body: newConversationType === 'direct'
          ? { type: 'direct', recipientId: selectedRecipientIds[0] }
          : { type: 'group', participantIds: selectedRecipientIds, groupTitle: newGroupTitle.trim() },
      });

      setConversations((items) => [
        conversation,
        ...items.filter((item) => item._id !== conversation._id),
      ]);
      setMessages([]);
      setMessagesConversationId(null);
      setActiveId(conversation._id);
      setNewMessageOpen(false);
      setSelectedRecipientIds([]);
      setNewGroupTitle('');
      setPeopleSearch('');
    } catch (createError) {
      setCreateConversationError(createError instanceof Error ? createError.message : 'Unable to start this conversation.');
    } finally {
      setCreatingConversation(false);
    }
  }

  return (
    <main className="social-hub-page glam-page min-h-[calc(100vh-5rem)] px-4 py-7 text-zinc-700 sm:px-6 lg:px-8">
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
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3 py-2 text-xs font-medium text-zinc-500 shadow-sm transition hover:scale-105 hover:bg-white hover:text-rose-600 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95"
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="Open settings"
            title="Settings"
          >
            <Settings size={15} className="text-rose-400" aria-hidden="true" />
            Settings
          </button>
        </header>

        <div className="social-hub-panel grid min-h-[min(72vh,760px)] overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/75 shadow-[0_10px_30px_rgba(244,63,94,0.06)] backdrop-blur-xl md:grid-cols-[330px_minmax(0,1fr)]">
          <aside className={`${activeId ? 'hidden md:flex' : 'flex'} min-h-[min(72vh,760px)] flex-col border-b border-rose-100/80 bg-white/70 md:border-b-0 md:border-r`}>
            <div className="border-b border-rose-100/80 px-5 pb-4 pt-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-glam text-xl font-semibold text-zinc-800">Messages</h2>
                  <p className="mt-0.5 text-xs text-zinc-400">Your circle, all in one place</p>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95"
                  type="button"
                  onClick={() => {
                    setCreateConversationError('');
                    setNewMessageOpen(true);
                  }}
                >
                  <Plus size={15} aria-hidden="true" />
                  <span className="hidden sm:inline">New message</span>
                  <span className="sm:hidden">New</span>
                </button>
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

                <div className="chat-message-list flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7">
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
                          <div className={`chat-message-bubble rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                            isMine
                              ? 'chat-message-sent rounded-br-none bg-gradient-to-br from-rose-400 to-pink-500 text-white'
                              : 'chat-message-received rounded-bl-none border border-rose-100 bg-white text-zinc-700'
                          } ${message.pending ? 'opacity-70' : ''}`}>
                            {message.text}
                          </div>
                          <div className={`chat-message-status mt-1 flex items-center gap-1 px-1 text-[10px] text-zinc-400 ${isMine ? 'justify-end' : ''}`}>
                            <time dateTime={message.createdAt} className={isMine ? 'chat-message-time-sent' : ''}>
                              {isMine ? `Sent ${formatMessageTime(message.createdAt)}` : formatMessageTime(message.createdAt)}
                            </time>
                            {isMine && (message.read ? <CheckCheck size={12} className="text-rose-400" /> : <Check size={12} />)}
                            {message.pending && <span>Sending…</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>

                <div className="chat-composer sticky bottom-0 border-t border-rose-100/80 bg-white/90 px-3 pb-3 pt-3 backdrop-blur-lg sm:px-5">
                  {messageError && visibleMessages.length > 0 && <p className="mb-2 px-2 text-xs text-rose-600" role="alert">{messageError}</p>}
                  <form className="chat-composer-form flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/50 p-1.5 pl-4 shadow-inner transition focus-within:border-rose-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-100/60" onSubmit={handleSend}>
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

        {newMessageOpen && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-zinc-900/30 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !creatingConversation) setNewMessageOpen(false);
            }}
          >
            <section
              className="w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-rose-100/80 bg-white shadow-[0_20px_60px_rgba(124,45,75,0.18)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-message-title"
            >
              <header className="flex items-start justify-between border-b border-rose-100/80 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400">A new connection</p>
                  <h2 id="new-message-title" className="mt-1 font-glam text-xl font-semibold text-zinc-800">Start a message</h2>
                </div>
                <button
                  className="grid size-9 place-items-center rounded-full text-zinc-400 transition hover:scale-105 hover:bg-rose-50 hover:text-rose-600 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95"
                  type="button"
                  onClick={() => setNewMessageOpen(false)}
                  disabled={creatingConversation}
                  aria-label="Close new message"
                >
                  <X size={18} />
                </button>
              </header>

              <form onSubmit={handleCreateConversation}>
                <div className="space-y-4 px-5 py-5 sm:px-6">
                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold text-zinc-600">Conversation type</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(['direct', 'group'] as const).map((type) => (
                        <button
                          className={`rounded-full border px-4 py-2.5 text-sm font-medium transition hover:scale-[1.02] active:scale-95 ${
                            newConversationType === type
                              ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-sm'
                              : 'border-rose-100 bg-white text-zinc-500 hover:bg-rose-50/60'
                          }`}
                          key={type}
                          type="button"
                          onClick={() => {
                            setNewConversationType(type);
                            setSelectedRecipientIds([]);
                            setCreateConversationError('');
                          }}
                          aria-pressed={newConversationType === type}
                        >
                          {type === 'direct' ? 'One-to-one' : 'Group'}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {newConversationType === 'group' && (
                    <label className="block text-xs font-semibold text-zinc-600">
                      Group name
                      <input
                        className="mt-2 h-11 w-full rounded-2xl border border-rose-100 bg-rose-50/30 px-4 text-sm font-normal text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100/70"
                        value={newGroupTitle}
                        onChange={(event) => setNewGroupTitle(event.target.value)}
                        placeholder="e.g. Due Date Daydreamers"
                        maxLength={100}
                        required
                      />
                    </label>
                  )}

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-zinc-600" htmlFor="new-message-people-search">
                      {newConversationType === 'direct' ? 'Choose a person' : 'Choose at least two people'}
                    </label>
                    <div className="flex h-10 items-center gap-2 rounded-full border border-rose-100 bg-rose-50/40 px-3 text-zinc-400 focus-within:border-rose-300 focus-within:bg-white">
                      <Search size={15} aria-hidden="true" />
                      <input
                        id="new-message-people-search"
                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                        type="search"
                        value={peopleSearch}
                        onChange={(event) => setPeopleSearch(event.target.value)}
                        placeholder="Search community"
                      />
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-rose-100/80 bg-rose-50/20 p-1.5">
                    {loadingPeople ? (
                      <p className="p-5 text-center text-sm text-zinc-400">Finding your community…</p>
                    ) : peopleError ? (
                      <p className="p-5 text-center text-sm text-rose-700" role="alert">{peopleError}</p>
                    ) : filteredPeople.length === 0 ? (
                      <p className="p-5 text-center text-sm text-zinc-400">No community members found.</p>
                    ) : (
                      filteredPeople.map((person) => {
                        const checked = selectedRecipientIds.includes(person._id);
                        return (
                          <label
                            className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                              checked ? 'bg-white shadow-sm ring-1 ring-rose-100' : 'hover:bg-white/80'
                            }`}
                            key={person._id}
                          >
                            <input
                              className="size-4 accent-rose-500"
                              type={newConversationType === 'direct' ? 'radio' : 'checkbox'}
                              name="conversation-recipient"
                              checked={checked}
                              onChange={() => toggleRecipient(person._id)}
                            />
                            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100 text-xs font-semibold text-rose-600">
                              {initials(person.username)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-700">{person.username}</span>
                            {checked && <Check size={15} className="text-rose-500" aria-hidden="true" />}
                          </label>
                        );
                      })
                    )}
                  </div>

                  {createConversationError && (
                    <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">{createConversationError}</p>
                  )}
                </div>

                <footer className="flex justify-end gap-2 border-t border-rose-100/80 bg-rose-50/25 px-5 py-4 sm:px-6">
                  <button
                    className="rounded-full px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:scale-105 hover:bg-white hover:text-zinc-700 active:scale-95"
                    type="button"
                    onClick={() => setNewMessageOpen(false)}
                    disabled={creatingConversation}
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    type="submit"
                    disabled={creatingConversation || loadingPeople || peopleError !== ''}
                  >
                    <Send size={14} aria-hidden="true" />
                    {creatingConversation ? 'Starting…' : 'Start conversation'}
                  </button>
                </footer>
              </form>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

export default SocialHub;
