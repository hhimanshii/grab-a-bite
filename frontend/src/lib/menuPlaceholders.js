const PLACEHOLDER_THEMES = [
  {
    gradient: "from-orange-200 via-amber-100 to-rose-100",
    accent: "text-orange-900",
    badge: "bg-white/85 text-orange-700",
  },
  {
    gradient: "from-sky-200 via-cyan-100 to-blue-100",
    accent: "text-sky-900",
    badge: "bg-white/85 text-sky-700",
  },
  {
    gradient: "from-emerald-200 via-lime-100 to-green-100",
    accent: "text-emerald-900",
    badge: "bg-white/85 text-emerald-700",
  },
  {
    gradient: "from-fuchsia-200 via-pink-100 to-rose-100",
    accent: "text-fuchsia-900",
    badge: "bg-white/85 text-fuchsia-700",
  },
  {
    gradient: "from-violet-200 via-indigo-100 to-blue-100",
    accent: "text-violet-900",
    badge: "bg-white/85 text-violet-700",
  },
  {
    gradient: "from-yellow-200 via-amber-100 to-orange-100",
    accent: "text-amber-900",
    badge: "bg-white/85 text-amber-700",
  },
]

const CATEGORY_THEME_HINTS = [
  { keywords: ["burger", "sandwich", "wrap"], themeIndex: 0 },
  { keywords: ["drink", "juice", "coffee", "tea", "shake"], themeIndex: 1 },
  { keywords: ["salad", "veggie", "healthy"], themeIndex: 2 },
  { keywords: ["dessert", "cake", "ice", "sweet", "cookie"], themeIndex: 3 },
  { keywords: ["pizza", "pasta", "noodle"], themeIndex: 4 },
  { keywords: ["side", "starter", "snack", "fries"], themeIndex: 5 },
]

const normalizeValue = (value, fallback) => {
  const normalized = typeof value === "string" ? value.trim() : ""
  return normalized || fallback
}

const getInitials = (name) => {
  const parts = normalizeValue(name, "Menu Item")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "MI"
}

const hashText = (text) => {
  let hash = 0

  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) % 2147483647
  }

  return Math.abs(hash)
}

const getThemeIndex = (itemName, itemCategory) => {
  const lookup = `${normalizeValue(itemCategory, "")} ${normalizeValue(itemName, "")}`.toLowerCase()

  for (const hint of CATEGORY_THEME_HINTS) {
    if (hint.keywords.some((keyword) => lookup.includes(keyword))) {
      return hint.themeIndex
    }
  }

  return hashText(lookup || "menu-item") % PLACEHOLDER_THEMES.length
}

export const getMenuPlaceholder = (item = {}) => {
  const name = normalizeValue(item.name, "Menu Item")
  const category = normalizeValue(item.category, "Chef Special")
  const theme = PLACEHOLDER_THEMES[getThemeIndex(name, category)]

  return {
    ...theme,
    initials: getInitials(name),
    name,
    category,
  }
}
