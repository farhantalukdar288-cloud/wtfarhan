import type { AppProps } from 'next/app';
import '../styles/global.css';
import NotebookWalker from '../components/NotebookWalker';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <NotebookWalker />
    </>
  );
}
