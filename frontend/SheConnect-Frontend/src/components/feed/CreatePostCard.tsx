import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { ArrowLeft, ImagePlus, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const trimesters = ['1st Trimester', '2nd Trimester', '3rd Trimester', 'Postpartum'];
const maxImageSize = 7 * 1024 * 1024;

type CreatePostResponse = {
  _id: string;
};

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Unable to preview this image.'));
    };
    reader.onerror = () => reject(new Error('Unable to read this image file.'));
    reader.readAsDataURL(file);
  });
}

export default function CreatePostCard() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState('');
  const [day, setDay] = useState('Monday');
  const [week, setWeek] = useState('24');
  const [trimester, setTrimester] = useState('2nd Trimester');
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function selectImage(file?: File) {
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Choose an image file to add a post picture.');
      return;
    }
    if (file.size > maxImageSize) {
      setError('Please choose an image smaller than 7 MB.');
      return;
    }

    try {
      setImage(await readImage(file));
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : 'Unable to preview this image.');
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void selectImage(event.target.files?.[0]);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void selectImage(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError('');

    const weekNumber = Number(week);
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 42) {
      setError('Please choose a pregnancy week between 1 and 42.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<CreatePostResponse>('/api/posts', {
        method: 'POST',
        body: {
          image,
          day,
          week: weekNumber,
          trimester,
          dueDate,
          message: message.trim(),
        },
      });
      navigate('/profile');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save your post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf5f7] via-[#f7edf2] to-[#f4e6ec] px-4 pb-16 text-zinc-700 sm:px-6">
      <header className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center border-b border-rose-100/80 py-5">
        <button
          className="inline-flex size-11 items-center justify-center gap-1 rounded-full border border-rose-100 bg-white/80 text-rose-500 shadow-sm transition hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95"
          type="button"
          onClick={() => navigate('/feed')}
          aria-label="Back to feed"
          title="Back to feed"
        >
          <ArrowLeft size={18} />
        </button>
        <button type="button" className="text-center" onClick={() => navigate('/feed')} aria-label="SheConnect feed">
          <span className="block bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 bg-clip-text font-serif text-3xl font-bold tracking-wide text-transparent sm:text-4xl">
            SheConnect
          </span>
          <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.2em] text-rose-400 sm:text-[10px]">
            Motherhood · Connection · Community
          </span>
        </button>
        <span aria-hidden="true" />
      </header>

      <main className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-rose-100/80 bg-white/75 p-5 shadow-[0_10px_30px_rgba(244,63,94,0.08)] backdrop-blur-xl sm:mt-10 sm:p-9">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">Your story matters</p>
          <h1 className="mt-2 font-serif text-3xl text-zinc-800 sm:text-4xl">Create a post</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">Share a little moment with your SheConnect community.</p>
        </div>

        <form className="space-y-7" onSubmit={handleSubmit}>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-zinc-700">Upload A Post Picture <span className="font-normal text-zinc-400">(optional)</span></h2>
            <div
              className={`relative grid min-h-64 cursor-pointer place-items-center overflow-hidden rounded-3xl border border-dashed transition ${
                dragging ? 'border-rose-400 bg-rose-100/60' : 'border-rose-200 bg-gradient-to-br from-rose-50/80 to-[#fbf5ee]'
              }`}
              onClick={() => fileInput.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInput.current?.click();
                }
              }}
              aria-label="Choose or drop a post picture"
            >
              {image ? (
                <>
                  <img className="absolute inset-0 h-full w-full object-cover" src={image} alt="Selected post preview" />
                  <button
                    type="button"
                    className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-white/70 bg-white/90 text-rose-600 shadow transition hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95"
                    onClick={(event) => { event.stopPropagation(); setImage(''); }}
                    aria-label="Remove selected picture"
                  >
                    <X size={17} />
                  </button>
                  <span className="absolute bottom-3 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-rose-600 shadow-sm">
                    Choose a different picture
                  </span>
                </>
              ) : (
                <div className="px-5 py-8 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-white text-rose-400 shadow-sm">
                    <ImagePlus size={25} />
                  </span>
                  <p className="mt-4 font-serif text-xl text-zinc-700">A moment worth keeping</p>
                  <p className="mt-2 text-sm text-zinc-500">Click to browse or drag a photo here</p>
                  <p className="mt-1 text-xs text-zinc-400">Image files up to 7 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              aria-label="Upload a post picture"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-xs font-semibold text-zinc-600">
              Day
              <select className="mt-2 h-11 w-full rounded-2xl border border-rose-100 bg-white px-3 text-sm font-normal text-zinc-700 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100/70" value={day} onChange={(event) => setDay(event.target.value)}>
                {weekdays.map((weekday) => <option key={weekday} value={weekday}>{weekday}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-zinc-600">
              Week
              <input className="mt-2 h-11 w-full rounded-2xl border border-rose-100 bg-white px-3 text-sm font-normal text-zinc-700 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100/70" type="number" min={1} max={42} value={week} onChange={(event) => setWeek(event.target.value)} required />
            </label>
            <label className="text-xs font-semibold text-zinc-600">
              Trimester
              <select className="mt-2 h-11 w-full rounded-2xl border border-rose-100 bg-white px-3 text-sm font-normal text-zinc-700 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100/70" value={trimester} onChange={(event) => setTrimester(event.target.value)}>
                {trimesters.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-zinc-600">
              Due date
              <input className="mt-2 h-11 w-full rounded-2xl border border-rose-100 bg-white px-3 text-sm font-normal text-zinc-700 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100/70" type="month" value={dueDate.slice(0, 7)} onChange={(event) => setDueDate(event.target.value ? `${event.target.value}-01` : '')} required />
            </label>
          </div>

          <label className="block text-xs font-semibold text-zinc-600">
            Add a message
            <textarea
              className="mt-2 min-h-36 w-full resize-y rounded-3xl border border-rose-100 bg-rose-50/30 px-4 py-3.5 text-sm font-normal leading-6 text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100/70"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Share a moment, a thought, or a little win…"
              maxLength={3000}
              required
            />
            <span className="mt-1 block text-right text-[11px] font-normal text-zinc-400">{message.length}/3000</span>
          </label>

          {error && <p className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}

          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(244,63,94,0.22)] transition hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              type="submit"
              disabled={submitting}
            >
              <Save size={16} />
              {submitting ? 'Saving your post…' : 'Save post'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}