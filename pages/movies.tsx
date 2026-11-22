import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Clapperboard, ExternalLink, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';

type Movie = {
    id: string;
    title: string;
    youtubeId: string;
    youtubeUrl: string;
    createdAt: string;
};

export default function Movies() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [selected, setSelected] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        api.get('/api/movies')
            .then(response => {
                const items = (response.data.items || []) as Movie[];
                setMovies(items);
                setSelected(items[0] || null);
            })
            .catch(() => setErrorMsg('Could not load Movies right now.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Head>
                <title>Movies — FARHAN</title>
                <meta name="description" content="YouTube videos collected in Farhan's Movies section." />
                <link rel="manifest" href="/manifest.json" />
            </Head>
            <main className="site movies-page">
                <nav className="nav">
                    <Link href="/" className="brand">F<span>•</span></Link>
                    <div className="navlinks">
                        <Link href="/about">About</Link>
                        <Link href="/contact">Contact</Link>
                        <Link href="/socials">Socials</Link>
                    </div>
                </nav>
                <section className="movies-hero">
                    <Link href="/interests" className="back-link"><ArrowLeft size={15} /> Back to Interest & More</Link>
                    <div className="movies-mark"><Clapperboard size={24} /></div>
                    <span className="movies-label">MOVIES & VIDEOS</span>
                    <h1>Movies <em>& More.</em></h1>
                    <p>A small collection of YouTube videos. Watch through YouTube’s official player.</p>
                </section>
                {loading ? (
                    <section className="movies-empty"><Clapperboard size={22} /><span>Loading videos…</span></section>
                ) : errorMsg ? (
                    <section className="movies-empty"><Clapperboard size={22} /><span>{errorMsg}</span></section>
                ) : !movies.length ? (
                    <section className="movies-empty"><Clapperboard size={22} /><span>No videos added yet.</span></section>
                ) : (
                    <section className="movies-content">
                        <article className="movie-feature">
                            <div className="movie-feature-head">
                                <span>NOW WATCHING</span>
                                <strong>{selected?.title || 'YouTube video'}</strong>
                            </div>
                            {selected && (
                                <div className="movie-embed-wrap">
                                    <iframe
                                        className="movie-embed"
                                        title={selected.title}
                                        src={`https://www.youtube-nocookie.com/embed/${selected.youtubeId}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            {selected && <a className="movie-open-link" href={selected.youtubeUrl} target="_blank" rel="noreferrer">Open on YouTube <ExternalLink size={14} /></a>}
                        </article>
                        <div className="movie-list">
                            <div className="movie-list-head"><span>VIDEO COLLECTION</span><span>{movies.length}</span></div>
                            {movies.map((movie, index) => (
                                <button
                                    type="button"
                                    className={`movie-list-item ${selected?.id === movie.id ? 'active' : ''}`}
                                    key={movie.id}
                                    onClick={() => setSelected(movie)}
                                >
                                    <span className="movie-index">{String(index + 1).padStart(2, '0')}</span>
                                    <span className="movie-list-copy"><strong>{movie.title}</strong><small>YouTube</small></span>
                                    <span className="movie-play"><Play size={15} fill="currentColor" /></span>
                                </button>
                            ))}
                            <p className="movie-note">Videos are embedded from YouTube. Playback availability depends on the video owner and YouTube.</p>
                        </div>
                    </section>
                )}
                <footer><span>© 2026 FARHAN</span><span>My little collection.</span></footer>
            </main>
        </>
    );
}
