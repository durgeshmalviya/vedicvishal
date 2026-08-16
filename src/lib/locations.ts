/** Global cities database with comprehensive coverage for instant lookup */
export interface CityEntry {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  aliases?: string[];
}

export const GLOBAL_CITIES: CityEntry[] = [
  // India - Major Cities
  { name: "New Delhi", state: "Delhi", country: "India", lat: 28.6139, lon: 77.209, aliases: ["delhi", "new delhi", "ncr"] },
  { name: "Mumbai", state: "Maharashtra", country: "India", lat: 19.076, lon: 72.8777, aliases: ["bombay"] },
  { name: "Bangalore", state: "Karnataka", country: "India", lat: 12.9716, lon: 77.5946, aliases: ["bengaluru"] },
  { name: "Bengaluru", state: "Karnataka", country: "India", lat: 12.9716, lon: 77.5946 },
  { name: "Hyderabad", state: "Telangana", country: "India", lat: 17.385, lon: 78.4867 },
  { name: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lon: 80.2707, aliases: ["madras"] },
  { name: "Kolkata", state: "West Bengal", country: "India", lat: 22.5726, lon: 88.3639, aliases: ["calcutta"] },
  { name: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lon: 73.8567 },
  { name: "Ahmedabad", state: "Gujarat", country: "India", lat: 23.0225, lon: 72.5714 },
  { name: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9124, lon: 75.7873 },
  { name: "Surat", state: "Gujarat", country: "India", lat: 21.1702, lon: 72.8311 },
  { name: "Lucknow", state: "Uttar Pradesh", country: "India", lat: 26.8467, lon: 80.9462 },
  { name: "Kanpur", state: "Uttar Pradesh", country: "India", lat: 26.4499, lon: 80.3319 },
  { name: "Nagpur", state: "Maharashtra", country: "India", lat: 21.1458, lon: 79.0882 },
  { name: "Indore", state: "Madhya Pradesh", country: "India", lat: 22.7196, lon: 75.8577 },
  { name: "Bhopal", state: "Madhya Pradesh", country: "India", lat: 23.2599, lon: 77.4126 },
  { name: "Harda", state: "Madhya Pradesh", country: "India", lat: 22.3389, lon: 77.093, aliases: ["harda mp"] },
  { name: "Pipliya", state: "Madhya Pradesh", country: "India", lat: 22.35, lon: 77.1 },
  { name: "Patna", state: "Bihar", country: "India", lat: 25.5941, lon: 85.1376 },
  { name: "Vadodara", state: "Gujarat", country: "India", lat: 22.3072, lon: 73.1812, aliases: ["baroda"] },
  { name: "Ghaziabad", state: "Uttar Pradesh", country: "India", lat: 28.6692, lon: 77.4538 },
  { name: "Ludhiana", state: "Punjab", country: "India", lat: 30.901, lon: 75.8573 },
  { name: "Agra", state: "Uttar Pradesh", country: "India", lat: 27.1767, lon: 78.0081 },
  { name: "Nashik", state: "Maharashtra", country: "India", lat: 19.9975, lon: 73.7898 },
  { name: "Faridabad", state: "Haryana", country: "India", lat: 28.4089, lon: 77.3178 },
  { name: "Meerut", state: "Uttar Pradesh", country: "India", lat: 28.9845, lon: 77.7064 },
  { name: "Rajkot", state: "Gujarat", country: "India", lat: 22.3039, lon: 70.8022 },
  { name: "Varanasi", state: "Uttar Pradesh", country: "India", lat: 25.3176, lon: 82.9739, aliases: ["banaras", "kashi"] },
  { name: "Srinagar", state: "Jammu and Kashmir", country: "India", lat: 34.0837, lon: 74.7973 },
  { name: "Amritsar", state: "Punjab", country: "India", lat: 31.634, lon: 74.8723 },
  { name: "Allahabad", state: "Uttar Pradesh", country: "India", lat: 25.4358, lon: 81.8463, aliases: ["prayagraj"] },
  { name: "Prayagraj", state: "Uttar Pradesh", country: "India", lat: 25.4358, lon: 81.8463 },
  { name: "Ranchi", state: "Jharkhand", country: "India", lat: 23.3441, lon: 85.3096 },
  { name: "Howrah", state: "West Bengal", country: "India", lat: 22.5958, lon: 88.2636 },
  { name: "Coimbatore", state: "Tamil Nadu", country: "India", lat: 11.0168, lon: 76.9558 },
  { name: "Jabalpur", state: "Madhya Pradesh", country: "India", lat: 23.1815, lon: 79.9864 },
  { name: "Gwalior", state: "Madhya Pradesh", country: "India", lat: 26.2183, lon: 78.1828 },
  { name: "Vijayawada", state: "Andhra Pradesh", country: "India", lat: 16.5062, lon: 80.648 },
  { name: "Jodhpur", state: "Rajasthan", country: "India", lat: 26.2389, lon: 73.0243 },
  { name: "Madurai", state: "Tamil Nadu", country: "India", lat: 9.9252, lon: 78.1198 },
  { name: "Raipur", state: "Chhattisgarh", country: "India", lat: 21.2514, lon: 81.6296 },
  { name: "Kota", state: "Rajasthan", country: "India", lat: 25.2138, lon: 75.8648 },
  { name: "Guwahati", state: "Assam", country: "India", lat: 26.1445, lon: 91.7362 },
  { name: "Chandigarh", state: "Chandigarh", country: "India", lat: 30.7333, lon: 76.7794 },
  { name: "Solapur", state: "Maharashtra", country: "India", lat: 17.6599, lon: 75.9064 },
  { name: "Hubli", state: "Karnataka", country: "India", lat: 15.3647, lon: 75.124, aliases: ["hubballi"] },
  { name: "Mysore", state: "Karnataka", country: "India", lat: 12.2958, lon: 76.6394, aliases: ["mysuru"] },
  { name: "Tiruchirappalli", state: "Tamil Nadu", country: "India", lat: 10.7905, lon: 78.7047, aliases: ["trichy"] },
  { name: "Bareilly", state: "Uttar Pradesh", country: "India", lat: 28.367, lon: 79.4304 },
  { name: "Aligarh", state: "Uttar Pradesh", country: "India", lat: 27.8974, lon: 78.088 },
  { name: "Tiruppur", state: "Tamil Nadu", country: "India", lat: 11.1085, lon: 77.3411 },
  { name: "Moradabad", state: "Uttar Pradesh", country: "India", lat: 28.8386, lon: 78.7733 },
  { name: "Gurgaon", state: "Haryana", country: "India", lat: 28.4595, lon: 77.0266, aliases: ["gurugram"] },
  { name: "Gurugram", state: "Haryana", country: "India", lat: 28.4595, lon: 77.0266 },
  { name: "Noida", state: "Uttar Pradesh", country: "India", lat: 28.5355, lon: 77.391 },
  { name: "Thiruvananthapuram", state: "Kerala", country: "India", lat: 8.5241, lon: 76.9366, aliases: ["trivandrum"] },
  { name: "Kochi", state: "Kerala", country: "India", lat: 9.9312, lon: 76.2673, aliases: ["cochin"] },
  { name: "Visakhapatnam", state: "Andhra Pradesh", country: "India", lat: 17.6868, lon: 83.2185, aliases: ["vizag"] },
  { name: "Bhubaneswar", state: "Odisha", country: "India", lat: 20.2961, lon: 85.8245 },
  { name: "Dehradun", state: "Uttarakhand", country: "India", lat: 30.3165, lon: 78.0322 },
  { name: "Shimla", state: "Himachal Pradesh", country: "India", lat: 31.1048, lon: 77.1734 },
  { name: "Jammu", state: "Jammu and Kashmir", country: "India", lat: 32.7266, lon: 74.857 },
  { name: "Ujjain", state: "Madhya Pradesh", country: "India", lat: 23.1765, lon: 75.7885 },
  { name: "Ajmer", state: "Rajasthan", country: "India", lat: 26.4499, lon: 74.6399 },
  { name: "Aurangabad", state: "Maharashtra", country: "India", lat: 19.8762, lon: 75.3433 },
  { name: "Jamshedpur", state: "Jharkhand", country: "India", lat: 22.8046, lon: 86.2029 },

  // Australia - Major Cities
  { name: "Sydney", state: "New South Wales", country: "Australia", lat: -33.8688, lon: 151.2093, aliases: ["sydney nsw"] },
  { name: "Melbourne", state: "Victoria", country: "Australia", lat: -37.8136, lon: 144.9631, aliases: ["melbourne vic"] },
  { name: "Brisbane", state: "Queensland", country: "Australia", lat: -27.4698, lon: 153.023, aliases: ["brisbane qld"] },
  { name: "Perth", state: "Western Australia", country: "Australia", lat: -31.9505, lon: 115.8605, aliases: ["perth wa"] },
  { name: "Adelaide", state: "South Australia", country: "Australia", lat: -34.9285, lon: 138.6007, aliases: ["adelaide sa"] },
  { name: "Hobart", state: "Tasmania", country: "Australia", lat: -42.8821, lon: 147.3272, aliases: ["hobart tas"] },
  { name: "Canberra", state: "Australian Capital Territory", country: "Australia", lat: -35.2809, lon: 149.13, aliases: ["canberra act"] },
  { name: "Darwin", state: "Northern Territory", country: "Australia", lat: -12.4381, lon: 130.8353, aliases: ["darwin nt"] },
  { name: "Gold Coast", state: "Queensland", country: "Australia", lat: -28.0028, lon: 153.4314 },
  { name: "Newcastle", state: "New South Wales", country: "Australia", lat: -32.9271, lon: 151.7802 },

  // USA - Major Cities
  { name: "New York", state: "New York", country: "USA", lat: 40.7128, lon: -74.006, aliases: ["nyc", "new york city"] },
  { name: "Los Angeles", state: "California", country: "USA", lat: 34.0522, lon: -118.2437, aliases: ["la", "los angeles ca"] },
  { name: "Chicago", state: "Illinois", country: "USA", lat: 41.8781, lon: -87.6298, aliases: ["chicago il"] },
  { name: "Houston", state: "Texas", country: "USA", lat: 29.7604, lon: -95.3698, aliases: ["houston tx"] },
  { name: "Phoenix", state: "Arizona", country: "USA", lat: 33.4484, lon: -112.074, aliases: ["phoenix az"] },
  { name: "Philadelphia", state: "Pennsylvania", country: "USA", lat: 39.9526, lon: -75.1652, aliases: ["philly", "philadelphia pa"] },
  { name: "San Antonio", state: "Texas", country: "USA", lat: 29.4241, lon: -98.4936 },
  { name: "San Diego", state: "California", country: "USA", lat: 32.7157, lon: -117.1611 },
  { name: "Dallas", state: "Texas", country: "USA", lat: 32.7767, lon: -96.797 },
  { name: "San Jose", state: "California", country: "USA", lat: 37.3382, lon: -121.8863 },
  { name: "Austin", state: "Texas", country: "USA", lat: 30.2672, lon: -97.7431, aliases: ["austin tx"] },
  { name: "Jacksonville", state: "Florida", country: "USA", lat: 30.3322, lon: -81.6557 },
  { name: "Fort Worth", state: "Texas", country: "USA", lat: 32.7555, lon: -97.3308 },
  { name: "Columbus", state: "Ohio", country: "USA", lat: 39.9612, lon: -82.9988 },
  { name: "Seattle", state: "Washington", country: "USA", lat: 47.6062, lon: -122.3321, aliases: ["seattle wa"] },
  { name: "Denver", state: "Colorado", country: "USA", lat: 39.7392, lon: -104.9903, aliases: ["denver co"] },
  { name: "Boston", state: "Massachusetts", country: "USA", lat: 42.3601, lon: -71.0589, aliases: ["boston ma"] },
  { name: "Miami", state: "Florida", country: "USA", lat: 25.7617, lon: -80.1918, aliases: ["miami fl"] },
  { name: "Atlanta", state: "Georgia", country: "USA", lat: 33.749, lon: -84.388, aliases: ["atlanta ga"] },

  // UK
  { name: "London", country: "United Kingdom", lat: 51.5074, lon: -0.1278, aliases: ["london uk"] },
  { name: "Manchester", country: "United Kingdom", lat: 53.4808, lon: -2.2426, aliases: ["manchester uk"] },
  { name: "Birmingham", country: "United Kingdom", lat: 52.5086, lon: -1.8756 },
  { name: "Leeds", country: "United Kingdom", lat: 53.8008, lon: -1.5491 },
  { name: "Glasgow", country: "United Kingdom", lat: 55.8642, lon: -4.2518 },
  { name: "Edinburgh", country: "United Kingdom", lat: 55.9533, lon: -3.1883 },

  // Canada
  { name: "Toronto", state: "Ontario", country: "Canada", lat: 43.6532, lon: -79.3832, aliases: ["toronto on"] },
  { name: "Vancouver", state: "British Columbia", country: "Canada", lat: 49.2827, lon: -123.1207, aliases: ["vancouver bc"] },
  { name: "Montreal", state: "Quebec", country: "Canada", lat: 45.5017, lon: -73.5673, aliases: ["montreal qc"] },
  { name: "Calgary", state: "Alberta", country: "Canada", lat: 51.0447, lon: -114.0719 },
  { name: "Edmonton", state: "Alberta", country: "Canada", lat: 53.5461, lon: -113.4938 },
  { name: "Ottawa", state: "Ontario", country: "Canada", lat: 45.4215, lon: -75.6972 },

  // Germany
  { name: "Berlin", country: "Germany", lat: 52.52, lon: 13.405, aliases: ["berlin germany"] },
  { name: "Munich", country: "Germany", lat: 48.1351, lon: 11.582, aliases: ["munich germany"] },
  { name: "Hamburg", country: "Germany", lat: 53.5511, lon: 9.4821 },
  { name: "Frankfurt", country: "Germany", lat: 50.1109, lon: 8.6821 },
  { name: "Cologne", country: "Germany", lat: 50.9364, lon: 6.9528, aliases: ["koeln"] },

  // France
  { name: "Paris", country: "France", lat: 48.8566, lon: 2.3522, aliases: ["paris france"] },
  { name: "Lyon", country: "France", lat: 45.7640, lon: 4.8357 },
  { name: "Marseille", country: "France", lat: 43.2965, lon: 5.3698 },
  { name: "Toulouse", country: "France", lat: 43.6047, lon: 1.4442 },
  { name: "Nice", country: "France", lat: 43.7102, lon: 7.2620 },

  // Spain
  { name: "Madrid", country: "Spain", lat: 40.4168, lon: -3.7038, aliases: ["madrid spain"] },
  { name: "Barcelona", country: "Spain", lat: 41.3851, lon: 2.1734, aliases: ["barcelona spain"] },
  { name: "Valencia", country: "Spain", lat: 39.4699, lon: -0.3763 },
  { name: "Seville", country: "Spain", lat: 37.3886, lon: -5.9823 },

  // Italy
  { name: "Rome", country: "Italy", lat: 41.9028, lon: 12.4964, aliases: ["rome italy"] },
  { name: "Milan", country: "Italy", lat: 45.4642, lon: 9.1900, aliases: ["milan italy"] },
  { name: "Naples", country: "Italy", lat: 40.8518, lon: 14.2681 },
  { name: "Florence", country: "Italy", lat: 43.7696, lon: 11.2558 },
  { name: "Venice", country: "Italy", lat: 45.4408, lon: 12.3155 },

  // Japan
  { name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503, aliases: ["tokyo japan"] },
  { name: "Osaka", country: "Japan", lat: 34.6937, lon: 135.5023, aliases: ["osaka japan"] },
  { name: "Yokohama", country: "Japan", lat: 35.4437, lon: 139.6380 },
  { name: "Kyoto", country: "Japan", lat: 35.0116, lon: 135.7681 },
  { name: "Kobe", country: "Japan", lat: 34.6901, lon: 135.1955 },

  // China
  { name: "Beijing", country: "China", lat: 39.9042, lon: 116.4074, aliases: ["beijing china"] },
  { name: "Shanghai", country: "China", lat: 31.2304, lon: 121.4737, aliases: ["shanghai china"] },
  { name: "Guangzhou", country: "China", lat: 23.1291, lon: 113.2644 },
  { name: "Shenzhen", country: "China", lat: 22.5431, lon: 114.0579 },
  { name: "Chongqing", country: "China", lat: 29.4316, lon: 106.9123 },

  // Singapore
  { name: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198, aliases: ["singapore city"] },

  // UAE
  { name: "Dubai", state: "Dubai", country: "United Arab Emirates", lat: 25.2048, lon: 55.2708, aliases: ["dubai uae"] },
  { name: "Abu Dhabi", state: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4539, lon: 54.3773 },

  // Thailand
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lon: 100.5018, aliases: ["bangkok thailand"] },

  // Brazil
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lon: -46.6333, aliases: ["sao paulo"] },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lon: -43.1729 },
  { name: "Brasília", country: "Brazil", lat: -15.7975, lon: -47.8919 },

  // Mexico
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lon: -99.1332, aliases: ["mexico city"] },

  // South Africa
  { name: "Johannesburg", country: "South Africa", lat: -26.2023, lon: 28.0436 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lon: 18.4241 },
  { name: "Durban", country: "South Africa", lat: -29.8583, lon: 31.0292 },

  // New Zealand
  { name: "Auckland", country: "New Zealand", lat: -37.0882, lon: 174.887, aliases: ["auckland nz"] },
  { name: "Wellington", country: "New Zealand", lat: -41.2865, lon: 174.776 },
  { name: "Christchurch", country: "New Zealand", lat: -43.5321, lon: 172.6362 },
];

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Instant global local match — no network */
export function findCityLocal(query: string): { lat: number; lon: number; display: string } | null {
  const q = normalize(query);
  if (!q) return null;

  for (const c of GLOBAL_CITIES) {
    const full = normalize(`${c.name} ${c.state || ""} ${c.country}`);
    const name = normalize(c.name);
    const country = normalize(c.country);
    const aliases = (c.aliases || []).map(normalize);

    if (
      q === name ||
      q === full ||
      full.startsWith(q) ||
      name.startsWith(q) ||
      q.includes(name) ||
      q === country ||
      aliases.some((a) => q === a || q.includes(a) || a.includes(q))
    ) {
      const display = c.state 
        ? `${c.name}, ${c.state}, ${c.country}` 
        : `${c.name}, ${c.country}`;
      return { lat: c.lat, lon: c.lon, display };
    }
  }
  return null;
}

/** Autocomplete suggestions for the UI */
export function suggestCities(query: string, limit = 8): CityEntry[] {
  const q = normalize(query);
  if (!q || q.length < 1) return GLOBAL_CITIES.slice(0, limit);

  const scored = GLOBAL_CITIES.map((c) => {
    const name = normalize(c.name);
    const country = normalize(c.country);
    const full = normalize(`${c.name} ${c.state || ""} ${c.country}`);
    let score = 0;

    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 85;
    else if (full.includes(q) && full.startsWith(q)) score = 80;
    else if (full.includes(q)) score = 70;
    else if ((c.aliases || []).some((a) => normalize(a).startsWith(q))) score = 75;
    else if (country.includes(q)) score = 50;
    else if (name.includes(q)) score: 40;

    return { c, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.c);
}