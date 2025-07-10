import { FileItem } from "../types";

const ERROR_HANDLER_SCRIPT = `
<script>
  window.addEventListener('error', function (e) {
    window.parent.postMessage(
      {
        type: 'runtime-error',
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      },
      '*'
    );
  });

  window.addEventListener('unhandledrejection', function (e) {
    window.parent.postMessage(
      {
        type: 'unhandled-rejection',
        message: e.reason?.toString?.() || 'Unhandled rejection',
      },
      '*'
    );
  });
</script>
`;

export function injectRuntimeErrorHandler(files: FileItem[]): FileItem[] {
  return files.map((file) => {
    if (
      file.type === 'file' &&
      file.path.endsWith('index.html') &&
      typeof file.content === 'string'
    ) {
      if (!file.content.includes('window.parent.postMessage')) {
        const insertIndex = file.content.lastIndexOf('</body>');

        file.content =
          insertIndex !== -1
            ? file.content.slice(0, insertIndex) + ERROR_HANDLER_SCRIPT + file.content.slice(insertIndex)
            : file.content + ERROR_HANDLER_SCRIPT;
      }
    }

    return file;
  });
}
