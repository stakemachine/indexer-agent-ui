import "../styles/globals.css";

import type { AppProps } from "next/app";
import Head from "next/head";
import Navbar from "../components/Layout/Navbar";
import { Toaster } from "react-hot-toast";

import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <SessionProvider session={pageProps.session}>
        <Head>
          <title>Agent UI</title>
        </Head>
        <main className="min-h-screen w-full bg-gray-100">
          <Navbar />

          <div className="flex min-h-screen flex-col overflow-hidden p-4 sm:p-8">
            <Component {...pageProps} />
          </div>
          <Toaster toastOptions={{ position: "bottom-center" }} />
        </main>
      </SessionProvider>
    </>
  );
}

export default MyApp;
