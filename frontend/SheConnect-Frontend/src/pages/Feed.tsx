import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import CommentSection from './CommentSection';

interface Post {
  _id: string;
  content: string;
  author?: { name: string };
  createdAt: string;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<Post[]>('/posts').then((res) => setPosts(Array.isArray(res) ? res : []));
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    try {
      const newPost = await apiFetch<Post>('/posts', { method: 'POST', data: { content } });
      setPosts([newPost, ...posts]);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-8">
      {/* Create Card */}
      <div className="bg-white/80 backdrop-blur-lg border border-rose-100 rounded-3xl p-6 shadow-[0_10px_30px_rgba(244,63,94,0.05)]">
        <h2 className="text-xl font-glam text-zinc-800 mb-3">Share your sparkle...</h2>
        <form onSubmit={handleCreatePost}>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's inspiring you today?"
            className="w-full p-4 rounded-2xl bg-rose-50/30 border border-rose-100 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/50 transition-all resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider text-white bg-gradient-to-r from-rose-400 to-pink-500 shadow-[0_4px_15px_rgba(244,63,94,0.25)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              {loading ? 'Posting...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post._id}
            className="bg-white/90 backdrop-blur-md border border-rose-100/80 rounded-3xl p-6 shadow-[0_8px_25px_rgba(244,63,94,0.04)] transition-all hover:border-rose-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-300 to-pink-200 flex items-center justify-center font-glam font-bold text-rose-700 text-sm shadow-inner">
                {post.author?.name ? post.author.name[0].toUpperCase() : '✦'}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-700">{post.author?.name || 'Anonymous'}</p>
                <p className="text-[11px] text-zinc-400">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-zinc-600 text-sm leading-relaxed mb-4">{post.content}</p>
            <CommentSection postId={post._id} />
          </div>
        ))}
      </div>
    </div>
  );
}