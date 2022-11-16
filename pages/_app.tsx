import "../styles/globals.css";
import "../styles/ka-table.css";
import "@tremor/react/dist/esm/tremor.css";

import type { AppProps } from "next/app";
import Head from "next/head";
import Navbar from "../components/Layout/Navbar";
import { Toaster } from "react-hot-toast";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Agent UI</title>
      </Head>
      <main className="min-h-screen w-full bg-gray-100">
        <Navbar />
        <div className="flex flex-col min-h-screen overflow-hidden p-4 sm:p-8">
          <Component {...pageProps} />
        </div>
        <Toaster toastOptions={{ position: "bottom-center" }} />
      </main>
    </>
  );
}

export default MyApp;
