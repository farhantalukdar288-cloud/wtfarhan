import type { AppProps } from 'next/app';
import BubbleCharacter from '../components/BubbleCharacter';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <BubbleCharacter />
    </>
  );
}
