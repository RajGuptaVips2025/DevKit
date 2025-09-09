import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader } from './Loader';

let previewFrameHasRun = false;

interface PreviewFrameProps {
  files?: any[];
  webContainer?: WebContainer | undefined;
  onProgressUpdate: (progress: number) => void;
  onReady: () => void;
  framework?: string;
  activeTab: string;
}

export function PreviewFrame({
  webContainer,
  onProgressUpdate,
  onReady,
  framework,
  activeTab,
}: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const installStartedRef = useRef(false);
  const [installStarted, setInstallStarted] = useState(false);
  const installProcessRef = useRef<any>(null);
  const devProcessRef = useRef<any>(null);

  async function main() {
    console.log('[PreviewFrame] main() starting');

    if (!webContainer) {
      console.error("[PreviewFrame] webContainer is not defined");
      return;
    }


    const installProcess = await webContainer.spawn("npm", ["install"]);
    installProcessRef.current = installProcess;

    let outputLength = 0;

    const writable = new WritableStream({
      write(chunk: any) {
        if (!installStarted) setInstallStarted(true);
        installStartedRef.current = true;
        outputLength += chunk?.length ?? 0;
        const progress = Math.min(100, Math.floor((outputLength / 10000) * 100));
        onProgressUpdate(progress);
      },
    });

    installProcess.output.pipeTo(writable);
    await installProcess.exit;

    const devProcess =
      framework === "angular"
        ? await webContainer.spawn("ng", ["serve"])
        : await webContainer.spawn("npm", ["run", "dev"]);

    devProcessRef.current = devProcess;

    webContainer.on("server-ready", (port: number, serverUrl: string) => {
      console.log("[PreviewFrame] server-ready", port, serverUrl);
      setUrl(serverUrl);
      onReady();
    });
  }

  useEffect(() => {
    if (
      activeTab === "preview" &&
      !previewFrameHasRun &&
      webContainer
    ) {
      previewFrameHasRun = true;
      main();
    }
  }, [activeTab, webContainer]);


  useEffect(() => {
    return () => {
      if (installProcessRef.current) {
        installProcessRef.current.kill();
        installProcessRef.current = null;
      }
      if (devProcessRef.current) {
        devProcessRef.current.kill();
        devProcessRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "runtime-error") {
        toast.error(`Runtime Error: ${event.data.message}`);
      }
      if (event.data?.type === "unhandled-rejection") {
        toast.error(`Unhandled Rejection: ${event.data.message}`);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // useEffect(() => {
  //   let lastMessage = "";

  //   const handler = (event: MessageEvent) => {
  //     const { type, message } = event.data || {};
  //     if (!type || !message) return;

  //     const key = `${type}:${message}`;
  //     if (lastMessage === key) return; // skip duplicate

  //     lastMessage = key;

  //     if (type === "runtime-error") {
  //       toast.error(`Runtime Error: ${message}`);
  //     }
  //     if (type === "unhandled-rejection") {
  //       toast.error(`Unhandled Rejection: ${message}`);
  //     }
  //   };

  //   window.addEventListener("message", handler);
  //   return () => window.removeEventListener("message", handler);
  // }, []);


  return (
    <div className="h-full flex items-start justify-center text-gray-400">
      {!url && (
        <div className="w-full h-full">
          {!installStarted ? (
            <p className="pt-24 mb-2 text-3xl text-white text-center">
              If Installation hasn&apos;t started, try refreshing the page.
            </p>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="scale-150">
                <Loader />
              </div>
            </div>
          )}
        </div>
      )}
      {url && (
        <iframe ref={iframeRef} src={url} width="100%" height="100%" />
      )}
    </div>
  )
}