// import { WebContainer } from '@webcontainer/api';
// import React, { useEffect, useRef, useState } from 'react';
// import toast from 'react-hot-toast';

// interface PreviewFrameProps {
//   files: any[];
//   webContainer: WebContainer;
//   onProgressUpdate: (progress: number) => void;
//   onReady: () => void;
//   framework:string;
// }

// export function PreviewFrame({ webContainer, onProgressUpdate, onReady, framework }: PreviewFrameProps) {
//   const [url, setUrl] = useState("");
//   const iframeRef = useRef<HTMLIFrameElement>(null);
//   const toastShownRef = useRef(false);
//   const installStartedRef = useRef(false);

//   async function main() {
//     if (!webContainer) {
//       console.error("WebContainer is not defined");
//       return;
//     }

//     const installProcess = await webContainer.spawn('npm', ['install']);

//     let outputLength = 0;

//     // ⏰ Set a timer to warn if no install output within 3 seconds
//     setTimeout(() => {
//       if (!installStartedRef.current && !toastShownRef.current) {
//         toast(
//           "⚠️ If dependencies haven't started installing, try refreshing the browser and running it again.",
//           {
//             icon: '⚠️',
//             style: {
//               background: '#facc15',
//               color: '#000',
//             },
//           }
//         );
//         toastShownRef.current = true;
//       }
//     }, 3000); // 3 seconds

//     const writable = new WritableStream({
//       write(chunk, data) {
//         console.log(data);
//         installStartedRef.current = true; // ✅ Mark install output has started

//         outputLength += chunk.length;
//         const progress = Math.min(100, Math.floor((outputLength / 10000) * 100));
//         onProgressUpdate(progress);
//       },
//     });

//     installProcess.output.pipeTo(writable);
//     await installProcess.exit;

//     if (framework === 'angular') {
//       await webContainer.spawn('ng', ['serve']);
//     } else {
//       await webContainer.spawn('npm', ['run', 'dev']);
//     }
    
//     webContainer.on('server-ready', (port, url) => {
//       console.log(port);
//       setUrl(url);
//       onReady();
//     });
//   }

//   useEffect(() => {
//     main();
//   }, []);

//   useEffect(() => {
//     const handler = (event: MessageEvent) => {
//       if (event.data?.type === 'runtime-error') {
//         toast.error(`Runtime Error: ${event.data.message}`);
//       }
//       if (event.data?.type === 'unhandled-rejection') {
//         toast.error(`Unhandled Rejection: ${event.data.message}`);
//       }
//     };

//     window.addEventListener('message', handler);
//     return () => window.removeEventListener('message', handler);
//   }, []);

//   return (
//     <div className="h-full flex items-center justify-center text-gray-400">
//       {!url &&
//         <div className="text-center">
//           <p className="mb-2">Loading...</p>
//         </div>}
//       {url && <iframe ref={iframeRef} src={url} width="100%" height="100%" />}
//     </div>
//   );
// }


import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

let previewFrameHasRun = false; // ✅ persists across mounts

interface PreviewFrameProps {
  files?: any[];
  webContainer?: WebContainer | undefined;
  onProgressUpdate: (progress: number) => void;
  onReady: () => void;
  framework?: string;
  activeTab: string; // 👈 pass activeTab from parent
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
  const toastShownRef = useRef(false);
  const installStartedRef = useRef(false);
console.log(framework)
  async function main() {
    console.log('[PreviewFrame] main() starting');

    if (!webContainer) {
      console.error("[PreviewFrame] webContainer is not defined");
      return;
    }

    const installProcess = await webContainer.spawn('npm', ['install']);
    let outputLength = 0;

    setTimeout(() => {
      if (!installStartedRef.current && !toastShownRef.current) {
        toast(
          "⚠️ If dependencies haven't started installing, try refreshing and running again.",
          { icon: '⚠️', style: { background: '#facc15', color: '#000' } }
        );
        toastShownRef.current = true;
      }
    }, 3000);

    const writable = new WritableStream({
      write(chunk: any,data) {
        console.log(data)
        installStartedRef.current = true;
        outputLength += (chunk?.length ?? 0);
        const progress = Math.min(100, Math.floor((outputLength / 10000) * 100));
        onProgressUpdate(progress);
      },
    });

    installProcess.output.pipeTo(writable);
    await installProcess.exit;

    if (framework == 'angular') {
      console.log('angular')
      await webContainer.spawn('ng', ['serve']);
    } else {
      console.log('react \n\n\n\n\n\n\n\n\n\n\n')
      await webContainer.spawn('npm', ['run', 'dev']);
    }

    webContainer.on('server-ready', (port: number, serverUrl: string) => {
      console.log('[PreviewFrame] server-ready', port, serverUrl);
      setUrl(serverUrl);
      onReady();
    });
  }

  // 👇 Run only when first switch to preview happens
  useEffect(() => {
    if (
      activeTab === 'preview' &&
      !previewFrameHasRun &&
      webContainer // make sure container is ready
    ) {
      previewFrameHasRun = true;
      main();
    }
  }, [activeTab, webContainer]);

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
      {!url && <div className="text-center"><p className="mb-2">Loading...</p></div>}
      {url && <iframe ref={iframeRef} src={url} width="100%" height="100%" />}
    </div>
  );
}