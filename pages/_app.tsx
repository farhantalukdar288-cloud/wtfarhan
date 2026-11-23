import '../styles/globals.css';
import BubbleCharacter from '../components/BubbleCharacter';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <BubbleCharacter />
    </>
  );
}
