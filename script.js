const bootDelayMs = 950;
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

let zTop = 40;

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

    const minimized = win.classList.contains("is-minimized");
    const focused = win.classList.contains("is-focused");

    button.classList.toggle("is-minimized", minimized);
    button.classList.toggle("is-active", !minimized && focused);
    button.classList.toggle("is-open", !minimized && !focused);
  });
}

function focusWindow(id) {
  const win = getWindow(id);
  if (!win) {
    return;
  }

  win.classList.remove("is-minimized");

  const wasFocused = win.classList.contains("is-focused");
  windows.forEach((w) => w.classList.toggle("is-focused", w === win));

  if (!wasFocused) {
    zTop += 1;
    win.style.zIndex = String(zTop);
  }

  syncTaskbar();
}

function hideWindow(id) {
  const win = getWindow(id);
  if (!win) {
    return;
  }

  win.classList.add("is-minimized");
  win.classList.remove("is-focused");
  syncTaskbar();
}

function toggleWindow(id) {
  const win = getWindow(id);
  if (!win) {
    return;
  }

  if (win.classList.contains("is-minimized")) {
    focusWindow(id);
  } else if (win.classList.contains("is-focused")) {
    hideWindow(id);
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
}

window.addEventListener("load", () => {
  updateClock();
  window.setInterval(updateClock, 30000);

  window.setTimeout(() => {
    document.body.classList.remove("is-booting");
  }, bootDelayMs);

  windows.forEach((win) => {
    enableDrag(win);

    // Clicking anywhere on a window brings it to the front.
    win.addEventListener("mousedown", () => {
      focusWindow(win.dataset.window);
    });

    win.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        hideWindow(win.dataset.window);
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

  document.addEventListener("click", (event) => {
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
    if (event.key === "Escape") {
      closeStartMenu();
    }
  });

  const first = windows[0];
  if (first) {
    focusWindow(first.dataset.window);
  }
});
