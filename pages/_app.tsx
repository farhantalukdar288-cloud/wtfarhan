import type { AppProps } from 'next/app';
import Script from 'next/script';
import '../styles/global.css';

export default function App({ Component, pageProps }: AppProps) {
    return <><Script src='https://www.googletagmanager.com/gtag/js?id=G-04JF0H8719' strategy='afterInteractive' /><Script id='google-analytics' strategy='afterInteractive'>{`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-04JF0H8719');`}</Script><Component {...pageProps} /></>;
}
