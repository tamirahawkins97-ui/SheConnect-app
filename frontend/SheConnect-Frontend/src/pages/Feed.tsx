import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Camera,
  Heart,
  MessageCircle,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { User } from '../types';
import { apiFetch } from '../utils/api';
import CommentThread from '../components/feed/CommentThread';

type FeedUser = Pick<User, '_id' | 'username' | 'role' | 'avatar'>;
type CommunityMember = FeedUser & { isActive: boolean };
type FeedPost = {
  _id: string;
  userId: FeedUser | string;
  imageURL?: string;
  message: string;
  Day: number;
  Week: number;
  Trimester: string;
  dueDate: string;
  createdAt: string;
};
type CurrentUserResponse = { message: string; user: FeedUser };
type PostDraft = Pick<FeedPost, 'imageURL' | 'message' | 'Day' | 'Week' | 'Trimester' | 'dueDate'>;

const trimesterOptions = ['1st Trimester', '2nd Trimester', '3rd Trimester', 'Postpartum'];
const emptyDraft: PostDraft = {
  imageURL: '',
  message: '',
  Day: 1,
  Week: 12,
  Trimester: '1st Trimester',
  dueDate: '',
};

function postOwnerId(post: FeedPost): string {
  return typeof post.userId === 'string' ? post.userId : post.userId._id;
}

function postAuthor(post: FeedPost): string {
  return typeof post.userId === 'string' ? 'SheConnect member' : post.userId.username;
}

function formatDueDate(value: string): string {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function PostEditor({
  initialValue,
  title,
  submitLabel,
  submitting,
  error,
  onCancel,
  onSubmit,
}: {
  initialValue: PostDraft;
  title: string;
  submitLabel: string;
  submitting: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (draft: PostDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PostDraft>(initialValue);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      ...draft,
      message: draft.message.trim(),
      imageURL: draft.imageURL?.trim() || '',
    });
  }

  return (
    <form className="rounded-3xl border border-rose-100/80 bg-white p-5 shadow-[0_10px_30px_rgba(244,63,94,0.06)] sm:p-6" onSubmit={handleSubmit}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-400">Your story matters</p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-zinc-800">{title}</h2>
        </div>
        <button className="rounded-full p-2 text-zinc-400 transition hover:scale-105 hover:bg-rose-50 hover:text-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95" type="button" onClick={onCancel} aria-label="Close editor">
          <X size={18} />
        </button>
      </div>

      <label className="mb-4 block text-xs font-semibold text-zinc-600">
        Your message
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-rose-100 bg-rose-50/30 px-4 py-3 text-sm font-normal leading-6 text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100/70"
          value={draft.message}
          onChange={(event) => setDraft({ ...draft, message: event.target.value })}
          placeholder="Share a moment, a thought, or a little win…"
          maxLength={3000}
          required
        />
      </label>

      <label className="mb-5 block text-xs font-semibold text-zinc-600">
        Photo URL <span className="font-normal text-zinc-400">(optional)</span>
        <input
          className="mt-2 h-11 w-full rounded-full border border-rose-100 bg-white px-4 text-sm font-normal text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100/70"
          type="url"
          value={draft.imageURL || ''}
          onChange={(event) => setDraft({ ...draft, imageURL: event.target.value })}
          placeholder="https://…"
        />
      </label>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold text-zinc-600">Your pregnancy journey</legend>
        <label className="text-xs font-medium text-zinc-500">
          Trimester
          <select className="mt-1.5 h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-rose-300" value={draft.Trimester} onChange={(event) => setDraft({ ...draft, Trimester: event.target.value })}>
            {trimesterOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-zinc-500">
          Week
          <input className="mt-1.5 h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-rose-300" type="number" min={1} max={42} value={draft.Week} onChange={(event) => setDraft({ ...draft, Week: Number(event.target.value) })} required />
        </label>
        <label className="text-xs font-medium text-zinc-500">
          Day
          <input className="mt-1.5 h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-rose-300" type="number" min={1} max={7} value={draft.Day} onChange={(event) => setDraft({ ...draft, Day: Number(event.target.value) })} required />
        </label>
        <label className="text-xs font-medium text-zinc-500">
          Due date
          <input className="mt-1.5 h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-rose-300" type="date" value={draft.dueDate ? draft.dueDate.slice(0, 10) : ''} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} required />
        </label>
      </fieldset>

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
      <div className="mt-5 flex justify-end">
        <button className="rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-200/60 transition hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100" type="submit" disabled={submitting || !draft.message.trim()}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function Feed() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<FeedUser | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [activeUsers, setActiveUsers] = useState<CommunityMember[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [usersError, setUsersError] = useState('');
  const [editor, setEditor] = useState<string | null>(null);
  const [editorError, setEditorError] = useState('');
  const [savingPost, setSavingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiFetch<CurrentUserResponse>('/api/users/me')
      .then((response) => {
        if (active) setCurrentUser(response.user);
      })
      .catch((error: unknown) => {
        if (active) setFeedError(error instanceof Error ? error.message : 'Unable to load your account.');
      });

    apiFetch<FeedPost[]>('/api/posts')
      .then((items) => {
        if (active) setPosts(items);
      })
      .catch((error: unknown) => {
        if (active) setFeedError(error instanceof Error ? error.message : 'Unable to load the community feed.');
      })
      .finally(() => {
        if (active) setLoadingPosts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCommunityMembers() {
      try {
        const members = await apiFetch<CommunityMember[]>('/api/users');
        if (active) {
          setActiveUsers(members);
          setUsersError('');
        }
      } catch (error) {
        if (active) {
          setUsersError(error instanceof Error ? error.message : 'Unable to find community members.');
        }
      } finally {
        if (active) setLoadingUsers(false);
      }
    }

    void loadCommunityMembers();
    const intervalId = window.setInterval(() => void loadCommunityMembers(), 30_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  async function savePost(draft: PostDraft, postId?: string) {
    setSavingPost(true);
    setEditorError('');

    try {
      const savedPost = await apiFetch<FeedPost>(
        postId ? `/api/posts/${encodeURIComponent(postId)}` : '/api/posts',
        {
          method: postId ? 'PUT' : 'POST',
          body: draft,
        }
      );
      setPosts((items) =>
        postId
          ? items.map((post) => post._id === postId ? savedPost : post)
          : [savedPost, ...items]
      );
      setEditor(null);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Unable to save your post.');
    } finally {
      setSavingPost(false);
    }
  }

  async function deletePost(postId: string) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeletingPostId(postId);
    setFeedError('');

    try {
      await apiFetch<{ message: string }>(`/api/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' });
      setPosts((items) => items.filter((post) => post._id !== postId));
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Unable to delete this post.');
    } finally {
      setDeletingPostId(null);
    }
  }

  const firstName = currentUser?.username || 'Mama';
  const editingPost = typeof editor === 'string' ? posts.find((post) => post._id === editor) : undefined;
  const editorInitialValue: PostDraft = editingPost
    ? {
        imageURL: editingPost.imageURL || '',
        message: editingPost.message,
        Day: editingPost.Day,
        Week: editingPost.Week,
        Trimester: editingPost.Trimester,
        dueDate: editingPost.dueDate?.slice(0, 10) || '',
      }
    : emptyDraft;

  return (
    <div className="glam-page min-h-screen px-4 pb-20 text-zinc-700 sm:px-6">
      <header className="relative mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center border-b border-rose-100/80 py-5">
        <div />
        <Link className="text-center no-underline" to="/feed" aria-label="SheConnect feed">
          <span className="block bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 bg-clip-text font-serif text-3xl font-bold tracking-wide text-transparent sm:text-4xl">SheConnect</span>
          <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.2em] text-rose-400 sm:text-[10px]">Motherhood · Connection · Community</span>
        </Link>
        <button
          className="ml-auto grid size-11 place-items-center rounded-full border border-rose-100/80 bg-white/80 text-rose-500 shadow-sm transition hover:scale-105 hover:bg-white hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95"
          type="button"
          onClick={() => navigate('/settings')}
          aria-label="Open settings"
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      <section className="mx-auto max-w-7xl pb-5 pt-6">
        <p className="font-serif text-2xl text-zinc-800 sm:text-3xl">Welcome, <span className="italic text-rose-500">{firstName}</span></p>
        <p className="mt-1 text-sm text-zinc-500">A little space for your story, your people, and all the moments in between.</p>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-12 items-start gap-5 lg:gap-6">
        <aside className="col-span-12 rounded-3xl border border-rose-100/80 bg-white/75 p-4 shadow-[0_10px_30px_rgba(244,63,94,0.06)] backdrop-blur-xl sm:p-5 md:col-span-3 lg:sticky lg:top-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2 px-2">
            <Heart className="text-rose-400" size={17} />
            <h2 className="font-serif text-lg font-semibold text-zinc-800">Your space</h2>
          </div>
          <nav className="grid grid-cols-3 gap-2 md:grid-cols-1" aria-label="Feed navigation">
            <Link className="flex items-center gap-3 rounded-full bg-rose-50 px-3 py-3 text-xs font-semibold text-rose-600 ring-1 ring-rose-100 transition hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] active:scale-95 sm:text-sm" to="/feed">
              <MessageCircle size={17} /> Feed
            </Link>
            <Link className="flex items-center gap-3 rounded-full px-3 py-3 text-xs font-medium text-zinc-600 transition hover:scale-[1.02] hover:bg-rose-50 hover:text-rose-600 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] active:scale-95 sm:text-sm" to="/conversations">
              <Users size={17} className="text-rose-400" /> Social Hub
            </Link>
            <Link className="flex items-center gap-3 rounded-full px-3 py-3 text-xs font-medium text-zinc-600 transition hover:scale-[1.02] hover:bg-rose-50 hover:text-rose-600 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] active:scale-95 sm:text-sm" to="/profile">
              <Heart size={17} className="text-rose-400" /> Profile
            </Link>
            <Link className="flex items-center gap-3 rounded-full px-3 py-3 text-xs font-medium text-zinc-600 transition hover:scale-[1.02] hover:bg-rose-50 hover:text-rose-600 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] active:scale-95 sm:text-sm" to="/settings">
              <Settings size={17} className="text-rose-400" /> Settings
            </Link>
          </nav>
          <div className="mt-5 hidden rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50/60 p-4 md:block">
            <p className="font-serif text-sm font-semibold text-rose-700">A gentle reminder</p>
            <p className="mt-1 text-xs leading-5 text-rose-600/75">You’re doing better than you think, mama.</p>
            <span className="mt-3 block text-right text-xl text-rose-300">♡</span>
          </div>
        </aside>

        <main className="col-span-12 min-w-0 space-y-5 md:col-span-9 lg:col-span-7">
          {editor && editingPost && (
            <PostEditor
              key={editingPost._id}
              initialValue={editorInitialValue}
              title="Edit your moment"
              submitLabel="Save changes"
              submitting={savingPost}
              error={editorError}
              onCancel={() => { setEditor(null); setEditorError(''); }}
              onSubmit={(draft) => savePost(draft, editingPost._id)}
            />
          )}

          {feedError && <p className="rounded-2xl border border-rose-200 bg-white/80 px-4 py-3 text-sm text-rose-700" role="alert">{feedError}</p>}

          {loadingPosts && (
            <div className="space-y-4" aria-label="Loading feed">
              {[0, 1].map((item) => (
                <div className="animate-pulse rounded-3xl border border-rose-100/80 bg-white/75 p-5" key={item}>
                  <div className="mb-4 h-4 w-1/3 rounded-full bg-rose-100" />
                  <div className="h-64 rounded-2xl bg-rose-50" />
                  <div className="mt-4 h-12 rounded-2xl bg-rose-50" />
                </div>
              ))}
            </div>
          )}

          {!loadingPosts && posts.length === 0 && (
            <section className="rounded-3xl border border-rose-100/80 bg-white/80 px-6 py-14 text-center shadow-[0_10px_30px_rgba(244,63,94,0.06)]">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-rose-50 text-rose-400"><Heart size={25} /></span>
              <h2 className="mt-4 font-serif text-2xl text-zinc-800">A fresh page, just for you</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">There are no moments shared just yet. Add the first little hello to your community.</p>
            </section>
          )}

          {!loadingPosts && posts.map((post) => {
            const isOwner = Boolean(currentUser?._id && postOwnerId(post) === currentUser._id);
            return (
              <article className="feed-post-card relative rounded-3xl border border-rose-100/80 bg-white/85 p-4 shadow-[0_10px_30px_rgba(244,63,94,0.06)] backdrop-blur-xl sm:p-5" key={post._id}>
                {isOwner && (
                  <button className="absolute right-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-white/95 px-3 py-2 text-xs font-semibold text-rose-500 shadow-sm transition hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95" type="button" onClick={() => { setEditor(post._id); setEditorError(''); }}>
                    <Pencil size={13} /> Edit
                  </button>
                )}

                <div className="mb-4 flex items-center gap-3 pr-20">
                  {typeof post.userId === 'object' && post.userId.avatar ? (
                    <img
                      src={post.userId.avatar}
                      alt=""
                      className="size-10 shrink-0 rounded-full border border-rose-100 object-cover shadow-sm"
                    />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-200 to-pink-100 font-serif font-semibold text-rose-700">{postAuthor(post).slice(0, 1).toUpperCase()}</span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-zinc-800">{postAuthor(post)}</h2>
                    <p className="text-[11px] text-zinc-400">{formatDueDate(post.createdAt)}</p>
                  </div>
                </div>

                <div className="feed-post-image-frame relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl border border-rose-100/80 bg-gradient-to-br from-[#fff8f8] via-[#fbeff3] to-[#f6e5ed] sm:min-h-72">
                  {post.imageURL ? (
                    <img className="absolute inset-0 h-full w-full object-cover" src={post.imageURL} alt={`Photo shared by ${postAuthor(post)}`} loading="lazy" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-rose-300">
                      <Camera size={34} strokeWidth={1.3} />
                      <span className="font-serif text-lg">A little moment from the journey</span>
                    </div>
                  )}
                  <span className="feed-post-meta-chip absolute bottom-3 left-3 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm backdrop-blur">
                    Day {post.Day}
                  </span>
                  <span className="feed-post-meta-chip absolute bottom-3 right-3 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm backdrop-blur">
                    Week {post.Week}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-rose-50 px-3 py-1.5 font-semibold text-rose-600">{post.Trimester}</span>
                  <span className="feed-due-date inline-flex items-center gap-1.5 rounded-full bg-[#fbf5ee] px-3 py-1.5 text-zinc-600"><CalendarDays size={13} className="feed-due-icon text-amber-600" /> Due {formatDueDate(post.dueDate)}</span>
                </div>

                <div className="feed-post-caption mt-4 rounded-2xl border border-rose-100/80 bg-rose-50/55 px-4 py-3.5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400">A little note</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">{post.message}</p>
                </div>

                {isOwner && (
                  <div className="mt-3 flex justify-end">
                    <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-zinc-400 transition hover:scale-105 hover:bg-rose-50 hover:text-rose-600 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95 disabled:opacity-50" type="button" onClick={() => deletePost(post._id)} disabled={deletingPostId === post._id}>
                      <Trash2 size={13} /> {deletingPostId === post._id ? 'Deleting…' : 'Delete post'}
                    </button>
                  </div>
                )}

                <CommentThread postId={post._id} />
              </article>
            );
          })}

          <div className="flex justify-center pb-2 pt-1">
            <button className="grid size-14 place-items-center rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-lg shadow-rose-300/40 transition hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95" type="button" onClick={() => navigate('/create-post')} aria-label="Create a post" title="Share a moment">
              <Plus size={26} />
            </button>
          </div>
        </main>

        <aside className="col-span-12 rounded-3xl border border-rose-100/80 bg-white/75 p-5 shadow-[0_10px_30px_rgba(244,63,94,0.06)] backdrop-blur-xl md:col-span-6 lg:sticky lg:top-6 lg:col-span-3">
          <div className="mb-4 border-b border-rose-100 pb-3">
            <h2 className="font-serif text-base font-bold text-zinc-800">Your Community</h2>
            <span className="text-[10px] text-zinc-400">See who’s active right now</span>
          </div>
          <div className="space-y-2">
            {loadingUsers ? (
              <div className="space-y-3" aria-label="Loading community members">
                {[0, 1, 2].map((item) => <div className="flex animate-pulse items-center gap-3 p-2" key={item}><span className="size-11 rounded-full bg-rose-100" /><span className="h-3 flex-1 rounded-full bg-rose-50" /></div>)}
              </div>
            ) : usersError ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700" role="alert">{usersError}</p>
            ) : activeUsers.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-400">Your community is just getting started. Invite a mama to say hello.</p>
            ) : activeUsers.map((user, index) => (
              <button className="group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:scale-[1.02] hover:bg-rose-50/70 active:scale-[.98]" key={user._id} type="button" onClick={() => navigate(`/conversations?userId=${encodeURIComponent(user._id)}`)} title={`Chat with ${user.username}`}>
                <span className={`relative grid size-11 shrink-0 place-items-center rounded-full border border-rose-200 font-serif text-sm font-bold shadow-inner transition group-hover:scale-105 ${['bg-gradient-to-tr from-rose-200 to-pink-100 text-rose-700', 'bg-gradient-to-tr from-amber-100 to-rose-100 text-rose-700', 'bg-gradient-to-tr from-fuchsia-100 to-pink-100 text-fuchsia-700'][index % 3]}`}>
                  {user.avatar ? <img src={user.avatar} alt="" className="size-full rounded-full object-cover" /> : user.username.slice(0, 1).toUpperCase()}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white shadow-sm ${
                      user.isActive ? 'bg-emerald-400' : 'bg-zinc-300'
                    }`}
                    aria-label={user.isActive ? 'Active now' : 'Inactive'}
                    title={user.isActive ? 'Active now' : 'Inactive'}
                  >
                    {user.isActive && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-50" />}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-zinc-700 transition group-hover:text-rose-600">{user.username}</span>
                  <span className="text-[10px] text-zinc-400">{user.isActive ? 'Active now' : 'Inactive'} · {user.role === 'Veteran Mommy' ? 'Veteran mama' : 'Community member'}</span>
                </span>
                <MessageCircle size={15} className="text-rose-300 transition group-hover:scale-110 group-hover:text-rose-500" />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
