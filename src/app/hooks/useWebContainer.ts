import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | undefined;

export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | undefined>();

  useEffect(() => {
    async function main() {
      if (!webcontainerInstance) {
        webcontainerInstance = await WebContainer.boot();
      }
      setWebcontainer(webcontainerInstance);
    }

    main();
  }, []);

  return webcontainer;
}