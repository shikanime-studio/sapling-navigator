/**
 * Fetches the PR body from the DOM or via a fetch request if not present.
 */
async function getPrBody(): Promise<HTMLElement | null> {
  let prBody = document.querySelector('.comment-body') as HTMLElement | null

  if (prBody) {
    console.log('Sapling: PR body found in DOM')
    return prBody
  }

  console.log('Sapling: PR body not found in DOM, checking URL for sub-page...')
  const prUrlMatch = window.location.href.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)

  if (!prUrlMatch) {
    console.log('Sapling: URL does not match PR pattern')
    return null
  }

  const [, owner, repo, number] = prUrlMatch
  const mainPrUrl = `https://github.com/${owner}/${repo}/pull/${number}`

  console.log('Sapling: Detected PR URL', mainPrUrl)

  if (window.location.href.split('?')[0] === mainPrUrl) {
    console.log('Sapling: Already on main PR page, but body not found yet.')
    return null
  }

  try {
    console.log('Sapling: Fetching main PR page...')
    const response = await fetch(mainPrUrl)
    const text = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')
    prBody = doc.querySelector('.comment-body') as HTMLElement | null
    console.log('Sapling: Fetched PR body:', !!prBody)
    return prBody
  } catch (e) {
    console.error('Sapling: Could not fetch PR body', e)
    return null
  }
}

/**
 * Extracts the stack list element from the PR body if present.
 */
function getStackList(prBody: HTMLElement): HTMLElement | null {
  const isGhStack =
    prBody.innerText.includes('Stack from [ghstack]') || prBody.innerText.includes('Stack from ghstack')
  const isSaplingStack =
    prBody.innerText.includes('Stack created with [Sapling]') ||
    prBody.innerText.includes('Stack created with Sapling')

  console.log('Sapling: Stack check:', { isGhStack, isSaplingStack })

  if (!isGhStack && !isSaplingStack) {
    return null
  }

  const paragraphs = Array.from(prBody.querySelectorAll('p'))
  for (const p of paragraphs) {
    if (
      p.innerText.includes('Stack from [ghstack]') ||
      p.innerText.includes('Stack from ghstack') ||
      p.innerText.includes('Stack created with [Sapling]') ||
      p.innerText.includes('Stack created with Sapling')
    ) {
      let stackList = p.nextElementSibling as HTMLElement | null
      while (stackList && stackList.tagName !== 'UL' && stackList.tagName !== 'OL') {
        stackList = stackList.nextElementSibling as HTMLElement | null
      }
      return stackList
    }
  }

  return null
}

/**
 * Parses the stack list to find previous and next PR URLs.
 */
function getNavigationLinks(stackList: HTMLElement): { prevUrl: string | null; nextUrl: string | null } {
  let prevUrl: string | null = null
  let nextUrl: string | null = null
  const items = Array.from(stackList.querySelectorAll('li')) as HTMLLIElement[]
  const currentPrUrl = window.location.href.split('?')[0]

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const strong = item.querySelector('strong')
    const link = item.querySelector('a')
    const text = item.innerText
    const isCurrent =
      !!strong ||
      text.includes('Current PR') ||
      text.trim().startsWith('->') ||
      text.includes('👉') ||
      (link && link.href.split('?')[0] === currentPrUrl)

    if (isCurrent) {
      console.log('Sapling: Current PR found at index', i)
      // In stacks (ghstack/sapling), usually the top is newer (Next) and bottom is older (Prev)
      // List:
      // - Next PR
      // - Current PR
      // - Prev PR
      if (i > 0) {
        const nextItem = items[i - 1]
        const nextLink = nextItem.querySelector('a') as HTMLAnchorElement | null
        if (nextLink) nextUrl = nextLink.href
      }

      if (i < items.length - 1) {
        const prevItem = items[i + 1]
        const prevLink = prevItem.querySelector('a') as HTMLAnchorElement | null
        if (prevLink) prevUrl = prevLink.href
      }
      break
    }
  }

  return { prevUrl, nextUrl }
}

/**
 * Creates the navbar element if it doesn't exist.
 */
function createNavbar(): HTMLElement | null {
  const appMain = document.querySelector('.application-main') as HTMLElement | null
  if (!appMain) return null

  let navbar = document.querySelector('#sapling-navbar') as HTMLElement | null
  if (navbar) return navbar

  console.log('Sapling: Creating navbar...')
  navbar = document.createElement('div')
  navbar.id = 'sapling-navbar'
  navbar.className = 'd-flex flex-justify-between flex-items-center px-3 py-2 color-bg-subtle border-top'
  navbar.style.position = 'fixed'
  navbar.style.bottom = '0'
  navbar.style.left = '0'
  navbar.style.right = '0'
  navbar.style.zIndex = '999'

  const leftGroup = document.createElement('div')
  leftGroup.className = 'd-flex flex-items-center'
  const logo = document.createElement('span')
  logo.innerText = '🌱 Sapling'
  logo.className = 'text-bold mr-2'
  leftGroup.appendChild(logo)
  navbar.appendChild(leftGroup)

  const rightGroup = document.createElement('div')
  rightGroup.id = 'sapling-navbar-right'
  rightGroup.className = 'd-flex flex-items-center'
  navbar.appendChild(rightGroup)

  document.body.appendChild(navbar)
  return navbar
}

/**
 * Updates the navbar content with navigation links.
 */
function updateNavbar(navbar: HTMLElement, prevUrl: string | null, nextUrl: string | null): void {
  const rightGroup = navbar.querySelector('#sapling-navbar-right') as HTMLElement
  if (!rightGroup) return

  // Clear existing content
  rightGroup.innerHTML = ''

  // ReviewStack Button
  const prUrlMatch = window.location.href.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (prUrlMatch) {
    const [, owner, repo, number] = prUrlMatch
    const reviewStackUrl = `https://reviewstack.dev/${owner}/${repo}/pull/${number}`
    const reviewStackBtn = document.createElement('a')
    reviewStackBtn.href = reviewStackUrl
    reviewStackBtn.className = 'btn btn-sm mr-2'
    reviewStackBtn.target = '_blank'
    reviewStackBtn.innerText = 'Open in ReviewStack'
    rightGroup.appendChild(reviewStackBtn)
  }

  const btnGroup = document.createElement('div')
  btnGroup.className = 'BtnGroup mr-2'

  // Previous Button
  if (prevUrl) {
    const prevBtn = document.createElement('a')
    prevBtn.href = prevUrl
    prevBtn.className = 'btn btn-sm BtnGroup-item'
    prevBtn.innerText = 'Prev'
    btnGroup.appendChild(prevBtn)
  } else {
    const prevBtn = document.createElement('button')
    prevBtn.disabled = true
    prevBtn.className = 'btn btn-sm BtnGroup-item'
    prevBtn.innerText = 'Prev'
    btnGroup.appendChild(prevBtn)
  }

  // Next Button
  if (nextUrl) {
    const nextBtn = document.createElement('a')
    nextBtn.href = nextUrl
    nextBtn.className = 'btn btn-sm BtnGroup-item'
    nextBtn.innerText = 'Next'
    btnGroup.appendChild(nextBtn)
  } else {
    const nextBtn = document.createElement('button')
    nextBtn.disabled = true
    nextBtn.className = 'btn btn-sm BtnGroup-item'
    nextBtn.innerText = 'Next'
    btnGroup.appendChild(nextBtn)
  }

  rightGroup.appendChild(btnGroup)
  console.log('Sapling: Navbar content updated')
}

/**
 * Injects styles to hide the merge PR button.
 */
function injectStyles(): void {
  const styleId = 'sapling-styles'
  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.innerHTML = `
    .merge-pr.is-merging [class*="MergeBox-module__mergePartialContainer"] div:nth-child(3) {
      display: none !important;
      border-bottom: none !important;
    }
  `
  document.head.appendChild(style)
}

/**
 * Main entry point for the extension.
 */
async function main(): Promise<void> {
  console.log('Sapling: Extension loaded')

  injectStyles()

  const prBody = await getPrBody()
  let prevUrl: string | null = null
  let nextUrl: string | null = null

  if (!prBody) {
    console.log('Sapling: PR body not found, skipping stack detection')
  } else {
    const stackList = getStackList(prBody)
    console.log('Sapling: Stack list found:', !!stackList)

    if (stackList) {
      const links = getNavigationLinks(stackList)
      prevUrl = links.prevUrl
      nextUrl = links.nextUrl
    }
  }

  console.log('Sapling: Navigation URLs:', { prevUrl, nextUrl })

  const navbar = createNavbar()
  if (navbar) {
    updateNavbar(navbar, prevUrl, nextUrl)
  }
}

main()

const observer = new MutationObserver(() => {
  const appMain = document.querySelector('.application-main')
  const navMissing = appMain && !document.querySelector('#sapling-navbar')
  if (navMissing) {
    main()
  }
})

observer.observe(document.body, { childList: true, subtree: true })
