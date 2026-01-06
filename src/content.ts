async function main(): Promise<void> {
  console.log('Sapling: Extension loaded')
  let prBody = document.querySelector('.comment-body') as HTMLElement | null

  // If we are on a tab like /files, /commits, /checks, the body might not be present or visible.
  // We can try to fetch the main PR page to get the body if we can't find it.
  if (!prBody) {
    console.log('Sapling: PR body not found in DOM, checking URL for sub-page...')
    const prUrlMatch = window.location.href.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
    if (prUrlMatch) {
      const [_, owner, repo, number] = prUrlMatch
      const mainPrUrl = `https://github.com/${owner}/${repo}/pull/${number}`

      console.log('Sapling: Detected PR URL', mainPrUrl)

      // Basic check to prevent infinite loop or unneeded fetching if we are already on main page
      // but just haven't loaded yet.
      if (window.location.href.split('?')[0] !== mainPrUrl) {
         try {
             console.log('Sapling: Fetching main PR page...')
             const response = await fetch(mainPrUrl)
             const text = await response.text()
             const parser = new DOMParser()
             const doc = parser.parseFromString(text, 'text/html')
             prBody = doc.querySelector('.comment-body') as HTMLElement | null
             console.log('Sapling: Fetched PR body:', !!prBody)
         } catch (e) {
             console.error('Sapling: Could not fetch PR body', e)
         }
      } else {
        console.log('Sapling: Already on main PR page, but body not found yet.')
      }
    } else {
        console.log('Sapling: URL does not match PR pattern')
    }
  } else {
      console.log('Sapling: PR body found in DOM')
  }

  let prevUrl: string | null = null
  let nextUrl: string | null = null

  if (!prBody) {
    console.log('Sapling: PR body not found, skipping ghstack detection')
  } else {
    const isGhStack =
        prBody.innerText.includes('Stack from [ghstack]') ||
        prBody.innerText.includes('Stack from ghstack')

    console.log('Sapling: isGhStack direct check:', isGhStack)

    let isGhStackPr = isGhStack
    if (!isGhStack) {
        const ghstackLink = prBody.querySelector('a[href*="ghstack"]')
        console.log('Sapling: ghstack link check:', !!ghstackLink)
        if (ghstackLink) isGhStackPr = true
    }

    if (isGhStackPr) {
        let stackList: HTMLElement | null = null
        const paragraphs = Array.from(prBody.querySelectorAll('p'))
        for (const p of paragraphs) {
            if (
            p.innerText.includes('Stack from [ghstack]') ||
            p.innerText.includes('Stack from ghstack')
            ) {
            stackList = p.nextElementSibling as HTMLElement | null
            while (stackList && stackList.tagName !== 'UL') {
                stackList = stackList.nextElementSibling as HTMLElement | null
            }
            break
            }
        }

        console.log('Sapling: Stack list found:', !!stackList)

        if (stackList) {
            const items = Array.from(stackList.querySelectorAll('li')) as HTMLLIElement[]
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                const strong = item.querySelector('strong')
                const text = item.innerText
                const isCurrent =
                !!strong || text.includes('Current PR') || text.trim().startsWith('->') || text.includes('👉')

                if (isCurrent) {
                console.log('Sapling: Current PR found at index', i)
                if (i > 0) {
                    const nextItem = items[i - 1]
                    const link = nextItem.querySelector('a') as HTMLAnchorElement | null
                    if (link) nextUrl = link.href
                }

                if (i < items.length - 1) {
                    const prevItem = items[i + 1]
                    const link = prevItem.querySelector('a') as HTMLAnchorElement | null
                    if (link) prevUrl = link.href
                }
                break
                }
            }
        }
    }
  }

  console.log('Sapling: Navigation URLs:', { prevUrl, nextUrl })

  const appMain = document.querySelector('.application-main') as HTMLElement | null
  console.log('Sapling: .application-main found:', !!appMain)

  if (appMain && !document.querySelector('#sapling-navbar')) {
    console.log('Sapling: Injecting navbar...')
    const navbar = document.createElement('div')
    navbar.id = 'sapling-navbar'
    navbar.className = 'd-flex flex-justify-between flex-items-center px-3 py-2 color-bg-subtle border-bottom'
    navbar.style.position = 'sticky'
    navbar.style.top = '0'
    navbar.style.zIndex = '999'

    const leftGroup = document.createElement('div')
    leftGroup.className = 'd-flex flex-items-center'
    const logo = document.createElement('span')
    logo.innerText = '🌱 Sapling'
    logo.className = 'text-bold mr-2'
    leftGroup.appendChild(logo)

    navbar.appendChild(leftGroup)

    const rightGroup = document.createElement('div')
    rightGroup.className = 'd-flex flex-items-center'

    // ReviewStack Button
    const prUrlMatch = window.location.href.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
    if (prUrlMatch) {
        const [_, owner, repo, number] = prUrlMatch
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

    navbar.appendChild(rightGroup)
    appMain.prepend(navbar)
    console.log('Sapling: Navbar injected')
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
