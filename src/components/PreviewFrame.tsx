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
}