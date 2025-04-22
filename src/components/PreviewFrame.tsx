import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
  onProgressUpdate: (progress: number) => void;
  onReady: () => void;
}

export function PreviewFrame({ files, webContainer, onProgressUpdate, onReady }: PreviewFrameProps) {

  const [url, setUrl] = useState("");

  // async function main() {
  //   const installProcess = await webContainer.spawn('npm', ['install']);

  //   let outputLength = 0;

  //   const writable = new WritableStream({
  //     write(chunk, data) {
  //       console.log(data)
  //       outputLength += chunk.length;
  //       const progress = Math.min(100, Math.floor((outputLength / 10000) * 100)); // Arbitrary scaling
  //       onProgressUpdate(progress);
  //     },
  //   });

  //   installProcess.output.pipeTo(writable);

  //   await installProcess.exit;

  //    await webContainer.spawn('npm', ['run', 'dev']);

  //   webContainer.on('server-ready', (port, url) => {
  //     // onProgressUpdate(100);
  //     // onReady();
  //     // const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
  //     // if (iframe) iframe.src = url;
  //     console.log(port)
  //     setUrl(url);
  //     onReady();
  //   });
  // }

  async function main() {
    if (!webContainer) {
      console.error("WebContainer is not defined");
      return;
    }
  
    const installProcess = await webContainer.spawn('npm', ['install']);
  
    let outputLength = 0;
  
    const writable = new WritableStream({
      write(chunk, data) {
        console.log(data);
        outputLength += chunk.length;
        const progress = Math.min(100, Math.floor((outputLength / 10000) * 100)); // Arbitrary scaling
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

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url && <div className="text-center">
        <p className="mb-2">Loading...</p>
      </div>}
      {url && <iframe width={"100%"} height={"100%"} src={url} />}
    </div>
  )
  // <iframe id="preview-frame" className="w-full h-full hidden" />;
}














// import { WebContainer } from '@webcontainer/api';
// import React, { useEffect, useState } from 'react';

// interface PreviewFrameProps {
//   files: any[];
//   webContainer: WebContainer;
// }

// export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
//   // In a real implementation, this would compile and render the preview
//   const [url, setUrl] = useState("");

//   async function main() {
//     const installProcess = await webContainer.spawn('npm', ['install']);

//     installProcess.output.pipeTo(new WritableStream({
//       write(data) {
//         console.log(data);
//       }
//     }));

//     await webContainer.spawn('npm', ['run', 'dev']);

//     // Wait for `server-ready` event
//     webContainer.on('server-ready', (port, url) => {
//       // ...
//       console.log(url)
//       console.log(port)
//       setUrl(url);
//     });
//   }

//   useEffect(() => {
//     main()
//   }, [])
//   return (
    // <div className="h-full flex items-center justify-center text-gray-400">
    //   {!url && <div className="text-center">
    //     <p className="mb-2">Loading...</p>
    //   </div>}
    //   {url && <iframe width={"100%"} height={"100%"} src={url} />}
    // </div>
//   );
// }