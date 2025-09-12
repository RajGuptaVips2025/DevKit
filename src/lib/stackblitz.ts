import sdk, { Project } from "@stackblitz/sdk";
import { FileItem } from "@/app/types";

function toStackblitzFiles(items: FileItem[], basePath = ""): Record<string, string> {
  const out: Record<string, string> = {};

  for (const item of items) {
    const fullPath = basePath ? `${basePath}/${item.name}` : item.name;

    if (item.type === "folder" && item.children) {
      Object.assign(out, toStackblitzFiles(item.children, fullPath));
    } else {
      let content: string = "";

      if (typeof item.content === "string") {
        content = item.content;
      } else if (item.content !== undefined && item.content !== null) {
        content = String(item.content);
      }

      out[fullPath] = content;
    }
  }

  return out;
}

export async function openInStackBlitz(filesArray: FileItem[]) {
  const files = toStackblitzFiles(filesArray);

  const project: Project = {
    title: "DevKit Project",
    description: "Generated in DevKit",
    template: "node",
    files,
  };

  sdk.openProject(project, {
    openFile: "src/App.tsx",
  });
}