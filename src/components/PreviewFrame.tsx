import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
  onProgressUpdate: (progress: number) => void;
  onReady: () => void;
}

export function PreviewFrame({ webContainer, onProgressUpdate, onReady }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const toastShownRef = useRef(false);
  const installStartedRef = useRef(false);

  async function main() {
    if (!webContainer) {
      console.error("WebContainer is not defined");
      return;
    }

    const installProcess = await webContainer.spawn('npm', ['install']);

    let outputLength = 0;

    // ⏰ Set a timer to warn if no install output within 3 seconds
    setTimeout(() => {
      if (!installStartedRef.current && !toastShownRef.current) {
        toast(
          "⚠️ If dependencies haven't started installing, try refreshing the browser and running it again.",
          {
            icon: '⚠️',
            style: {
              background: '#facc15',
              color: '#000',
            },
          }
        );
        toastShownRef.current = true;
      }
    }, 3000); // 3 seconds

    const writable = new WritableStream({
      write(chunk, data) {
        console.log(data);
        installStartedRef.current = true; // ✅ Mark install output has started

        outputLength += chunk.length;
        const progress = Math.min(100, Math.floor((outputLength / 10000) * 100));
        onProgressUpdate(progress);
      },
    });

    installProcess.output.pipeTo(writable);
    await installProcess.exit;

    await webContainer.spawn('npm', ['run', 'dev']);

    webContainer.on('server-ready', (port, url) => {
      console.log(port);
      setUrl(url);
      onReady();
    });
  }

  useEffect(() => {
    main();
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'runtime-error') {
        toast.error(`Runtime Error: ${event.data.message}`);
      }
      if (event.data?.type === 'unhandled-rejection') {
        toast.error(`Unhandled Rejection: ${event.data.message}`);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url &&
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>}
      {url && <iframe ref={iframeRef} src={url} width="100%" height="100%" />}
    </div>
  );
}