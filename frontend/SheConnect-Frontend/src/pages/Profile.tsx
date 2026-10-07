import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Copy, Pencil, Trash2, X } from 'lucide-react';
import Logo from '../assets/Logo.jpg'; // Your SheConnect logo asset
import { apiFetch } from '../utils/api';

const DEFAULT_SUPPORTING_IMAGE = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/African_baby.jpg/960px-African_baby.jpg';

const API_BASE = 'http://localhost:1111/api/users';

type ProfilePost = {
  _id: string;
  userId: { _id: string; username?: string } | string;
  imageURL?: string;
  message: string;
  Day: number;
  Week: number;
  Trimester: string;
  dueDate: string;
  createdAt: string;
};

type PostDraft = Pick<ProfilePost, 'imageURL' | 'message' | 'Day' | 'Week' | 'Trimester' | 'dueDate'>;

const PREGNANCY_STAGES = [
  { id: 1, label: 'Mo 1', detail: 'Weeks 1-4' },
  { id: 2, label: 'Mo 2', detail: 'Weeks 5-8' },
  { id: 3, label: 'Mo 3', detail: 'Weeks 9-12' },
  { id: 4, label: 'Mo 4', detail: 'Weeks 13-16' },
  { id: 5, label: 'Mo 5', detail: 'Weeks 17-20' },
  { id: 6, label: 'Mo 6', detail: 'Weeks 21-24' },
  { id: 7, label: 'Mo 7', detail: 'Weeks 25-28' },
  { id: 8, label: 'Mo 8', detail: 'Weeks 29-32' },
  { id: 9, label: 'Mo 9', detail: 'Weeks 33-40' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(5); // default Month 5
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<ProfilePost[]>([]);
  const [postCreatedMessage, setPostCreatedMessage] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [selectedPost, setSelectedPost] = useState<ProfilePost | null>(null);
  const [postDraft, setPostDraft] = useState<PostDraft | null>(null);
  const [postEditorLoading, setPostEditorLoading] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [postEditorError, setPostEditorError] = useState('');

  const token = localStorage.getItem('authToken');
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 1. Fetch current profile data if logged in
  useEffect(() => {
    let mounted = true;
    const navigationPost = (location.state as { createdPost?: ProfilePost } | null)?.createdPost;
    const storedPostId = sessionStorage.getItem('sheconnect:created-post-id');
    const createdPost = navigationPost?._id ? navigationPost : null;

    if (createdPost?._id) {
      setMyPosts((posts) => [createdPost, ...posts.filter((post) => post._id !== createdPost._id)]);
      setPostSearch('');
      setPostsLoading(false);
      setPostCreatedMessage('Your post was saved and is now in My Posts.');
      navigate(location.pathname, { replace: true, state: null });
    }

    async function loadProfile() {
      try {
        const response = await apiFetch<{ user: {
          username?: string;
          name?: string;
          email?: string;
          avatar?: string;
          pregnancyMonth?: number | string;
        } }>('/api/users/me');
        if (!mounted) return;

        const user = response.user;
        if (user.username || user.name) setUsername(user.username || user.name || '');
        if (user.email) setEmail(user.email);
        if (user.avatar) setProfilePreview(user.avatar);
        if (user.pregnancyMonth) setSelectedMonth(Number(user.pregnancyMonth));
      } catch (error) {
        if (mounted) {
          setStatusMessage(error instanceof Error ? error.message : 'Unable to load your profile.');
        }
      }
    }

    async function loadMyPosts() {
      try {
        const posts = await apiFetch<ProfilePost[]>('/api/posts/mine');
        if (mounted) {
          const createdPostId = createdPost?._id || storedPostId;
          let refreshedPosts = posts;
          if (createdPostId && !posts.some((post) => post._id === createdPostId)) {
            const savedPost = createdPost?._id === createdPostId
              ? createdPost
              : await apiFetch<ProfilePost>(`/api/posts/${encodeURIComponent(createdPostId)}`);
            refreshedPosts = [savedPost, ...posts.filter((post) => post._id !== createdPostId)];
          }
          setMyPosts(refreshedPosts);
          if (storedPostId && refreshedPosts.some((post) => post._id === storedPostId)) {
            sessionStorage.removeItem('sheconnect:created-post-id');
          }
        }
      } catch (error) {
        if (mounted) setPostsError(error instanceof Error ? error.message : 'Unable to load your posts.');
      } finally {
        if (mounted) setPostsLoading(false);
      }
    }

    void loadProfile();
    void loadMyPosts();
    return () => { mounted = false; };
  }, []);

  async function openPost(postId: string) {
    setPostEditorLoading(true);
    setPostEditorError('');
    setSelectedPost(null);
    setPostDraft(null);
    try {
      const post = await apiFetch<ProfilePost>(`/api/posts/${encodeURIComponent(postId)}`);
      setMyPosts((posts) => posts.some((item) => item._id === post._id)
        ? posts
        : [post, ...posts]);
      setSelectedPost(post);
      setPostDraft({
        imageURL: post.imageURL || '',
        message: post.message,
        Day: post.Day,
        Week: post.Week,
        Trimester: post.Trimester,
        dueDate: post.dueDate,
      });
    } catch (error) {
      setPostEditorError(error instanceof Error ? error.message : 'Unable to open this post.');
    } finally {
      setPostEditorLoading(false);
    }
  }

  async function findPostById(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const postId = postSearch.trim();
    if (!postId) {
      setPostEditorError('Enter a post ID to search.');
      return;
    }
    if (!/^[a-f\d]{24}$/i.test(postId)) {
      setPostEditorError('Enter a valid 24-character post ID.');
      return;
    }
    await openPost(postId);
  }

  async function copyPostId(postId: string) {
    try {
      await navigator.clipboard.writeText(postId);
      setCopiedPostId(postId);
      window.setTimeout(() => setCopiedPostId((current) => current === postId ? null : current), 1800);
    } catch (error) {
      setPostsError(error instanceof Error ? 'Unable to copy the post ID. You can select and copy it manually.' : 'Unable to copy the post ID.');
    }
  }

  async function savePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPost || !postDraft) return;

    setSavingPost(true);
    setPostEditorError('');
    try {
      const updatedPost = await apiFetch<ProfilePost>(`/api/posts/${encodeURIComponent(selectedPost._id)}`, {
        method: 'PUT',
        body: postDraft,
      });
      setMyPosts((posts) => posts.map((post) => post._id === updatedPost._id ? updatedPost : post));
      setSelectedPost(updatedPost);
      setPostDraft({
        imageURL: updatedPost.imageURL || '',
        message: updatedPost.message,
        Day: updatedPost.Day,
        Week: updatedPost.Week,
        Trimester: updatedPost.Trimester,
        dueDate: updatedPost.dueDate,
      });
    } catch (error) {
      setPostEditorError(error instanceof Error ? error.message : 'Unable to save your post.');
    } finally {
      setSavingPost(false);
    }
  }

  async function deletePost(postId: string) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeletingPostId(postId);
    setPostsError('');
    setPostEditorError('');
    try {
      await apiFetch<{ message: string }>(`/api/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' });
      setMyPosts((posts) => posts.filter((post) => post._id !== postId));
      if (selectedPost?._id === postId) {
        setSelectedPost(null);
        setPostDraft(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete this post.';
      if (selectedPost?._id === postId) setPostEditorError(message);
      else setPostsError(message);
    } finally {
      setDeletingPostId(null);
    }
  }

  // 2. Handle Independent Local File Selection & Preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Instant client-side visual preview
      const previewUrl = URL.createObjectURL(file);
      setProfilePreview(previewUrl);
    }
  };

  // Convert File to Base64 (simplest for JSON payloads)
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // 3. Submit profile updates
  const handleSaveAndContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      let avatarPayload = profilePreview;

      // If user uploaded a new local image file, encode it
      if (selectedFile) {
        avatarPayload = await fileToBase64(selectedFile);
      }

      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          username,
          email,
          ...(password ? { password } : {}),
          avatar: avatarPayload,
          pregnancyMonth: selectedMonth,
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      setStatusMessage('Profile polished ✨ Routing to feed...');
      setTimeout(() => {
        navigate('/feed', { replace: true });
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message || 'Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glam-page min-h-screen flex flex-col font-sans text-[#4a454e]">
      
      {/* ─── TOP HEADER BAR ─── */}
      <header className="profile-header relative w-full border-b border-rose-200/60 bg-white/70 backdrop-blur-xl px-8 py-3.5 flex items-center justify-between shadow-sm z-30">
        <div className="w-10"></div>

        {/* Center Logo */}
        <div className="flex items-center gap-2">
          <img
            src={Logo}
            alt="SheConnect Logo"
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-rose-100"
          />
          <span className="text-2xl font-serif font-bold tracking-wider bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 bg-clip-text text-transparent">
            SheConnect
          </span>
        </div>

        {/* Settings Icon */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 shadow-sm transition-all duration-300 hover:bg-rose-500 hover:text-white hover:scale-110 active:scale-95"
          aria-label="Open settings"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* ─── PREGNANCY STAGES STRIP ─── */}
      <section className="profile-stages-section w-full max-w-6xl mx-auto px-8 py-5 border-b border-rose-200/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-serif font-bold uppercase tracking-widest text-zinc-700">
            Pregnancy Stages
          </h2>

          {/* Month Indicator & Calendar Icon */}
          <div className="flex items-center gap-3">
            <span className="profile-month-badge px-4 py-1 rounded-full text-xs font-semibold bg-white/80 border border-rose-200 text-rose-600 shadow-sm">
              Month {selectedMonth}
            </span>
            <div className="profile-calendar-icon p-2 rounded-full bg-white/80 border border-rose-200 text-rose-500 shadow-sm" aria-label="Due date calendar">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Carousel Row with Arrows */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSelectedMonth((m) => Math.max(1, m - 1))}
            className="w-8 h-8 rounded-full bg-white border border-rose-200 text-rose-500 flex items-center justify-center text-sm shadow-sm hover:scale-110 active:scale-95 transition-all"
          >
            ←
          </button>

          <div className="flex-1 flex items-center justify-between gap-2 overflow-x-auto py-2">
            {PREGNANCY_STAGES.map((stg) => {
              const isActive = selectedMonth === stg.id;
              return (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => setSelectedMonth(stg.id)}
                  className={`flex flex-col items-center justify-center transition-all duration-300 ${
                    isActive ? 'scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-medium text-xs shadow-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-tr from-rose-400 to-pink-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'bg-white border border-rose-200 text-zinc-600'
                    }`}
                  >
                    {stg.id}
                  </div>
                  <span className="text-[10px] mt-1 font-medium text-zinc-500">{stg.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSelectedMonth((m) => Math.min(9, m + 1))}
            className="w-8 h-8 rounded-full bg-white border border-rose-200 text-rose-500 flex items-center justify-center text-sm shadow-sm hover:scale-110 active:scale-95 transition-all"
          >
            →
          </button>
        </div>
      </section>

      {/* ─── MAIN 3-BLOCK EDIT CONTAINER ─── */}
      <main className="profile-editor-grid max-w-6xl w-full mx-auto px-8 py-8 flex-1 grid grid-cols-12 gap-8 items-stretch">
        
        {/* 1. LEFT: PROFILE PIC UPLOAD CARD */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white/75 backdrop-blur-xl border border-rose-100 rounded-3xl p-6 shadow-[0_10px_30px_rgba(244,63,94,0.05)] flex flex-col items-center justify-between">
          <div className="w-full flex-1 flex flex-col items-center justify-center">
            
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Profile Pic Display Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-52 h-52 rounded-3xl overflow-hidden border-2 border-dashed border-rose-300 bg-rose-50/40 flex items-center justify-center cursor-pointer group shadow-inner transition-all hover:border-rose-400 hover:bg-rose-50/70"
            >
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="Profile"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="text-center p-4">
                  <span className="text-3xl mb-2 block">📷</span>
                  <span className="text-xs font-serif text-zinc-500 block">No photo chosen</span>
                </div>
              )}

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-rose-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                Change Photo ✦
              </div>
            </div>
          </div>

          {/* Action Trigger Text */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 text-xs font-medium text-rose-500 hover:text-rose-600 underline underline-offset-4 tracking-wide transition-colors"
          >
            Upload a profile picture
          </button>
        </div>

        {/* 2. CENTER: PROFILE FORM FIELDS */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white/75 backdrop-blur-xl border border-rose-100 rounded-3xl p-6 shadow-[0_10px_30px_rgba(244,63,94,0.05)] flex flex-col justify-center gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 ml-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. MamaSophia"
              className="w-full px-5 py-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/60 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 ml-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mama@example.com"
              className="w-full px-5 py-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/60 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 ml-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Update password (optional)"
              className="w-full px-5 py-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/60 transition-all"
            />
          </div>

          {statusMessage && (
            <p className="text-xs text-center text-rose-500 font-medium mt-1">
              {statusMessage}
            </p>
          )}
        </div>

        {/* 3. RIGHT: SUPPORTING BACKGROUND IMAGE & CONTINUE BUTTON */}
        <div className="col-span-12 md:col-span-12 lg:col-span-4 relative rounded-3xl overflow-hidden border border-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.05)] group min-h-[300px]">
          {/* Supporting background image */}
          <img
            src={DEFAULT_SUPPORTING_IMAGE}
            alt="Brown-skinned baby resting in their mother's arms"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Soft vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          <a
            href="https://commons.wikimedia.org/wiki/File:African_baby.jpg"
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-7 left-5 z-10 max-w-40 rounded-full bg-black/35 px-3 py-2 text-[10px] leading-4 text-white/90 backdrop-blur-sm transition hover:bg-black/55"
          >
            Photo: Queen Asali · CC BY-SA 4.0
          </a>

          {/* Continue Button (Bottom Right) */}
          <div className="absolute bottom-6 right-6 z-10">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAndContinue}
              className="px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_4px_15px_rgba(244,63,94,0.35)] hover:shadow-[0_8px_25px_rgba(244,63,94,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        </div>

      </main>

      <section className="profile-posts-section mx-auto w-full max-w-6xl px-8 pb-12" aria-labelledby="my-posts-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">Your moments</p>
            <h2 id="my-posts-heading" className="mt-1 font-serif text-3xl text-zinc-800">My Posts</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/create-post')}
            className="rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(244,63,94,0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95"
          >
            Share a moment
          </button>
        </div>

        {postsError && (
          <p className="mb-4 rounded-2xl border border-rose-200 bg-white/80 px-4 py-3 text-sm text-rose-700" role="alert">
            {postsError}
          </p>
        )}
        {postCreatedMessage && (
          <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800" role="status">
            {postCreatedMessage}
          </p>
        )}
        {postEditorError && !selectedPost && (
          <p className="mb-4 rounded-2xl border border-rose-200 bg-white/80 px-4 py-3 text-sm text-rose-700" role="alert">
            {postEditorError}
          </p>
        )}

        <form onSubmit={findPostById} className="mb-5 flex flex-col gap-3 rounded-3xl border border-rose-100/80 bg-white/75 p-4 shadow-[0_10px_30px_rgba(244,63,94,0.04)] sm:flex-row">
          <label htmlFor="my-post-search" className="sr-only">Search your posts by post ID</label>
          <input
            id="my-post-search"
            type="search"
            value={postSearch}
            onChange={(event) => {
              setPostSearch(event.target.value);
              setPostEditorError('');
            }}
            placeholder="Search or open a post by its ID"
            className="min-w-0 flex-1 rounded-full border border-rose-100 bg-white px-5 py-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:ring-4 focus:ring-rose-100"
          />
          <button
            type="submit"
            disabled={postEditorLoading || !postSearch.trim()}
            className="rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(244,63,94,0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {postEditorLoading ? 'Searching...' : 'Find by ID'}
          </button>
        </form>

        {postsLoading ? (
          <p className="rounded-3xl border border-rose-100/80 bg-white/75 p-6 text-sm text-zinc-500" role="status">
            Loading your posts...
          </p>
        ) : myPosts.length === 0 ? (
          <div className="rounded-3xl border border-rose-100/80 bg-white/75 px-6 py-10 text-center shadow-[0_10px_30px_rgba(244,63,94,0.05)]">
            <h3 className="font-serif text-xl text-zinc-800">Your story starts here</h3>
            <p className="mt-2 text-sm text-zinc-500">Posts you create will appear here, ready for you to revisit, search, or edit.</p>
          </div>
        ) : (
          myPosts.filter((post) => {
            const query = postSearch.trim().toLowerCase();
            return !query || post._id.toLowerCase().includes(query) || post.message.toLowerCase().includes(query);
          }).length === 0 ? (
            <p className="rounded-3xl border border-rose-100/80 bg-white/75 p-6 text-center text-sm text-zinc-500">
              No posts match that search. Enter a post ID above to look it up directly.
            </p>
          ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myPosts.filter((post) => {
              const query = postSearch.trim().toLowerCase();
              return !query || post._id.toLowerCase().includes(query) || post.message.toLowerCase().includes(query);
            }).map((post) => (
              <article key={post._id} className="profile-post-card overflow-hidden rounded-3xl border border-rose-100/80 bg-white/80 shadow-[0_10px_30px_rgba(244,63,94,0.06)]">
                {post.imageURL ? (
                  <img src={post.imageURL} alt="" className="h-48 w-full object-cover" />
                ) : (
                  <div className="grid h-36 place-items-center bg-gradient-to-br from-rose-50 to-pink-100 text-rose-300" aria-hidden="true">
                    <span className="font-serif text-lg">A little moment ✦</span>
                  </div>
                )}
                <div className="p-5">
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{post.message}</p>
                  <p className="mt-3 text-xs text-rose-500">
                    Day {post.Day} · Week {post.Week} · {post.Trimester}
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2">
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-rose-500">Post ID</span>
                    <code className="min-w-0 flex-1 break-all font-mono text-[11px] text-zinc-600" aria-label={`Post ID ${post._id}`}>
                      {post._id}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyPostId(post._id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-rose-600 transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] active:scale-95"
                      aria-label={`Copy post ID ${post._id}`}
                      title="Copy post ID"
                    >
                      {copiedPostId === post._id ? <Check size={13} /> : <Copy size={13} />}
                      {copiedPostId === post._id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void openPost(post._id)}
                      disabled={postEditorLoading}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] active:scale-95 disabled:opacity-60"
                    >
                      <Pencil size={15} /> View / Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deletePost(post._id)}
                      disabled={deletingPostId === post._id}
                      aria-label="Delete post"
                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-3 text-rose-600 transition-all duration-300 hover:scale-105 hover:bg-rose-50 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] active:scale-95 disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          )
        )}
      </section>

      {postEditorLoading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-rose-950/20 p-4 backdrop-blur-sm" role="status">
          <p className="rounded-2xl bg-white px-6 py-4 text-sm text-rose-700 shadow-xl">Opening your post...</p>
        </div>
      )}

      {selectedPost && postDraft && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-rose-950/30 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-post-heading"
            className="my-8 w-full max-w-2xl rounded-3xl border border-rose-100 bg-[#fffafb] p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">Your story</p>
                <h2 id="edit-post-heading" className="mt-1 font-serif text-2xl text-zinc-800">Edit your post</h2>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedPost(null); setPostDraft(null); setPostEditorError(''); }}
                aria-label="Close editor"
                className="rounded-full p-2 text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={savePost} className="space-y-4">
              {selectedPost.imageURL && (
                <img src={selectedPost.imageURL} alt="Post" className="max-h-64 w-full rounded-2xl object-cover" />
              )}
              <label className="block text-sm font-medium text-zinc-600">
                Image URL
                <input
                  type="url"
                  value={postDraft.imageURL || ''}
                  onChange={(event) => setPostDraft((draft) => draft ? { ...draft, imageURL: event.target.value } : draft)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-rose-100"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-600">
                Message
                <textarea
                  required
                  rows={4}
                  value={postDraft.message}
                  onChange={(event) => setPostDraft((draft) => draft ? { ...draft, message: event.target.value } : draft)}
                  className="mt-1 w-full resize-y rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-rose-100"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-zinc-600">
                  Day (1–7)
                  <input
                    type="number"
                    min={1}
                    max={7}
                    required
                    value={postDraft.Day}
                    onChange={(event) => setPostDraft((draft) => draft ? { ...draft, Day: Number(event.target.value) } : draft)}
                    className="mt-1 w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-rose-100"
                  />
                </label>
                <label className="text-sm font-medium text-zinc-600">
                  Week
                  <input
                    type="number"
                    min={1}
                    max={42}
                    required
                    value={postDraft.Week}
                    onChange={(event) => setPostDraft((draft) => draft ? { ...draft, Week: Number(event.target.value) } : draft)}
                    className="mt-1 w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-rose-100"
                  />
                </label>
                <label className="text-sm font-medium text-zinc-600">
                  Trimester
                  <input
                    required
                    value={postDraft.Trimester}
                    onChange={(event) => setPostDraft((draft) => draft ? { ...draft, Trimester: event.target.value } : draft)}
                    className="mt-1 w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-rose-100"
                  />
                </label>
                <label className="text-sm font-medium text-zinc-600">
                  Due date
                  <input
                    required
                    value={postDraft.dueDate}
                    onChange={(event) => setPostDraft((draft) => draft ? { ...draft, dueDate: event.target.value } : draft)}
                    className="mt-1 w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-rose-100"
                  />
                </label>
              </div>

              {postEditorError && <p className="text-sm text-rose-700" role="alert">{postEditorError}</p>}
              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void deletePost(selectedPost._id)}
                  disabled={deletingPostId === selectedPost._id}
                  className="rounded-full border border-rose-200 px-5 py-2.5 text-sm font-medium text-rose-700 transition-all hover:scale-105 hover:bg-rose-50 active:scale-95 disabled:opacity-60"
                >
                  {deletingPostId === selectedPost._id ? 'Deleting...' : 'Delete post'}
                </button>
                <button
                  type="submit"
                  disabled={savingPost}
                  className="rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(244,63,94,0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95 disabled:opacity-60"
                >
                  {savingPost ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}