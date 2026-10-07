import { useEffect, useState, type FormEvent } from 'react';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { decodeToken, isTokenValid } from '../../utils/auth';

type CommentAuthor = {
  _id: string;
  username?: string;
  displayName?: string;
};

type PostComment = {
  _id: string;
  post: string;
  author: CommentAuthor | string;
  text: string;
  gifUrl?: string;
  createdAt: string;
};

interface CommentThreadProps {
  postId: string;
}

function getAuthorName(author: PostComment['author']): string {
  if (typeof author === 'string') return 'SheConnect member';
  return author.displayName || author.username || 'SheConnect member';
}

function formatCommentTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function CommentThread({ postId }: CommentThreadProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadedPostId, setLoadedPostId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const loading = loadedPostId !== postId;
  const canComment = isTokenValid();
  const tokenPayload = decodeToken();
  const userIdClaim = tokenPayload?._id || tokenPayload?.id;
  const currentUserId = typeof userIdClaim === 'string' ? userIdClaim : '';

  useEffect(() => {
    let active = true;

    apiFetch<PostComment[]>(`/api/posts/${encodeURIComponent(postId)}/comments`)
      .then((items) => {
        if (!Array.isArray(items)) {
          throw new Error('The server returned an invalid comments response.');
        }
        if (active) {
          setComments(items);
          setLoadError('');
          setLoadedPostId(postId);
        }
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setLoadError(fetchError instanceof Error ? fetchError.message : 'Unable to load comments.');
          setLoadedPostId(postId);
        }
      });

    return () => {
      active = false;
    };
  }, [postId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const commentText = text.trim();
    if (!commentText || submitting) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const comment = await apiFetch<PostComment>(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        body: { text: commentText },
      });
      setComments((existing) => [...existing, comment]);
      setText('');
    } catch (submitFailure) {
      setSubmitError(submitFailure instanceof Error ? submitFailure.message : 'Unable to post your comment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (deletingCommentId) return;

    setDeletingCommentId(commentId);
    setDeleteError('');
    try {
      await apiFetch<{ message: string }>(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
        { method: 'DELETE' }
      );
      setComments((existing) => existing.filter((comment) => comment._id !== commentId));
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : 'Unable to delete this comment.');
    } finally {
      setDeletingCommentId(null);
    }
  }

  return (
    <section className="mt-4 border-t border-rose-100 pt-4" aria-label="Post comments">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
        <MessageCircle size={16} className="text-rose-400" aria-hidden="true" />
        Comments <span className="text-xs font-normal text-zinc-400">({comments.length})</span>
      </h3>

      {loading ? (
        <div className="space-y-3 py-2" aria-label="Loading comments">
          {[0, 1].map((item) => (
            <div className="flex animate-pulse gap-3" key={item}>
              <span className="size-8 rounded-full bg-rose-100" />
              <span className="h-12 flex-1 rounded-2xl bg-rose-50" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">{loadError}</p>
      ) : comments.length === 0 ? (
        <p className="py-2 text-xs text-zinc-400">No comments yet. A kind word can start a conversation.</p>
      ) : (
        <ul className="mb-4 space-y-3">
          {comments.map((comment) => {
            const authorName = getAuthorName(comment.author);
            return (
              <li className="flex gap-2.5" key={comment._id}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100 text-xs font-semibold text-rose-600">
                  {authorName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-rose-100 bg-white px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-xs font-semibold text-zinc-700">{authorName}</span>
                    <span className="inline-flex items-center gap-2">
                      <time className="text-[10px] text-zinc-400" dateTime={comment.createdAt}>
                        {formatCommentTime(comment.createdAt)}
                      </time>
                      {canComment && currentUserId && (
                        typeof comment.author === 'string'
                          ? comment.author === currentUserId
                          : comment.author._id === currentUserId
                      ) && (
                        <button
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium text-zinc-400 transition hover:scale-105 hover:bg-rose-50 hover:text-rose-600 hover:shadow-[0_0_15px_rgba(244,63,94,0.25)] active:scale-95 disabled:cursor-wait disabled:opacity-50"
                          type="button"
                          onClick={() => void handleDelete(comment._id)}
                          disabled={deletingCommentId !== null}
                          aria-label={`Delete your comment by ${authorName}`}
                        >
                          <Trash2 size={12} aria-hidden="true" />
                          {deletingCommentId === comment._id ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </span>
                  </div>
                  {comment.text && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-zinc-600">
                      {comment.text}
                    </p>
                  )}
                  {comment.gifUrl && (
                    <img
                      className="mt-2 max-h-56 max-w-full rounded-xl object-cover"
                      src={comment.gifUrl}
                      alt="Comment attachment"
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canComment ? (
        <form className="mt-3 flex items-end gap-2" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor={`comment-${postId}`}>Write a comment</label>
          <textarea
            id={`comment-${postId}`}
            className="min-h-10 max-h-32 min-w-0 flex-1 resize-y rounded-2xl border border-rose-100 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Leave a little kindness…"
            maxLength={2000}
            rows={1}
            disabled={submitting}
          />
          <button
            className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-md shadow-rose-200/60 transition hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100"
            type="submit"
            aria-label="Post comment"
            disabled={!text.trim() || submitting}
          >
            <Send size={15} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <p className="mt-3 text-xs text-zinc-400">Sign in to join the conversation.</p>
      )}
      {submitError && <p className="mt-2 text-xs text-rose-700" role="alert">{submitError}</p>}
      {deleteError && <p className="mt-2 text-xs text-rose-700" role="alert">{deleteError}</p>}
    </section>
  );
}