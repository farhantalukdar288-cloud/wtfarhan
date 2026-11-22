import Head from 'next/head';
import Link from 'next/link';
import { Instagram, Facebook, MessageCircle, Clapperboard } from 'lucide-react';

const XIcon = () => <span aria-hidden="true" style={{ fontWeight: 900, fontSize: 22 }}>𝕏</span>;

const items = [
    { name: 'Instagram', Icon: Instagram, href: 'https://www.instagram.com/farhan21112009/' },
    { name: 'Facebook', Icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61585893830791' },
    { name: 'WhatsApp', Icon: MessageCircle, href: 'https://wa.me/8801631655756' },
    { name: 'X (Twitter)', Icon: XIcon, href: 'https://x.com/wtfarhanxuz' },
    { name: 'Letterboxd', Icon: Clapperboard, href: 'https://boxd.it/mnCnn' },
];

export default function Socials() {
    return (
        <>
            <Head>
                <title>Socials — FARHAN</title>
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
                <section className="inner">
                    <div className="eyebrow">MY SOCIALS</div>
                    <h1>Find me <em>online.</em></h1>
                    <p className="lead">My public profiles, gathered in one place so you can find the right account.</p>
                    <div className="socialgrid">
                        {items.map(({ name, Icon, href }) => (
                            <a key={name} href={href} target="_blank" rel="noreferrer">
                                <Icon /><span>{name}</span><b>↗</b>
                            </a>
                        ))}
                    </div>
                </section>
                <footer><Link href="/">← Home</Link><span>Public profiles only</span></footer>
            </main>
        </>
    );
}
