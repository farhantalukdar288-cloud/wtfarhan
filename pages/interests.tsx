import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Clapperboard, Music2 } from 'lucide-react';

export default function Interests() {
    return (
        <>
            <Head>
                <title>Interest & More — FARHAN</title>
                <meta name="description" content="Farhan's Interest & More page." />
                <link rel="manifest" href="/manifest.json" />
            </Head>
            <main className="site interest-page">
                <nav className="nav">
                    <Link href="/" className="brand">F<span>•</span></Link>
                    <div className="navlinks">
                        <Link href="/about">About</Link>
                        <Link href="/contact">Contact</Link>
                        <Link href="/socials">Socials</Link>
                    </div>
                </nav>
                <section className="interest-intro">
                    <Link href="/" className="back-link"><ArrowLeft size={15} /> Back to my world</Link>
                    <div className="interest-kicker"><span>06</span><i /> INTEREST & MORE</div>
                    <h1>INTEREST <em>& MORE</em></h1>
                    <p>A small space for the things I am into right now.</p>
                </section>
                <section className="interest-grid single-interest">
                    <Link href="/playlist" className="interest-card playlist-card">
                        <div className="interest-card-top"><span>01</span><Music2 size={21} /></div>
                        <div className="playlist-icon"><Music2 size={30} /></div>
                        <div className="interest-copy">
                            <small>MUSIC</small>
                            <h2>My Current Playlist</h2>
                            <p>The songs I am listening to right now.</p>
                        </div>
                        <ArrowUpRight className="interest-arrow" size={20} />
                    </Link>
                    <Link href="/movies" className="interest-card movies-interest-card">
                        <div className="interest-card-top"><span>02</span><Clapperboard size={21} /></div>
                        <div className="movies-interest-icon"><Clapperboard size={30} /></div>
                        <div className="interest-copy">
                            <small>MOVIES & VIDEOS</small>
                            <h2>Movies</h2>
                            <p>A small collection of YouTube videos to watch.</p>
                        </div>
                        <ArrowUpRight className="interest-arrow" size={20} />
                    </Link>
                </section>
                <footer><span>© 2026 FARHAN</span><span>Made for my world.</span></footer>
            </main>
        </>
    );
}
