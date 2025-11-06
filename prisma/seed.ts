import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  // Create or update test user
  const hashedPassword = bcrypt.hashSync('password123', 10);
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: { 
      email: 'user@example.com', 
      name: 'Test User', 
      password: hashedPassword 
    },
  });
  console.log('Test user seeded.');

  // Seed books idempotently (SQLite-safe: check existence by title, create if not exists)
  const booksData = [
    {
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
    {
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
    {
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
      title: "Medemer (መደመር)",
      author: "Dr. Abiy Ahmed Ali",
      price: 18.00,
      image: "/images/books/medemer.jpg",
      category: "Satire",
      rating: 4.9,
      reviewCount: 2800,
      stock: true,
      description: "Amid the fractured echoes of Ethiopia's storied highlands, where ancient obelisks whisper of unity lost and the rift valleys cradle scars of division, a visionary's manifesto forges bridges from the ashes of discord—blending political philosophy with the resilient synergy of shared destinies, illuminating a path where reconciliation blooms like the eternal flame of national rebirth.",
    }
  ];

  let seededCount = 0;
  for (const bookData of booksData) {
    const existing = await prisma.book.findFirst({
      where: { title: bookData.title },  // Find by title (no unique required)
    });
    if (!existing) {
      await prisma.book.create({
        data: bookData,  // No 'id'—let autoincrement handle it
      });
      seededCount++;
    }
  }
  console.log(`Seeded ${seededCount} new books (skipped existing).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });