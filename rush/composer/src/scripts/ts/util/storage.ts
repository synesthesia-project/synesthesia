export function saveStringAsFile(data: string, filename: string) {
  const blob = new Blob([data], {type: 'text/plain'});
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(
    () => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    0);
}

export function loadFileAsString() {
  return new Promise<string>(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.scue';
    input.onchange = () => {
      if (!input.files || input.files.length === 0) return;
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result ? reader.result.toString() : '');
      reader.readAsText(input.files[0]);
    };
    input.click();
  });
}
