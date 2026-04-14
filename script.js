const bootLog = document.getElementById("boot-log");

if (bootLog) {
  const bootLines = Array.from(bootLog.querySelectorAll(".boot-line"));
  const rawData = bootLog.dataset.lines;
  let parsedLines = [];

  try {
    parsedLines = JSON.parse(rawData || "[]");
  } catch (error) {
    parsedLines = [];
  }

  const lines = parsedLines.length > 0 ? parsedLines : bootLines.map((line) => line.textContent || "");

  if (document.documentElement.classList.contains("js") && lines.length > 0) {
    bootLog.textContent = "";

    lines.forEach((lineText, index) => {
      const lineElement = document.createElement("span");
      lineElement.className = "boot-line";
      lineElement.textContent = lineText;

      window.setTimeout(() => {
        lineElement.classList.add("is-visible");
        bootLog.append(lineElement);

        if (index !== lines.length - 1) {
          bootLog.append("\n");
        }
      }, 260 * index + 180);
    });
  }
}
