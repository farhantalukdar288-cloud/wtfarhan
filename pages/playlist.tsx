import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Music2, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';

type Track = {
    id: string;
    title: string;
    spotifyId: string;
    spotifyUrl: string;
    createdAt: string;
};

export default function Playlist() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [selected, setSelected] = useState<Track | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        api.get('/api/music')
            .then(response => {
                const items = (response.data.items || []) as Track[];
                setTracks(items);
                setSelected(items[0] || null);
            })
            .catch(() => setErrorMsg('Could not load the playlist right now.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Head>
                <title>My Current Playlist — FARHAN</title>
                <meta name="description" content="Farhan's current Spotify playlist." />
                <link rel="manifest" href="/manifest.json" />
            </Head>
            <main className="site playlist-page">
                <nav className="nav">
                    <Link href="/" className="brand">F<span>•</span></Link>
                    <div className="navlinks">
                        <Link href="/about">About</Link>
                        <Link href="/contact">Contact</Link>
                        <Link href="/socials">Socials</Link>
                    </div>
                </nav>
                <section className="playlist-hero">
                    <Link href="/interests" className="back-link"><ArrowLeft size={15} /> Back to Interest & More</Link>
                    <div className="playlist-mark"><Music2 size={24} /></div>
                    <span className="playlist-label">MY CURRENT PLAYLIST</span>
                    <h1>My Current<br /><em>Playlist.</em></h1>
                    <p>My current rotation, powered by Spotify’s official Embed player. No audio is downloaded or re-hosted here.</p>
                </section>
                {loading ? (
                    <section className="playlist-empty"><Music2 size={22} /><span>Loading playlist…</span></section>
                ) : errorMsg ? (
                    <section className="playlist-empty"><Music2 size={22} /><span>{errorMsg}</span></section>
                ) : !tracks.length ? (
                    <section className="playlist-empty"><Music2 size={22} /><span>No songs added yet.</span></section>
                ) : (
                    <section className="spotify-polaroid-wrap playlist-content">
                        <article className="spotify-polaroid">
                            <div className="spotify-polaroid-top">
                                <div className="spotify-photo">
                                    <div className="spotify-photo-inner"><Music2 size={34} /><span>SPOTIFY</span></div>
                                </div>
                                <div className="spotify-caption">
                                    <span>NOW PLAYING</span>
                                    <strong>{selected?.title || 'Spotify track'}</strong>
                                    <small>Official Spotify Embed</small>
                                </div>
                            </div>
                            {selected && (
                                <div className="spotify-embed-shell">
                                    <iframe
                                        className="spotify-embed-frame"
                                        title={`Spotify player — ${selected.title}`}
                                        src={`https://open.spotify.com/embed/track/${selected.spotifyId}?utm_source=generator`}
                                        width="100%"
                                        height="152"
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            <div className="spotify-attribution">
                                <span>Spotify</span>
                                {selected && <a href={selected.spotifyUrl} target="_blank" rel="noreferrer">Open in Spotify <ExternalLink size={12} /></a>}
                            </div>
                        </article>
                        <div className="spotify-track-list">
                            <div className="track-list-head"><span>TRACKS</span><span>{tracks.length}</span></div>
                            {tracks.map((track, index) => (
                                <button
                                    type="button"
                                    className={`spotify-track ${selected?.id === track.id ? 'active' : ''}`}
                                    key={track.id}
                                    onClick={() => setSelected(track)}
                                >
                                    <span className="track-number">{String(index + 1).padStart(2, '0')}</span>
                                    <span className="track-info"><strong>{track.title}</strong><small>Spotify</small></span>
                                    <span className="track-play"><Play size={14} fill="currentColor" /></span>
                                </button>
                            ))}
                            <p className="spotify-note">Playback stays inside Spotify’s official Embed. Availability and playback can depend on Spotify and the listener’s account or region.</p>
                        </div>
                    </section>
                )}
                <footer><span>© 2026 FARHAN</span><span>My current rotation.</span></footer>
            </main>
        </>
    );
}
