import type { Dictionary } from './ru'

const PLURALS = { day: 'days', month: 'months', year: 'years', commit: 'commits' } as const

function count(n: number, unit: keyof typeof PLURALS) {
  return `${n} ${n === 1 ? unit : PLURALS[unit]}`
}

/** Less than a day, 25 days, 8 months, 3 years. Границы те же, что в русском lifetime. */
function lifetime(days: number) {
  if (days < 1) return 'less than a day'
  if (days < 60) return count(days, 'day')
  const months = Math.floor(days / 30.44)
  if (months < 24) return count(months, 'month')
  return count(Math.floor(days / 365.25), 'year')
}

/** Sep 24, 2026 */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export const en: Dictionary = {
  ogLocale: 'en_US',
  format: {
    date: formatDate,
    lifetime,
    commits: (n) => count(n, 'commit'),
  },

  meta: {
    title: 'Projectyard — bury your abandoned repo',
    description:
      'A graveyard for unfinished side projects. Paste a link to an abandoned GitHub repo, hold a funeral and get a death certificate you can share.',
    keywords: ['abandoned repository', 'side project', 'GitHub', 'death certificate', 'project graveyard', 'Projectyard'],
    imageAlt: 'Projectyard — lay your repo to rest',
    schema: (count, goal) =>
      `A graveyard for abandoned side projects: bury a GitHub repo and get its death certificate. ${count} of ${goal} buried so far.`,
    graveMissing: 'Grave not found',
    graveTitle: (name) => `${name} — certificate of death`,
    graveDescription: (epitaph, cause) => `“${epitaph}” Cause of death: ${cause.toLowerCase()}.`,
    graveImageAlt: (repo) => `Certificate of death for ${repo}`,
  },

  og: {
    title: ['Lay your', 'repo'],
    accent: 'to rest',
    tagline: 'A death certificate for your abandoned project',
  },

  header: {
    switchLabel: 'English version',
  },

  goal: {
    unit: 'projects',
    title: 'What happens at project 100',
    titleReached: 'A hundred projects buried',
    now: 'For now, all you can do here is bury a repo and get its death certificate.',
    plan: (goal) =>
      `Once ${goal} projects are buried here, we start building the main Projectyard: a graveyard where every project gets its own grave. Everything buried here moves in first.`,
    planReached:
      "We're starting work on the main Projectyard: a graveyard where every project gets its own grave. Everything buried here moves in first.",
    of: 'of',
    left: (n) => `${n} to go`,
    close: 'Got it',
  },

  home: {
    title: ['Lay your repo', 'to rest'],
    lead: "Paste a GitHub link. The dates, the age and the last words come from GitHub. You pick the cause of death and write the epitaph.",
  },

  form: {
    link: 'Repository link',
    linkPlaceholder: 'https://github.com/user/project',
    clearLink: 'Clear the link',
    waiting: 'waiting for a GitHub link',
    searching: 'looking for the repo…',
    found: 'found',
    alreadyBuried: 'already buried.',
    openCertificate: 'Open the certificate',
    cause: 'Cause of death',
    epitaph: 'Epitaph',
    shuffle: 'Another epitaph',
    mourner: 'Buried by',
    mournerNote: 'GitHub username',
    mournerPlaceholder: 'username',
    mournerInvalid: 'GitHub usernames use Latin letters, digits and hyphens',
    mournerHint: 'goes on the certificate, remembered for next time',
    style: 'Style',
    adoptable: 'The project can go to a new owner when the main Projectyard opens',
    checking: "checking you're not a bot…",
    submit: 'Bury',
    preview: 'preview. This image gets attached to the link',
    previewOwner: 'owner',
    previewName: 'repository',
  },

  causes: {
    burnout: 'Burnout',
    study: 'School',
    job: 'Day job',
    interest: 'Lost interest',
    scope: 'Scope creep',
    money: 'Ran out of money',
    debt: 'Tech debt',
    better: 'Found a better idea',
    time: 'No time',
    experiment: 'It was an experiment',
    other: 'Other',
  },

  epitaphs: [
    'Worked on my machine.',
    'Went off to refactor and never came back.',
    'Here lies a TODO. It never got done.',
    "I'll finish it this weekend. Didn't.",
    "The landing page was ready. The product wasn't.",
    'The last deploy was successful.',
  ],

  errors: {
    invalid: "That doesn't look like a link to a GitHub repository",
    not_found: 'Repository not found. Is it public?',
    rate_limited: 'GitHub asks us to wait. Try again in a minute',
    unavailable: "GitHub isn't answering. Try again",
    storage: 'The graveyard is closed for a moment. Try again a bit later',
    bad_input: 'Pick a cause of death, write an epitaph and enter your GitHub username',
    save_failed: "Couldn't save it. Try again",
    too_many: 'Too many requests in a row. The graveyard needs a minute of silence, try again later',
    too_famous: "This project has over 1,000 stars, it doesn't look abandoned. This place is for your own unfinished projects",
    bot: "Couldn't check that you're not a bot. Refresh the page and try again",
  },

  scene: {
    label: (repo) => `Funeral for ${repo}`,
    farewell: (name) => `Farewell, ${name}`,
    development: (lived) => `${lived} of development`,
    noLanguage: 'no language',
    slow: 'preparing the certificate…',
    back: 'Back to the form',
    cancel: 'Cancel the funeral',
    leaving: 'preparing the certificate…',
  },

  grave: {
    status: (plot) => `status: BURIED · plot No. ${plot}`,
    caption: (repo, cause, epitaph) => `Certificate of death for ${repo}. Cause: ${cause}. Epitaph: ${epitaph}`,
    buryAnother: 'Bury another one',
    buryYours: 'Bury your own repo',
  },

  report: {
    open: 'Remove or report',
    title: 'Remove or report',
    close: 'Close',
    kind: 'What happened',
    removeOwn: 'This is my project, please remove the grave',
    complaint: 'Report this grave',
    reason: 'Tell us more',
    reasonPlaceholder: 'For example: I own this repository and want the certificate removed',
    contact: 'How to reach you (optional)',
    contactPlaceholder: 'Telegram, email or GitHub username',
    note: 'A person reads every request, graves are never removed automatically. To remove a grave you will need to confirm the repository is yours.',
    submit: 'Send',
    sending: 'Sending…',
    done: 'Done. We got your request and will go through it by hand.',
    telegram: 'Get the reply in Telegram',
    telegramHint: 'Press Start in the bot and it will message you when the request is reviewed. Without this there will be no reply.',
    errors: {
      bad_input: 'Pick what happened and describe it in a few words',
      not_found: 'This grave does not exist. Refresh the page',
      too_many: 'Too many requests. Try again later',
      bot: "Couldn't verify you are not a bot. Refresh the page and try again",
      storage: "Couldn't send it. Try again in a little while",
    },
  },

  badge: {
    title: 'README badge',
    hint: 'paste it into the repository README: the badge links to the certificate',
    copy: 'Copy Markdown',
    copied: 'Copied',
    alt: 'Buried on Projectyard',
    label: 'projectyard',
    text: (lived) => (lived ? `lived ${lived}` : 'buried'),
  },

  share: {
    button: 'Share',
    title: 'Share',
    close: 'Close',
    copied: 'Copied',
    link: 'Link',
    downloadPng: 'Download PNG',
    downloadStoryLabel: 'Download the certificate for stories',
    imageAlt: 'The image that gets attached to the link',
    postLabel: 'Post text',
    postHint: 'the link is added for you, with the certificate attached',
    copyLink: 'Copy link',
    copyText: 'Copy text',
    copyImage: 'Copy image',
    imageCopied: 'Image copied',
    downloadCard: 'Download PNG 1200×630',
    downloadStory: 'Download for stories',
    imageFailed: "the browser wouldn't copy the image, download the PNG instead",
    imageHint: 'paste the copied image into Discord, Slack or X',
    networks: ['x', 'reddit', 'bluesky', 'linkedin', 'threads', 'telegram'],
    post: (name, lived) => {
      const intro = lived ? `${lived} of development. ` : ''
      return `${intro.charAt(0).toUpperCase()}${intro.slice(1)}Today ${name} was officially laid to rest.\nRIP ${name} ⚰️`
    },
  },

  certificate: {
    title: 'Certificate of Death',
    titleLines: ['Certificate', 'of Death'],
    issued: (plot, date) => `No. ${plot} · issued ${date}`,
    seal: 'BURIED',
    born: 'Born',
    died: 'Died',
    lived: 'Lived',
    commits: 'Commits',
    lastWords: 'Last words',
    cause: 'Cause of death',
    silence: (lived) => `silent for ${lived}`,
    noCommits: 'no commits',
    quote: (text) => `“${text}”`,
    cta: 'Bury your repo',
  },

  notFound: {
    status: '404: grave not found',
    title: 'Nobody is buried here',
    text: "Maybe the repo is still alive. Or maybe it's time to let it go.",
    action: 'Bury a repo',
  },

  error: {
    status: '500: graveyard closed',
    title: 'Something broke',
    text: "Looks like the database isn't answering. Try refreshing the page in a minute.",
    action: 'Try again',
  },
}
