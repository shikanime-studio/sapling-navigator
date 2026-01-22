import browser from "webextension-polyfill";

/**
 * Fetches the PR body from the DOM or via a fetch request if not present.
 */
async function getPrBody(): Promise<HTMLElement | null> {
  let prBody = document.querySelector(".comment-body") as HTMLElement | null;

  if (prBody) {
    console.log("Sapling: PR body found in DOM");
    return prBody;
  }

  console.log(
    "Sapling: PR body not found in DOM, checking URL for sub-page...",
  );
  const prUrlMatch = window.location.href.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/,
  );

  if (!prUrlMatch) {
    console.log("Sapling: URL does not match PR pattern");
    return null;
  }

  const [, owner, repo, number] = prUrlMatch;
  const mainPrUrl = `https://github.com/${owner}/${repo}/pull/${number}`;

  console.log("Sapling: Detected PR URL", mainPrUrl);

  if (window.location.href.split("?")[0] === mainPrUrl) {
    console.log("Sapling: Already on main PR page, but body not found yet.");
    return null;
  }

  try {
    console.log("Sapling: Fetching main PR page...");
    const response = await fetch(mainPrUrl);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    prBody = doc.querySelector(".comment-body") as HTMLElement | null;
    console.log("Sapling: Fetched PR body:", !!prBody);
    return prBody;
  } catch (e) {
    console.error("Sapling: Could not fetch PR body", e);
    return null;
  }
}

/**
 * Extracts the stack list element from the PR body if present.
 */
function getStackList(prBody: HTMLElement): HTMLElement | null {
  const isGhStack =
    prBody.innerText.includes("Stack from [ghstack]") ||
    prBody.innerText.includes("Stack from ghstack");
  const isSaplingStack =
    prBody.innerText.includes("Stack created with [Sapling]") ||
    prBody.innerText.includes("Stack created with Sapling");

  console.log("Sapling: Stack check:", { isGhStack, isSaplingStack });

  if (!isGhStack && !isSaplingStack) {
    return null;
  }

  const paragraphs = Array.from(prBody.querySelectorAll("p"));
  for (const p of paragraphs) {
    if (
      p.innerText.includes("Stack from [ghstack]") ||
      p.innerText.includes("Stack from ghstack") ||
      p.innerText.includes("Stack created with [Sapling]") ||
      p.innerText.includes("Stack created with Sapling")
    ) {
      let stackList = p.nextElementSibling as HTMLElement | null;
      while (
        stackList &&
        stackList.tagName !== "UL" &&
        stackList.tagName !== "OL"
      ) {
        stackList = stackList.nextElementSibling as HTMLElement | null;
      }
      return stackList;
    }
  }

  return null;
}

/**
 * Applies the current PR view suffix (e.g. /files, /commits, /checks) plus
 * query and hash to a target PR URL if it doesn't already have one.
 */
function applyCurrentView(targetHref: string): string {
  try {
    const currentUrl = new URL(window.location.href);
    const targetUrl = new URL(targetHref, window.location.origin);

    const currentMatch = currentUrl.pathname.match(
      /^(\/[^/]+\/[^/]+\/pull\/\d+)(\/.*)?$/,
    );
    const targetMatch = targetUrl.pathname.match(
      /^(\/[^/]+\/[^/]+\/pull\/\d+)(\/.*)?$/,
    );

    if (!currentMatch || !targetMatch) {
      return targetHref;
    }

    const currentSuffix = currentMatch[2] ?? "";
    const targetSuffix = targetMatch[2] ?? "";

    if (!targetSuffix && currentSuffix) {
      targetUrl.pathname = `${targetMatch[1]}${currentSuffix}`;
    }

    targetUrl.search = currentUrl.search;
    targetUrl.hash = currentUrl.hash;

    return targetUrl.toString();
  } catch {
    return targetHref;
  }
}

/**
 * Parses the stack list to find previous and next PR URLs, adjusted to match
 * the current GitHub PR view (main page, files, commits, checks).
 */
function getNavigationLinks(stackList: HTMLElement): {
  prevUrl: string | null;
  nextUrl: string | null;
} {
  let prevUrl: string | null = null;
  let nextUrl: string | null = null;
  const items = Array.from(stackList.querySelectorAll("li")) as HTMLLIElement[];
  const currentPrUrl = window.location.href.split("?")[0];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const link = item.querySelector("a");
    const text = item.innerText;
    const isCurrent =
      text.includes("Current PR") ||
      /^[*\s]*->/.test(text) ||
      (link && link.href.split("?")[0] === currentPrUrl);

    if (isCurrent) {
      console.log("Sapling: Current PR found at index", i);
      // In stacks (ghstack/sapling), usually the top is newer (Next) and bottom is older (Prev)
      // List:
      // - Next PR
      // - Current PR
      // - Prev PR
      if (i > 0) {
        const nextItem = items[i - 1];
        const nextLink = nextItem.querySelector(
          "a",
        ) as HTMLAnchorElement | null;
        if (nextLink) nextUrl = applyCurrentView(nextLink.href);
      }

      if (i < items.length - 1) {
        const prevItem = items[i + 1];
        const prevLink = prevItem.querySelector(
          "a",
        ) as HTMLAnchorElement | null;
        if (prevLink) prevUrl = applyCurrentView(prevLink.href);
      }
      break;
    }
  }

  return { prevUrl, nextUrl };
}

/**
 * Creates the navbar element if it doesn't exist.
 */
function createNavbar(): HTMLElement | null {
  const appMain = document.querySelector(
    ".application-main",
  ) as HTMLElement | null;
  if (!appMain) return null;

  let navbar = document.querySelector("#sapling-navbar") as HTMLElement | null;
  if (navbar) return navbar;

  console.log("Sapling: Creating navbar...");
  navbar = document.createElement("div");
  navbar.id = "sapling-navbar";
  navbar.className =
    "d-flex flex-justify-between flex-items-center px-3 py-2 color-bg-subtle border-top";
  Object.assign(navbar.style, {
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    zIndex: "999",
  });

  const leftGroup = document.createElement("div");
  leftGroup.className = "d-flex flex-items-center";
  const logo = document.createElement("span");
  logo.innerText = "🌱 Sapling";
  logo.className = "text-bold mr-2";
  leftGroup.appendChild(logo);
  navbar.appendChild(leftGroup);

  const rightGroup = document.createElement("div");
  rightGroup.id = "sapling-navbar-right";
  rightGroup.className = "d-flex flex-items-center";
  navbar.appendChild(rightGroup);

  document.body.appendChild(navbar);

  // Add offset to body to prevent overlap (footer crop issue)
  document.body.style.paddingBottom = "60px";

  return navbar;
}

/**
 * Updates the navbar with current links.
 */
function updateNavbar(prevUrl: string | null, nextUrl: string | null): void {
  const navbar = createNavbar();
  if (!navbar) return;

  const rightGroup = navbar.querySelector("#sapling-navbar-right");
  if (rightGroup) {
    rightGroup.innerHTML = "";

    // ReviewStack Button
    const prUrlMatch = window.location.href.match(
      /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/,
    );
    if (prUrlMatch) {
      const [, owner, repo, number] = prUrlMatch;
      const reviewStackUrl = `https://reviewstack.dev/${owner}/${repo}/pull/${number}`;
      const reviewStackBtn = document.createElement("a");
      reviewStackBtn.href = reviewStackUrl;
      reviewStackBtn.className = "btn btn-sm mr-2";
      reviewStackBtn.target = "_blank";
      reviewStackBtn.innerText = "Open in ReviewStack";
      rightGroup.appendChild(reviewStackBtn);
    }

    const btnGroup = document.createElement("div");
    btnGroup.className = "BtnGroup";

    // Prev
    if (prevUrl) {
      const prevBtn = document.createElement("a");
      prevBtn.href = prevUrl;
      prevBtn.className = "btn btn-sm BtnGroup-item";
      prevBtn.innerText = "Prev";
      btnGroup.appendChild(prevBtn);
    } else {
      const prevBtn = document.createElement("button");
      prevBtn.disabled = true;
      prevBtn.className = "btn btn-sm BtnGroup-item";
      prevBtn.innerText = "Prev";
      btnGroup.appendChild(prevBtn);
    }

    // Next
    if (nextUrl) {
      const nextBtn = document.createElement("a");
      nextBtn.href = nextUrl;
      nextBtn.className = "btn btn-sm BtnGroup-item";
      nextBtn.innerText = "Next";
      btnGroup.appendChild(nextBtn);
    } else {
      const nextBtn = document.createElement("button");
      nextBtn.disabled = true;
      nextBtn.className = "btn btn-sm BtnGroup-item";
      nextBtn.innerText = "Next";
      btnGroup.appendChild(nextBtn);
    }

    rightGroup.appendChild(btnGroup);
  }
}

/**
 * Injects styles to hide the merge PR button.
 */
function injectStyles(): void {
  const styleId = "sapling-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.innerHTML = `
    .merge-pr.is-merging [class*="MergeBox-module__mergePartialContainer"] > div > div:nth-child(3) {
      display: none !important;
    }
    .merge-pr.is-merging [class*="MergeBox-module__mergePartialContainer"] > div > section:nth-child(2) {
      border-bottom: none !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Injects a "Land" button next to the Comment button in the PR footer.
 */
function injectLandButton(): void {
  console.log("Sapling: Attempting to inject Land button...");

  let commentForm = document.querySelector(".js-new-comment-form");

  if (!commentForm) {
    console.log("Sapling: Comment form (.js-new-comment-form) not found");
    // Fallback: Find via textarea
    const textarea = document.querySelector("textarea[name='comment[body]']");
    if (textarea) {
      commentForm = textarea.closest("form");
      if (commentForm) {
        console.log("Sapling: Found comment form via textarea fallback");
      }
    }
  }

  if (!commentForm) {
    console.log("Sapling: Could not find comment form via any method");
    return;
  }

  let formActions = commentForm.querySelector(".form-actions");
  if (!formActions) {
    console.log(
      "Sapling: .form-actions not found, looking for submit button parent",
    );
    const submitBtn = commentForm.querySelector(
      "button[type='submit'], .btn-primary",
    );
    if (submitBtn) {
      formActions = submitBtn.parentElement;
      console.log("Sapling: Found form actions via submit button");
    }
  }

  if (!formActions) {
    console.log("Sapling: Form actions not found inside comment form");
    return;
  }

  // Check if already injected
  if (document.getElementById("sapling-land-button")) {
    console.log("Sapling: Land button already exists");
    return;
  }

  console.log("Sapling: Creating and appending Land button...");

  const landBtn = document.createElement("button");
  landBtn.id = "sapling-land-button";
  landBtn.type = "button";
  landBtn.className = "btn btn-primary ml-1";
  landBtn.innerText = "Land";
  landBtn.title = "Add .land comment and submit";
  landBtn.style.backgroundColor = "#2da44e"; // GitHub Green

  landBtn.onclick = () => {
    const textarea = commentForm!.querySelector("textarea");
    if (textarea) {
      // Set the value
      textarea.value = ".land";
      // Trigger input event so GitHub knows the value changed (important for React/frameworks)
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));

      // Find the submit button and click it
      const submitBtn = formActions!.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;

      if (submitBtn) {
        // Enable the submit button just in case it was disabled (e.g. empty comment)
        submitBtn.disabled = false;
        submitBtn.click();
      } else {
        console.error("Sapling: Submit button not found");
      }
    }
  };

  // Append to the form actions, preferably at the end (right side)
  formActions.appendChild(landBtn);
}

/**
 * Main entry point for the extension.
 */
async function main(): Promise<void> {
  console.log("Sapling: Extension loaded");

  injectStyles();

  const prBody = await getPrBody();
  let prevUrl: string | null = null;
  let nextUrl: string | null = null;

  if (!prBody) {
    console.log("Sapling: PR body not found, skipping stack detection");
  } else {
    const stackList = getStackList(prBody);
    console.log("Sapling: Stack list found:", !!stackList);

    if (stackList) {
      const links = getNavigationLinks(stackList);
      prevUrl = links.prevUrl;
      nextUrl = links.nextUrl;
    }
  }

  console.log("Sapling: Navigation URLs:", { prevUrl, nextUrl });

  updateNavbar(prevUrl, nextUrl);
  injectLandButton();
}

/**
 * Sets up a MutationObserver to detect when the navbar is missing (e.g. after pjax updates)
 * and re-runs the callback.
 */
function onMutation(callback: () => void) {
  const observer = new MutationObserver(() => {
    // Check if we are on a PR page first to avoid running unnecessarily
    const isPrPage = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/.test(
      window.location.href,
    );
    if (!isPrPage) return;

    // Check Header Buttons
    const navbar = document.getElementById("sapling-navbar");
    const needNavbar = !navbar;

    // Check Land Button
    const landButton = document.getElementById("sapling-land-button");
    const commentForm = document.querySelector(".js-new-comment-form");
    const formActions = commentForm?.querySelector(".form-actions");
    const needLand = formActions && !landButton;

    if (needNavbar || needLand) {
      callback();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Sets up a listener for background script messages (e.g. URL changes)
 * and re-runs the callback.
 */
function onMessage(callback: () => void) {
  browser.runtime.onMessage.addListener((message: unknown) => {
    const msg = message as { type: string; url: string };
    if (msg && msg.type === "URL_CHANGED") {
      console.log("Sapling: Background script reported URL change", msg.url);
      callback();
    }
  });
}

main();
onMutation(() => main());
onMessage(() => main());
