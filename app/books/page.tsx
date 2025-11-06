'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import BookCard from '@/components/BookCard';
import { categories } from '@/lib/books';  // Keep for dropdown
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, BookOpen, Filter, Star } from 'lucide-react';

// Safe custom debounce (no external package)
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Static fallback: Your 22 seeded books (loads instantly if API fails)
const FALLBACK_BOOKS = [
  // IDs 1-9 (Original)
  {
    id: 1,
    title: "Fikre Eske Mekaber (ፍቅር እስከ መቃብር)",
    author: "Haddis Alemayehu",
    price: 15.50,
    image: "/images/books/fikre-eske-mekaber.jpg",
    category: "Romance",
    rating: 4.8,
    reviewCount: 2500,
    stock: true,
    description: "Beneath Gondar's crumbling castle walls, where berbere spice dances on the wind like a lover's sigh, a defiant heart ignites against iron chains of tradition—unfurling a tapestry of stolen glances and starlit betrayals that lingers like incense long after the final, shattering vow.",
  },
  {
    id: 2,
    title: "Dertogada",
    author: "Yismake Worku",
    price: 18.99,
    image: "/images/books/dertogada.jpg",
    category: "Sci-Fi",
    rating: 4.6,
    reviewCount: 1200,
    stock: true,
    description: "In the velvet hush of Danakil's lava-veined craters, where geothermal whispers birth alien horizons, a tinker's fevered dream cracks open the sky—hurling wanderers through vortexes of obsidian stars and forgotten galaxies, where time unravels like frayed chat threads in the roar of cosmic rebirth.",
  },
  {
    id: 3,
    title: "Ke Admas Bashager (ከአድማስ ባሻገር)",
    author: "Bealu Girma",
    price: 12.00,
    image: "/images/books/ke-admas-bashager.jpg",
    category: "Classic",
    rating: 4.7,
    reviewCount: 1800,
    stock: false,
    description: "Within the opulent haze of Menelik's palace, where gold filigree conceals serpents' grins and the air hums with intrigue like a poorly tuned krar, a lowly scribe's quill pierces the veil—exposing a carnival of corruption that spirals into revolutionary fire, leaving empires ashen and echoes of laughter in the ruins.",
  },
  {
    id: 4,
    title: "Yaliteweledew Leba (ያልተወለደው ሌባ)",
    author: "Behailu Demeke",
    price: 14.99,
    image: "/images/books/yaliteweledew-leba.jpg",
    category: "Drama",
    rating: 4.9,
    reviewCount: 900,
    stock: true,
    description: "Under Lalibela's eternal stone gaze, where candle flames flicker like orphaned prayers in the subterranean chill, a barren hearth awakens to thunderous revelations—unleashing a monsoon of buried longings, spectral kin, and unbreakable silences that carve redemption from the jagged cliffs of the soul.",
  },
  {
    id: 5,
    title: "Birqirqta Abiy Demse (ብርቅርቅታ ዓቢይ ደምሴ)",
    author: "Anonymous Collective",
    price: 11.50,
    image: "/images/books/birqirqta-abiy-demse.jpg",
    category: "Fiction",
    rating: 4.4,
    reviewCount: 650,
    stock: true,
    description: "Across Wollo's terraced amber fields, where dawn's first light gilds the teff like scattered embers and the horizon hums with ancestral songs, a shepherd girl's fleeting chase after luminous fireflies plunges into an undercurrent of sorrow—emerging as a luminous quilt of endurance, stitched with the wild silk of unspoken dreams.",
  },
  {
    id: 6,
    title: "Yotor Koblay Kahin Alema Yehu Demeqe (ዮቶር ኮብላይ ካህን ዓለማየሁ ደመቀ)",
    author: "Yotor Koblay Kahin",
    price: 16.75,
    image: "/images/books/yotor-koblay-kahin-alema-yehu-demeqe.jpg",
    category: "Historical",
    rating: 4.5,
    reviewCount: 1100,
    stock: true,
    description: "Through Harar's walled labyrinths, where hyena howls weave with the muezzin's velvet call and acacia shadows cradle century-old secrets, a monk's forbidden scroll summons spectral emperors—unleashing a whirlwind of blood-pacts, oracle visions, and Axum's defiant heartbeat that resurrects a nation's fire from the forge of forgotten glories.",
  },
  {
    id: 7,
    title: "Emegua (ኤምጉዋ)",
    author: "Sebhat Gebre-Egziabher",
    price: 13.25,
    image: "/images/books/emegua.jpg",
    category: "Romance",
    rating: 4.7,
    reviewCount: 1400,
    stock: true,
    description: "In the labyrinthine spice markets of Harar, where cardamom pods burst like illicit kisses and the air shimmers with monsoon promise, a veiled merchant's daughter trades whispers for a destiny of silk-veiled scandals—blossoming into a whirlwind romance that defies the stars and scents the soul with eternal allure.",
  },
  {
    id: 8,
    title: "Tewodros Legacy (ተዋዶሮስ ቅርስ)",
    author: "Taddese Tiruneh",
    price: 17.00,
    image: "/images/books/tewodros-legacy.jpg",
    category: "Historical",
    rating: 4.6,
    reviewCount: 950,
    stock: true,
    description: "Atop the mist-shrouded battlements of Maqdala, where cannon smoke mingles with the ghosts of lion-hearted emperors and the wind carries echoes of fano chants, a warrior's heir unearths a crown of thorns—forging a legacy of unyielding valor that thunders through time like the Nile's untamed roar.",
  },
  {
    id: 9,
    title: "The Kebra Nagast (ክብረ ነገሥት)",
    author: "Traditional Epic",
    price: 20.00,
    image: "/images/books/kebra-nagast.jpg",
    category: "Historical",
    rating: 4.9,
    reviewCount: 3000,
    stock: true,
    description: "From Solomon's throne to the Lion of Judah's roar, where golden ark shadows dance in Axum's obelisk glow and queens' riddles echo across millenniums, this sacred chronicle pulses with divine fire—binding Africa's cradle to heaven's vault in a symphony of prophecy and imperial thunder.",
  },
  // IDs 10-18 (Requested Additions)
  {
    id: 10,
    title: "Lela Sew (ሌላሠው)",
    author: "Mihret Debebe",
    price: 14.25,
    image: "/images/books/lela-sew.jpg",
    category: "Drama",
    rating: 4.5,
    reviewCount: 750,
    stock: true,
    description: "In the fractured mirrors of Addis's bustling boulevards, where tuk-tuks hum like restless thoughts and coffee ceremonies veil unspoken truths, a psychiatrist's alter ego emerges from the shadows—unraveling a labyrinth of duality, hidden selves, and the intoxicating blur between sanity's edge and the heart's wild, uncharted whispers.",
  },
  {
    id: 11,
    title: "Ramatohr",
    author: "Yismake Worku",
    price: 19.75,
    image: "/images/books/ramatohr.jpg",
    category: "Sci-Fi",
    rating: 4.7,
    reviewCount: 950,
    stock: true,
    description: "Echoing Dertogada's cosmic echoes, in the scorched cradle of Afar's salt flats where mirages twist like rogue algorithms, a band of exiles hacks the fabric of reality—diving into digital abysses of phantom worlds and neural storms, where code bleeds into flesh and the universe reboots in a frenzy of electric prophecies.",
  },
  {
    id: 12,
    title: "Zegora (ዝጎራ)",
    author: "Alemayehu Wase",
    price: 13.00,
    image: "/images/books/zegora.jpg",
    category: "Fiction",
    rating: 4.3,
    reviewCount: 600,
    stock: true,
    description: "Amid the labyrinthine whispers of Bahir Dar's lake-shrouded isles, where papyrus reeds sway like forgotten riddles and the Blue Nile's murmur guards ancient enigmas, a wanderer's quest for a lost melody unearths a vortex of illusions—blending mirage and memory in a haunting symphony of what was, what might have been, and the silence that devours both.",
  },
  {
    id: 13,
    title: "Sememen (ሰመመን)",
    author: "Sisay Nigusu",
    price: 12.75,
    image: "/images/books/sememen.jpg",
    category: "Romance",
    rating: 4.6,
    reviewCount: 1100,
    stock: true,
    description: "On the sun-baked lawns of Haile Selassie University in the 1970s, where lecture halls buzz with revolutionary fervor and stolen kisses bloom under jacaranda canopies, a pair of star-crossed scholars chase forbidden sparks amid political tempests—kindling a romance as volatile as the era, etched in the ink of youthful defiance and the perfume of eternal what-ifs.",
  },
  {
    id: 14,
    title: "Metraliyon (ሜትራሊዮን)",
    author: "Alemayehu Wase",
    price: 15.00,
    image: "/images/books/metraliyon.jpg",
    category: "Fiction",
    rating: 4.4,
    reviewCount: 800,
    stock: true,
    description: "In the flickering gaslight of 1960s Dire Dawa, where camel caravans clip-clop through dust-choked alleys and the scent of henna lingers like a siren's call, a meteor's fall ignites a chain of cosmic coincidences—twisting fates of lovers, thieves, and dreamers into a glittering web of destiny's capricious sparkle.",
  },
  {
    id: 15,
    title: "Tikusat (ቲኩሳት)",
    author: "Sebhat Gebre-Egziabher",
    price: 16.50,
    image: "/images/books/tikusat.jpg",
    category: "Poetry",
    rating: 4.8,
    reviewCount: 1200,
    stock: true,
    description: "Like krar strings snapping under the moon's unyielding gaze, these verses cascade through Addis's rain-slicked cobblestones and the highlands' whispering winds—etching portraits of longing, exile, and the soul's defiant bloom, where every syllable drips with the honeyed ache of unspoken revolutions and the velvet hush of dawn's first prayer.",
  },
  {
    id: 16,
    title: "Aleweldem (አሌወልደም)",
    author: "Abe Gubegna",
    price: 14.00,
    image: "/images/books/aleweldem.jpg",
    category: "Satire",
    rating: 4.6,
    reviewCount: 900,
    stock: true,
    description: "In the satirical glare of Bahir Dar's fish markets, where tilapia tales flip like politicians' promises and the lake's ripples mock the pomp of power, a hapless everyman's odyssey skewers the absurdities of bureaucracy—laughing through tears at the human comedy, where every bribe is a punchline and every dream a deliciously deflated balloon.",
  },
  {
    id: 17,
    title: "Yetekolefebet (የተኮለፈበት)",
    author: "Mihret Debebe",
    price: 13.75,
    image: "/images/books/yetekolefebet.jpg",
    category: "Drama",
    rating: 4.5,
    reviewCount: 700,
    stock: true,
    description: "Behind the velvet curtains of a crumbling Addis theater, where spotlights pierce the fog of forgotten scripts and applause fades into the ether of unacted lives, a troupe's unraveling rehearsals expose the raw nerves of ambition—staging a drama of crossed destinies where every cue is a confession and every blackout a breath of reclaimed truth.",
  },
  {
    id: 18,
    title: "Kibir Dengay (ክብር ደንጋይ)",
    author: "Yismake Worku",
    price: 17.25,
    image: "/images/books/kibir-dengay.jpg",
    category: "Mystery",
    rating: 4.7,
    reviewCount: 1000,
    stock: true,
    description: "In the fog-shrouded alleys of Jimma's coffee groves, where dew-kissed beans hide the bitter secrets of midnight vendettas and the air thickens with the scent of betrayal, a detective's pursuit of a vanished honor spirals into a maelstrom of shadows—unveiling a labyrinth of pride's poisoned chalice, where glory's crown crumbles to dust in the grip of unrelenting truth.",
  },
  // IDs 19-22 (Bonus Additions)
  {
    id: 19,
    title: "Oromay (ኦሮማይ)",
    author: "Bealu Girma",
    price: 16.00,
    image: "/images/books/oromay.jpg",
    category: "Satire",
    rating: 4.8,
    reviewCount: 2200,
    stock: true,
    description: "Across the revolutionary bonfires of 1970s Addis, where placard flames lick the night sky like tongues of righteous fury and the Derg's iron fist clenches around the nation's throat, a young idealist's diary devolves into a hallucinatory descent—mirroring the chaos of dreams deferred in a whirlwind of ink-stained prophecies and the bitter aftertaste of shattered utopias.",
  },
  {
    id: 20,
    title: "Giracha Kachiloch (ግራጫ ቃጭሎች)",
    author: "Adam Reta",
    price: 15.50,
    image: "/images/books/giracha-kachiloch.jpg",
    category: "Fiction",
    rating: 4.7,
    reviewCount: 1300,
    stock: true,
    description: "From the dusty backstreets of Nefas Mewcha, where childhood shadows stretch long under the relentless Gojjam sun and the scent of injera mingles with the sting of poverty, an introverted boy's odyssey through cruelty and redemption weaves a spell of magical realism—unfurling threads of love, hate, and the unyielding human spirit against the canvas of Ethiopia's fractured heart.",
  },
  {
    id: 21,
    title: "Letum Aynegalign (ሌቱም አይነጋልኝ)",
    author: "Sibhat Gebre-Egziabher",
    price: 14.75,
    image: "/images/books/letum-aynegalign.jpg",
    category: "Drama",
    rating: 4.6,
    reviewCount: 1600,
    stock: true,
    description: "In the neon haze of 1970s Addis Ababa's Wube Bereha nightlife, where saxophone wails pierce the veil of moral taboos and the air pulses with the forbidden rhythm of hidden desires, a young man's tangled dance with love, loss, and the underbelly of urban exile lays bare the raw pulse of a city's nocturnal confessions.",
  },
  {
    id: 22,
    title: "Medemer (መደመር)",
    author: "Dr. Abiy Ahmed Ali",
    price: 18.00,
    image: "/images/books/medemer.jpg",
    category: "Satire",
    rating: 4.9,
    reviewCount: 2800,
    stock: true,
    description: "Amid the fractured echoes of Ethiopia's storied highlands, where ancient obelisks whisper of unity lost and the rift valleys cradle scars of division, a visionary's manifesto forges bridges from the ashes of discord—blending political philosophy with the resilient synergy of shared destinies, illuminating a path where reconciliation blooms like the eternal flame of national rebirth.",
  },
];

export default function Books() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const [selectCategory, setSelectCategory] = useState(category);
  const [displayedBooks, setDisplayedBooks] = useState(12);  // Start with more for impact
  const [books, setBooks] = useState([]);  // Start empty, populate on fetch
  const [total, setTotal] = useState(0);  // Dynamic total
  const [loading, setLoading] = useState(true);  // Start loading
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [apiError, setApiError] = useState(false);  // Track API failure
  const debouncedSearch = useDebounce(search, 300);

  // Safe session with useSession hook (standard, no async issues)
  const { data: session, status } = useSession();
  const isLoadingSession = status === 'loading';

  useEffect(() => {
    setSelectCategory(category);
  }, [category]);

  // Safe fetch with fallback, triggered on debounced changes
  useEffect(() => {
    fetchBooks();
  }, [debouncedSearch, category, displayedBooks]);

  // Helper to filter fallback books client-side
  const getFilteredFallback = useMemo(() => {
    let filtered = FALLBACK_BOOKS;
    if (debouncedSearch) {
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          b.author.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    if (category !== 'All') {
      filtered = filtered.filter((b) => b.category === category);
    }
    return filtered;
  }, [debouncedSearch, category]);

  const fetchBooks = async () => {
    if (loading) return;  // Prevent concurrent fetches
    setLoading(true);
    setApiError(false);
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        category: category === 'All' ? '' : category,
        minPrice: '0',
        maxPrice: '1000',
        minRating: '0',
        sort: 'rating',
        limit: displayedBooks.toString(),
      });
      const res = await fetch(`/api/books?${params}`);
      if (res.ok) {
        const { books: fetched, total: t } = await res.json();
        setBooks(fetched || []);  // Use fetched if available
        setTotal(t || 0);
      } else {
        throw new Error('API response not ok');
      }
    } catch (error) {
      console.warn('API fetch safe fallback:', error);  // Suppress error
      setApiError(true);
      // Use filtered fallback
      const filtered = getFilteredFallback;
      setBooks(filtered);
      setTotal(filtered.length);
      // In fallback, show all immediately
      setDisplayedBooks(10000);  // Effectively unlimited
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/books?category=${selectCategory}&search=${encodeURIComponent(search)}`);
  };

  const handleCategoryChange = (value: string) => {
    setSelectCategory(value);
    router.push(`/books?category=${value}&search=${encodeURIComponent(search)}`);
  };

  const loadMore = () => {
    if (loadMoreLoading || apiError) return;
    setLoadMoreLoading(true);
    setDisplayedBooks((prev) => Math.min(prev + 8, total));
    setLoadMoreLoading(false);
  };

  const visibleBooks = useMemo(() => books.slice(0, displayedBooks), [books, displayedBooks]);
  const hasMore = displayedBooks < total && !apiError;

  const featuredBooks = useMemo(() => FALLBACK_BOOKS.slice(0, 3), []);  // For empty state

  // Build unique category list for Select to avoid duplicate keys
  const uniqueCategories = useMemo(() => {
    // Filter out 'All' from categories, then prepend it once
    const filteredCategories = categories.filter(cat => cat !== 'All');
    // Dedupe filtered list (in case of multiples)
    const deduped = [...new Set(filteredCategories)];
    // Prepend 'All' once
    return ['All', ...deduped];
  }, [categories]);

  // Early return if session loading (avoids hydration mismatch)
  if (isLoadingSession) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-500" />
          <p className="text-muted-foreground">Initializing your library...</p>
        </div>
      </section>
    );
  }

  // Fallback session if not authenticated
  const safeSession = session || { user: { name: 'Guest' } };

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/50 min-h-screen">
      {/* Hero Header with Search & Filters */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 mb-12"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg">
            <BookOpen className="h-5 w-5" />
            <h1 className="text-3xl font-bold">Discover Astonishing Books</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Immerse yourself in Ethiopian classics and global gems with AI-powered recommendations.
          </p>
        </motion.div>

        {/* Search & Filter Form */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto items-end justify-center"
        >
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for titles, authors, or dreams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border-amber-200/50 focus:border-amber-500"
            />
          </div>
          <Select value={selectCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-48 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border-amber-200/50 focus:border-amber-500">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 rounded-xl border-amber-200/50">
              {uniqueCategories.map((cat, index) => (
                <SelectItem key={`${cat}-${index}`} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="submit"
            className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 px-8 py-3 rounded-xl shadow-lg"
          >
            <Search className="h-4 w-4 mr-2" />
            Explore
          </Button>
        </motion.form>
      </motion.div>

      {/* Books Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Stats/Featured Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>
              {total} books • {FALLBACK_BOOKS.length > 0 ? Math.round((total / FALLBACK_BOOKS.length) * 100) : 0}% Ethiopian gems
            </span>
          </div>
          {safeSession && (
            <div className="text-sm text-muted-foreground">
              Welcome, {safeSession.user.name} •{' '}
              <a href="/api/auth/signout" className="text-amber-500 hover:underline">
                Sign Out
              </a>
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="text-muted-foreground">Loading your literary escape...</p>
            </div>
          </motion.div>
        )}

        {/* Error State (Graceful, non-blocking) */}
        {apiError && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 mb-8 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-200 dark:border-amber-800"
          >
            <p className="text-amber-700 dark:text-amber-300 mb-2">Brief connection hiccup—switching to instant mode!</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Showing {visibleBooks.length} timeless favorites. Retry on refresh.
            </p>
          </motion.div>
        )}

        {/* Books Grid */}
        <AnimatePresence mode="wait">
          {visibleBooks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-20"
            >
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-2 text-muted-foreground">No books match your quest yet</h3>
              <p className="text-muted-foreground mb-6">Try broadening your search or category.</p>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {featuredBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {visibleBooks.map((book) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <BookCard book={book} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More Button */}
        {hasMore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center py-12">
            <Button
              onClick={loadMore}
              disabled={loadMoreLoading}
              className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 px-8 py-3 rounded-xl shadow-lg"
            >
              {loadMoreLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Star className="h-4 w-4 mr-2" />
              )}
              Unveil {Math.max(0, total - displayedBooks)} More Treasures
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}