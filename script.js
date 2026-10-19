const clockNode = document.querySelector("[data-clock]");

const windows = Array.from(document.querySelectorAll(".window"));
const taskButtons = Array.from(
  document.querySelectorAll(".taskbar [data-window-target]")
);
const startMenuItems = Array.from(
  document.querySelectorAll(".start-menu [data-window-target]")
);
const startMenu = document.getElementById("start-menu");
const startToggle = document.querySelector("[data-start-toggle]");
const shutdownButtons = Array.from(document.querySelectorAll("[data-shutdown]"));
const powerButtons = Array.from(document.querySelectorAll("[data-power-on]"));
const bootLog = document.getElementById("boot-log");
const bootProgress = document.getElementById("boot-progress");

let zTop = 40;
let bootTimers = [];

const bootLines = [
  { text: "ForBloodB BIOS v2.6.1", color: "#c0c0c0", delay: 350 },
  { text: "CPU: V80 (RISC-V) @ 1.5 GHz", color: "#c0c0c0", delay: 400 },
  { text: "Memory Test: 16384K OK", color: "#c0c0c0", delay: 400 },
  { text: "Detecting storage ... OK", color: "#c0c0c0", delay: 350 },
  { text: "", color: "", delay: 200 },
  { text: "Loading bootloader ...", color: "#9cdcfe", delay: 450 },
  { text: "Loading kernel image ...", color: "#9cdcfe", delay: 450 },
  { text: "Decompressing kernel ... done.", color: "#9cdcfe", delay: 500 },
  { text: "Booting the kernel.", color: "#9cdcfe", delay: 400 },
  { text: "", color: "", delay: 150 },
  { text: "[    0.000000] Booting Linux on RISC-V", color: "#4ec9b0", delay: 300 },
  { text: "[    0.184223] CPU0: Online", color: "#4ec9b0", delay: 260 },
  { text: "[    0.391024] FPGA accelerator: TAPA ready", color: "#4ec9b0", delay: 260 },
  { text: "[    0.552110] HLS compiler: XLS loaded", color: "#4ec9b0", delay: 260 },
  { text: "[    0.733301] Security core: initialized", color: "#4ec9b0", delay: 260 },
  { text: "[    0.910005] Freeing unused kernel memory", color: "#4ec9b0", delay: 260 },
  { text: "", color: "", delay: 120 },
  { text: "Starting PERSONAL WORKSTATION ...", color: "#ffffff", delay: 400 },
];

function updateClock() {
  if (!clockNode) {
    return;
  }

  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  clockNode.textContent = timeFormatter.format(now);
}

function getWindow(id) {
  return document.querySelector(`.window[data-window="${id}"]`);
}

function syncTaskbar() {
  taskButtons.forEach((button) => {
    const win = getWindow(button.dataset.windowTarget);
    if (!win) {
      return;
    }

    const closed = win.classList.contains("is-closed");
    const minimized = win.classList.contains("is-minimized");
    const focused = win.classList.contains("is-focused");

    button.hidden = closed;
    button.classList.toggle("is-minimized", minimized);
    button.classList.toggle("is-active", !minimized && !closed && focused);
    button.classList.toggle("is-open", !minimized && !closed && !focused);
  });
}

function focusWindow(id) {
  const win = getWindow(id);
  if (!win) {
    return;
  }

  win.classList.remove("is-minimized");
  win.classList.remove("is-closed");

  const wasFocused = win.classList.contains("is-focused");
  windows.forEach((w) => w.classList.toggle("is-focused", w === win));

  if (!wasFocused) {
    zTop += 1;
    win.style.zIndex = String(zTop);
  }

  syncTaskbar();
}

function minimizeWindow(id) {
  const win = getWindow(id);
  if (!win) {
    return;
  }

  win.classList.add("is-minimized");
  win.classList.remove("is-closed");
  win.classList.remove("is-focused");
  syncTaskbar();
}

function closeWindow(id) {
  const win = getWindow(id);
  if (!win) {
    return;
  }

  win.classList.add("is-closed");
  win.classList.remove("is-minimized");
  win.classList.remove("is-focused");
  syncTaskbar();
}

function toggleWindow(id) {
  const win = getWindow(id);
  if (!win) {
    return;
  }

  if (
    win.classList.contains("is-closed") ||
    win.classList.contains("is-minimized")
  ) {
    focusWindow(id);
  } else if (win.classList.contains("is-focused")) {
    minimizeWindow(id);
  } else {
    focusWindow(id);
  }
}

function openStartMenu() {
  if (!startMenu || !startToggle) {
    return;
  }
  startMenu.hidden = false;
  startToggle.classList.add("is-active");
  startToggle.setAttribute("aria-expanded", "true");
}

function closeStartMenu() {
  if (!startMenu || !startToggle) {
    return;
  }
  startMenu.hidden = true;
  startToggle.classList.remove("is-active");
  startToggle.setAttribute("aria-expanded", "false");
}

function toggleStartMenu() {
  if (startMenu.hidden) {
    openStartMenu();
  } else {
    closeStartMenu();
  }
}

function saveGeometry(win) {
  win.dataset.prevPosition = win.style.position;
  win.dataset.prevLeft = win.style.left;
  win.dataset.prevTop = win.style.top;
  win.dataset.prevWidth = win.style.width;
  win.dataset.prevHeight = win.style.height;
}

function restoreGeometry(win) {
  win.style.position = win.dataset.prevPosition || "";
  win.style.left = win.dataset.prevLeft || "";
  win.style.top = win.dataset.prevTop || "";
  win.style.width = win.dataset.prevWidth || "";
  win.style.height = win.dataset.prevHeight || "";
}

function maximizeWindow(win) {
  if (win.classList.contains("is-maximized")) {
    return;
  }

  saveGeometry(win);

  const pad = 6;
  const taskbarHeight = 46;

  win.style.position = "fixed";
  win.style.left = `${pad}px`;
  win.style.top = `${pad}px`;
  win.style.width = `${window.innerWidth - pad * 2}px`;
  win.style.height = `${window.innerHeight - taskbarHeight - pad * 2}px`;
  win.classList.add("is-maximized");

  focusWindow(win.dataset.window);
}

function restoreWindow(win) {
  if (!win.classList.contains("is-maximized")) {
    return;
  }

  restoreGeometry(win);
  win.classList.remove("is-maximized");
}

function toggleMaximize(win) {
  if (win.classList.contains("is-maximized")) {
    restoreWindow(win);
  } else {
    maximizeWindow(win);
  }
}

function appendBootLine(text, color) {
  if (!bootLog) {
    return;
  }

  const line = document.createElement("div");
  line.className = "boot-line";
  if (color) {
    line.style.color = color;
  }
  line.textContent = text || "\u00A0";
  bootLog.appendChild(line);
  bootLog.scrollTop = bootLog.scrollHeight;
}

function clearBootTimers() {
  bootTimers.forEach((timer) => window.clearTimeout(timer));
  bootTimers = [];
}

function resetWindows() {
  windows.forEach((win) => {
    if (win.classList.contains("is-maximized")) {
      restoreWindow(win);
    }
    win.classList.remove("is-minimized");
    win.classList.remove("is-focused");
    win.classList.add("is-closed");
  });
}

function finishBoot() {
  resetWindows();
  document.body.classList.remove("is-booting");
  document.body.classList.remove("is-shutdown");
  syncTaskbar();
}

function runBootSequence() {
  clearBootTimers();

  if (bootLog) {
    bootLog.textContent = "";
  }
  if (bootProgress) {
    bootProgress.hidden = true;
  }

  let elapsed = 0;
  bootLines.forEach((entry) => {
    elapsed += entry.delay;
    bootTimers.push(
      window.setTimeout(() => {
        appendBootLine(entry.text, entry.color);
      }, elapsed)
    );
  });

  const progressAt = elapsed + 350;
  bootTimers.push(
    window.setTimeout(() => {
      if (bootProgress) {
        bootProgress.hidden = false;
      }
    }, progressAt)
  );

  bootTimers.push(
    window.setTimeout(() => {
      finishBoot();
    }, progressAt + 1400)
  );
}

function shutdown() {
  closeStartMenu();
  document.body.classList.remove("is-booting");
  document.body.classList.add("is-shutdown");
}

function powerOn() {
  document.body.classList.remove("is-shutdown");
  document.body.classList.add("is-booting");
  runBootSequence();
}

function enableDrag(win) {
  if (window.matchMedia("(max-width: 720px)").matches) {
    return;
  }

  const bar = win.querySelector(".window-titlebar");
  if (!bar) {
    return;
  }

  bar.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest(".window-controls")) {
      return;
    }

    if (win.classList.contains("is-maximized")) {
      return;
    }

    event.preventDefault();
    focusWindow(win.dataset.window);

    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = win.offsetLeft;
    const startTop = win.offsetTop;

    document.body.classList.add("is-dragging");

    function onMove(moveEvent) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = startLeft + (moveEvent.clientX - startX);
      let top = startTop + (moveEvent.clientY - startY);

      // Keep at least 80px of the window (its title bar area) on screen.
      left = Math.min(Math.max(left, 80 - win.offsetWidth), viewportWidth - 80);
      top = Math.min(Math.max(top, 0), viewportHeight - 70);

      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.classList.remove("is-dragging");
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  bar.addEventListener("dblclick", (event) => {
    if (event.target.closest(".window-controls")) {
      return;
    }
    toggleMaximize(win);
  });
}

window.addEventListener("load", () => {
  updateClock();
  window.setInterval(updateClock, 30000);

  runBootSequence();

  windows.forEach((win) => {
    enableDrag(win);

    // Clicking anywhere on a window brings it to the front.
    win.addEventListener("mousedown", () => {
      focusWindow(win.dataset.window);
    });

    win.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (button.dataset.action === "close") {
          closeWindow(win.dataset.window);
        } else {
          minimizeWindow(win.dataset.window);
        }
      });
    });
  });

  taskButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toggleWindow(button.dataset.windowTarget);
    });
  });

  if (startToggle) {
    startToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleStartMenu();
    });
  }

  startMenuItems.forEach((item) => {
    item.addEventListener("click", () => {
      focusWindow(item.dataset.windowTarget);
      closeStartMenu();
    });
  });

  shutdownButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      shutdown();
    });
  });

  powerButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      powerOn();
    });
  });

  document.addEventListener("click", (event) => {
    if (document.body.classList.contains("is-shutdown")) {
      return;
    }

    if (startMenu && !startMenu.hidden) {
      if (
        !event.target.closest(".start-menu") &&
        !event.target.closest("[data-start-toggle]")
      ) {
        closeStartMenu();
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (document.body.classList.contains("is-shutdown")) {
      return;
    }

    if (event.key === "Escape") {
      closeStartMenu();
    }
  });
});
