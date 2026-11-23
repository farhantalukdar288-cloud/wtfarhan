import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

type Note = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

type Music = {
  id: string;
  title: string;
  spotifyUrl: string;
  createdAt: string;
};

type Movie = {
  id: string;
  title: string;
  youtubeUrl: string;
  createdAt: string;
};

async function callBackend(httpMethod: string, path: string, body: any = {}) {
  const res = await fetch('/api/backend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ httpMethod, path, body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export default function AdminNotes() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [notes, setNotes] = useState<Note[]>([]);
  const [music, setMusic] = useState<Music[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);

  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [movieTitle, setMovieTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  async function loadData(pass = password) {
    setLoading(true);
    setMessage('');

    try {
      const [adminData, musicData, movieData] = await Promise.all([
        callBackend('POST', '/api/admin', { password: pass }),
        callBackend('GET', '/api/music'),
        callBackend('GET', '/api/movies'),
      ]);

      setNotes(adminData.notes || []);
      setMusic(musicData.items || musicData.tracks || []);
      setMovies(movieData.items || movieData.movies || []);
      setLoggedIn(true);
    } catch (err: any) {
      setLoggedIn(false);
      setMessage(err?.message || 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();

    if (!password.trim()) {
      setMessage('Enter your admin password.');
      return;
    }

    await loadData(password.trim());
  }

  function signOut() {
    setLoggedIn(false);
    setPassword('');
    setNotes([]);
    setMusic([]);
    setMovies([]);
    setMessage('');
  }

  async function addMusic(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    try {
      await callBackend('POST', '/api/music', {
        password,
        url: spotifyUrl.trim(),
      });

      setSpotifyUrl('');
      setMessage('Song added successfully.');
      await loadData();
    } catch (err: any) {
      setMessage(err?.message || 'Could not add song.');
    }
  }

  async function deleteMusic(id: string) {
    if (!confirm('Remove this song?')) return;

    try {
      await callBackend('DELETE', `/api/music/${id}`, { password });
      setMusic(music.filter((item) => item.id !== id));
      setMessage('Song removed.');
    } catch (err: any) {
      setMessage(err?.message || 'Could not remove song.');
    }
  }

  async function addMovie(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    try {
      await callBackend('POST', '/api/movies', {
        password,
        url: youtubeUrl.trim(),
        title: movieTitle.trim(),
      });

      setYoutubeUrl('');
      setMovieTitle('');
      setMessage('Video added successfully.');
      await loadData();
    } catch (err: any) {
      setMessage(err?.message || 'Could not add video.');
    }
  }

  async function deleteMovie(id: string) {
    if (!confirm('Remove this video?')) return;

    try {
      await callBackend('DELETE', `/api/movies/${id}`, { password });
      setMovies(movies.filter((item) => item.id !== id));
      setMessage('Video removed.');
    } catch (err: any) {
      setMessage(err?.message || 'Could not remove video.');
    }
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this visitor note?')) return;

    try {
      await callBackend('DELETE', `/api/notes/${id}`, { password });
      setNotes(notes.filter((item) => item.id !== id));
      setMessage('Note deleted.');
    } catch (err: any) {
      setMessage(err?.message || 'Could not delete note.');
    }
  }

  return (
    <>
      <Head>
        <title>Private Admin | FARHAN</title>
      </Head>

      <main className="site">
        <nav className="nav">
          <Link href="/" className="brand">
            F<span>•</span>
          </Link>
          <span className="admin-badge">PRIVATE ADMIN</span>
        </nav>

        <section className="admin-page">
          <div className="eyebrow">PRIVATE ADMIN</div>
          <h1>Website controls</h1>

          {!loggedIn ? (
            <form className="admin-login" onSubmit={signIn}>
              <p>Sign in with your admin password.</p>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                autoComplete="current-password"
              />

              <button className="primary" type="submit" disabled={loading}>
                {loading ? 'Checking…' : 'Sign in →'}
              </button>
            </form>
          ) : (
            <>
              <div className="admin-head">
                <span>
                  {notes.length} notes · {music.length} songs · {movies.length} videos
                </span>

                <button className="clear-chat" onClick={signOut}>
                  Sign out
                </button>
              </div>

              <section className="music-admin-card">
                <div className="music-admin-kicker">MUSIC</div>
                <h2>Add Spotify music</h2>

                <form className="music-admin-form" onSubmit={addMusic}>
                  <label>
                    SPOTIFY LINK
                    <input
                      value={spotifyUrl}
                      onChange={(e) => setSpotifyUrl(e.target.value)}
                      placeholder="https://open.spotify.com/track/..."
                    />
                  </label>

                  <button className="primary" type="submit">
                    Add song →
                  </button>
                </form>

                <div className="music-admin-list">
                  {music.map((item) => (
                    <div className="music-admin-row" key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.spotifyUrl}</small>
                      </div>
                      <button
                        className="delete-note"
                        onClick={() => deleteMusic(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="music-admin-card">
                <div className="music-admin-kicker">MOVIES</div>
                <h2>Add YouTube video</h2>

                <form className="music-admin-form" onSubmit={addMovie}>
                  <label>
                    VIDEO TITLE
                    <input
                      value={movieTitle}
                      onChange={(e) => setMovieTitle(e.target.value)}
                      placeholder="Video title"
                    />
                  </label>

                  <label>
                    YOUTUBE LINK
                    <input
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtu.be/..."
                    />
                  </label>

                  <button className="primary" type="submit">
                    Add video →
                  </button>
                </form>

                <div className="music-admin-list">
                  {movies.map((item) => (
                    <div className="music-admin-row" key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.youtubeUrl}</small>
                      </div>
                      <button
                        className="delete-note"
                        onClick={() => deleteMovie(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-notes-section">
                <div className="music-admin-kicker">VISITOR NOTES</div>

                <div className="admin-list">
                  {notes.map((item) => (
                    <article className="admin-note" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <time>
                          {new Date(item.createdAt).toLocaleString()}
                        </time>
                      </div>

                      <p>{item.message}</p>

                      <button
                        className="delete-note"
                        onClick={() => deleteNote(item.id)}
                      >
                        Delete
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {message && <p className="visitor-status">{message}</p>}
        </section>
      </main>
    </>
  );
}
