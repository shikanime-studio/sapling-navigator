function main(): void {
  const prBody = document.querySelector('.comment-body') as HTMLElement | null;
  if (!prBody) return;

  const isGhStack =
    prBody.innerText.includes('Stack from [ghstack]') ||
    prBody.innerText.includes('Stack from ghstack');
  if (!isGhStack) {
    const ghstackLink = prBody.querySelector('a[href*="ghstack"]');
    if (!ghstackLink) return;
  }

  let stackList: HTMLElement | null = null;
  const paragraphs = Array.from(prBody.querySelectorAll('p'));
  for (const p of paragraphs) {
      if (p.innerText.includes('Stack from [ghstack]') || p.innerText.includes('Stack from ghstack')) {
          stackList = p.nextElementSibling as HTMLElement | null;
          while (stackList && stackList.tagName !== 'UL') {
              stackList = stackList.nextElementSibling as HTMLElement | null;
          }
          break;
      }
  }

  if (!stackList) return;

  const items = Array.from(stackList.querySelectorAll('li')) as HTMLLIElement[];
  let prevUrl: string | null = null;
  let nextUrl: string | null = null;

  for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const strong = item.querySelector('strong');
      const text = item.innerText;
      const isCurrent = !!strong || text.includes('Current PR') || text.trim().startsWith('->') || text.includes('👉');

      if (isCurrent) {
          if (i > 0) {
              const nextItem = items[i - 1];
              const link = nextItem.querySelector('a') as HTMLAnchorElement | null;
              if (link) nextUrl = link.href;
          }

          if (i < items.length - 1) {
              const prevItem = items[i + 1];
              const link = prevItem.querySelector('a') as HTMLAnchorElement | null;
              if (link) prevUrl = link.href;
          }
          break;
      }
  }

  const headerActions = document.querySelector('.gh-header-actions') as HTMLElement | null;
  if (headerActions && !document.querySelector('#sapling-nav-buttons')) {
      const btnGroup = document.createElement('div');
      btnGroup.id = 'sapling-nav-buttons';
      btnGroup.className = 'BtnGroup';
      btnGroup.style.marginRight = '8px';

      if (prevUrl) {
          const prevBtn = document.createElement('a');
          prevBtn.href = prevUrl;
          prevBtn.className = 'btn btn-sm BtnGroup-item';
          prevBtn.innerText = 'Prev';
          btnGroup.appendChild(prevBtn);
      } else {
          const prevBtn = document.createElement('button');
          prevBtn.disabled = true;
          prevBtn.className = 'btn btn-sm BtnGroup-item';
          prevBtn.innerText = 'Prev';
          btnGroup.appendChild(prevBtn);
      }

      if (nextUrl) {
          const nextBtn = document.createElement('a');
          nextBtn.href = nextUrl;
          nextBtn.className = 'btn btn-sm BtnGroup-item';
          nextBtn.innerText = 'Next';
          btnGroup.appendChild(nextBtn);
      } else {
          const nextBtn = document.createElement('button');
          nextBtn.disabled = true;
          nextBtn.className = 'btn btn-sm BtnGroup-item';
          nextBtn.innerText = 'Next';
          btnGroup.appendChild(nextBtn);
      }

      headerActions.prepend(btnGroup);
  }
}

main();

const observer = new MutationObserver(() => {
    const navMissing = !!document.querySelector('.gh-header-actions') && !document.querySelector('#sapling-nav-buttons');
    if (navMissing) {
       main();
    }
});

observer.observe(document.body, { childList: true, subtree: true });
