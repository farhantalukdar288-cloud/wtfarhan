import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
    return (
        <>
            <Head>
                <title>FARHAN — My World</title>
                <meta name="description" content="A personal corner of the internet for Farhan Talukdar." />
                <link rel="manifest" href="/manifest.json" />
            </Head>
            <main className="site">
                <nav className="nav">
                    <Link href="/" className="brand">F<span>•</span></Link>
                    <div className="navlinks">
                        <Link href="/about">About</Link>
                        <Link href="/contact">Contact</Link>
                        <Link href="/socials">Socials</Link>
                    </div>
                </nav>
                <section className="hero">
                    <div className="eyebrow"><Sparkles size={15} /> PERSONAL SPACE</div>
                    <h1>Hey, I’m <em>FARHAN.</em></h1>
                    <p className="lead">Welcome to my little corner of the internet — everything here is about me, my links, and the places you can find me online.</p>
                    <div className="actions">
                        <Link href="/about" className="primary">Get to know me <ArrowRight size={18} /></Link>
                        <Link href="/contact" className="secondary">Contact me</Link>
                    </div>
                </section>
                <section className="cards">
                    <article><span className="num">01</span><h2>Chat With My AI</h2><p>Ask my AI about me, my interests, favourites and the story behind this little website.</p><Link href="/chat">Chat now →</Link></article>
                    <article><span className="num">02</span><h2>Who I am</h2><p>A personal profile with my story, interests and what I’m working toward.</p><Link href="/about">Explore →</Link></article>
                    <article><span className="num">03</span><h2>Reach me</h2><p>My public contact details in one simple, easy-to-share place.</p><Link href="/contact">Contact →</Link></article>
                    <article><span className="num">04</span><h2>Find me</h2><p>My social profiles and other public accounts, all together.</p><Link href="/socials">Socials →</Link></article>
                    <article><span className="num">05</span><h2>A Note From Me</h2><p>A small, honest note about why I made this little corner of the internet.</p><Link href="/note">Read my note →</Link></article>
                    <article><span className="num">06</span><h2>Interest & More</h2><p>A closer look at the things I keep coming back to — beyond the usual profile.</p><Link href="/interests">Open the space →</Link></article>
                </section>
                <footer><span>© 2026 FARHAN</span><span>Made for my world.</span></footer>
            </main>
        </>
    );
}
