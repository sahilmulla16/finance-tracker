import React from "react";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";

export type CategoryVisualId =
  | "food"
  | "groceries"
  | "transport"
  | "shopping"
  | "bills"
  | "health"
  | "entertainment"
  | "education"
  | "travel"
  | "fitness"
  | "subscriptions"
  | "salary"
  | "investment"
  | "freelance"
  | "personal_care"
  | "gifts"
  | "rent"
  | "deen"
  | "fuel"
  | "emi"
  | "pets"
  | "family"
  | "savings"
  | "taxes"
  | "insurance"
  | "gaming"
  | "beauty"
  | "cloud"
  | "other";

export type CategoryVisualDefinition = {
  id: CategoryVisualId;
  name: string;
  palette: {
    primary: string;
    secondary: string;
    bgGradient: [string, string];
  };
  renderVisual: (size: number) => React.ReactElement;
};

export const CATEGORY_VISUALS: Record<
  CategoryVisualId,
  CategoryVisualDefinition
> = {
  food: {
    id: "food",
    name: "Food & Drinks",
    palette: {
      primary: "#FF6B35",
      secondary: "#FFA07A",
      bgGradient: ["#FF6B35", "#E8590C"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="foodBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF7A45" />
            <Stop offset="1" stopColor="#D9480F" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#foodBg)" />
        {/* Steam curves */}
        <Path
          d="M20 12 C20 14, 22 15, 22 17"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.7}
        />
        <Path
          d="M26 10 C26 13, 28 14, 28 17"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />
        {/* Coffee / Soup Bowl & Handle */}
        <Path
          d="M13 19 L33 19 C33 28, 28 32, 23 32 C18 32, 13 28, 13 19 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M33 21 C36 21, 38 23, 38 25 C38 27, 36 29, 33 29"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Plate saucer */}
        <Rect x="10" y="34" width="26" height="3" rx="1.5" fill="#FFE8CC" />
      </Svg>
    ),
  },

  groceries: {
    id: "groceries",
    name: "Groceries",
    palette: {
      primary: "#F59E0B",
      secondary: "#FDE68A",
      bgGradient: ["#F59E0B", "#D97706"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="grocBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FBBF24" />
            <Stop offset="1" stopColor="#D97706" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#grocBg)" />
        {/* Shopping Basket Handles */}
        <Path
          d="M18 20 C18 13, 30 13, 30 20"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Basket Body */}
        <Polygon points="12,20 36,20 32,36 16,36" fill="#FFFFFF" />
        {/* Basket grid lines */}
        <Path
          d="M20 22 L20 34 M24 22 L24 34 M28 22 L28 34"
          stroke="#F59E0B"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <Path d="M14 27 L34 27" stroke="#F59E0B" strokeWidth="1.8" />
        {/* Green leaf accent */}
        <Path
          d="M28 12 C32 12, 34 16, 30 18 C26 18, 25 15, 28 12 Z"
          fill="#10B981"
        />
      </Svg>
    ),
  },

  transport: {
    id: "transport",
    name: "Transport",
    palette: {
      primary: "#2563EB",
      secondary: "#93C5FD",
      bgGradient: ["#3B82F6", "#1D4ED8"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="transBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#3B82F6" />
            <Stop offset="1" stopColor="#1D4ED8" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#transBg)" />
        {/* Modern Commuter Car Silhouette */}
        <Path
          d="M13 27 L17 18 C18 16, 20 15, 22 15 L28 15 C30 15, 32 16, 33 18 L36 25 C38 25, 39 26, 39 28 L39 31 C39 32, 38 33, 37 33 L37 35 C37 36, 36 37, 35 37 L33 37 C32 37, 31 36, 31 35 L31 33 L17 33 L17 35 C17 36, 16 37, 15 37 L13 37 C12 37, 11 36, 11 35 L11 33 C10 33, 9 32, 9 31 L9 28 C9 26, 11 27, 13 27 Z"
          fill="#FFFFFF"
        />
        {/* Windshield */}
        <Path d="M18 18 L31 18 L34 25 L15 25 Z" fill="#93C5FD" />
        {/* Headlights */}
        <Circle cx="13" cy="29" r="2" fill="#FBBF24" />
        <Circle cx="35" cy="29" r="2" fill="#FBBF24" />
      </Svg>
    ),
  },

  shopping: {
    id: "shopping",
    name: "Shopping",
    palette: {
      primary: "#8B5CF6",
      secondary: "#DDD6FE",
      bgGradient: ["#8B5CF6", "#6D28D9"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="shopBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#A78BFA" />
            <Stop offset="1" stopColor="#6D28D9" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#shopBg)" />
        {/* Bag Handle */}
        <Path
          d="M18 19 C18 13, 30 13, 30 19"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Tote bag body */}
        <Path
          d="M13 18 L35 18 L38 37 C38 38, 37 39, 36 39 L12 39 C11 39, 10 38, 10 37 Z"
          fill="#FFFFFF"
        />
        {/* Fold crease & star */}
        <Path
          d="M19 18 L24 23 L29 18"
          fill="none"
          stroke="#DDD6FE"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Circle cx="24" cy="29" r="3.5" fill="#8B5CF6" />
      </Svg>
    ),
  },

  bills: {
    id: "bills",
    name: "Bills & Utilities",
    palette: {
      primary: "#0D9488",
      secondary: "#99F6E4",
      bgGradient: ["#14B8A6", "#0F766E"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="billsBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#14B8A6" />
            <Stop offset="1" stopColor="#0F766E" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#billsBg)" />
        {/* Invoice paper */}
        <Rect x="12" y="11" width="24" height="26" rx="3" fill="#FFFFFF" />
        {/* Invoice text lines */}
        <Rect x="16" y="16" width="10" height="2.5" rx="1" fill="#0D9488" />
        <Rect x="16" y="21" width="16" height="2" rx="1" fill="#CCFBF1" />
        <Rect x="16" y="25" width="12" height="2" rx="1" fill="#CCFBF1" />
        {/* Power Lightning badge */}
        <Circle cx="31" cy="31" r="8" fill="#F59E0B" />
        <Polygon points="32,25 28,31 31,31 30,37 35,30 32,30" fill="#FFFFFF" />
      </Svg>
    ),
  },

  health: {
    id: "health",
    name: "Health",
    palette: {
      primary: "#E11D48",
      secondary: "#FECDD3",
      bgGradient: ["#F43F5E", "#BE123C"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="healthBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FB7185" />
            <Stop offset="1" stopColor="#BE123C" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#healthBg)" />
        {/* Heart background shape */}
        <Path
          d="M24 37 C24 37, 10 27, 10 18 C10 13, 14 10, 18.5 10 C21.5 10, 23 12, 24 13.5 C25 12, 26.5 10, 29.5 10 C34 10, 38 13, 38 18 C38 27, 24 37, 24 37 Z"
          fill="#FFFFFF"
        />
        {/* Medical Cross / Pulse */}
        <Path
          d="M14 22 L19 22 L22 17 L25 27 L28 20 L30 22 L34 22"
          fill="none"
          stroke="#E11D48"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },

  entertainment: {
    id: "entertainment",
    name: "Entertainment",
    palette: {
      primary: "#D97706",
      secondary: "#FDE68A",
      bgGradient: ["#F59E0B", "#B45309"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="entBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FBBF24" />
            <Stop offset="1" stopColor="#B45309" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#entBg)" />
        {/* Clapperboard Body */}
        <Rect x="11" y="18" width="26" height="19" rx="3" fill="#FFFFFF" />
        {/* Top Slanted Clapper */}
        <Path d="M11 15 L37 11 L37 17 L11 17 Z" fill="#111827" />
        {/* Clapper stripes */}
        <Polygon points="15,14 18,14 16,17 13,17" fill="#FFFFFF" />
        <Polygon points="22,13 25,13 23,17 20,17" fill="#FFFFFF" />
        <Polygon points="29,12 32,12 30,17 27,17" fill="#FFFFFF" />
        {/* Play triangle */}
        <Polygon points="22,23 28,27.5 22,32" fill="#D97706" />
      </Svg>
    ),
  },

  education: {
    id: "education",
    name: "Education",
    palette: {
      primary: "#2563EB",
      secondary: "#BFDBFE",
      bgGradient: ["#3B82F6", "#1E40AF"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="eduBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#60A5FA" />
            <Stop offset="1" stopColor="#1E40AF" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#eduBg)" />
        {/* Mortarboard Cap */}
        <Polygon points="24,13 38,19 24,25 10,19" fill="#FFFFFF" />
        {/* Cap skull base */}
        <Path
          d="M15 22.5 L15 28 C15 32, 33 32, 33 28 L33 22.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />
        {/* Tassel */}
        <Path
          d="M34 20 L36 29"
          stroke="#FBBF24"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Circle cx="36" cy="30" r="1.5" fill="#FBBF24" />
      </Svg>
    ),
  },

  travel: {
    id: "travel",
    name: "Travel",
    palette: {
      primary: "#7C3AED",
      secondary: "#DDD6FE",
      bgGradient: ["#8B5CF6", "#5B21B6"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="travelBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#A78BFA" />
            <Stop offset="1" stopColor="#5B21B6" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#travelBg)" />
        {/* Globe Latitude Arc */}
        <Circle
          cx="24"
          cy="24"
          r="14"
          fill="none"
          stroke="#C4B5FD"
          strokeWidth="1.5"
          strokeDasharray="3,3"
          opacity={0.6}
        />
        {/* Soaring Plane */}
        <Path
          d="M24 12 L27 21 L37 24 L27 27 L25 35 L22 32 L23 27 L16 25 L12 28 L11 26 L16 23 L16 19 Z"
          fill="#FFFFFF"
        />
        <Circle cx="24" cy="14" r="1.5" fill="#FDE047" />
      </Svg>
    ),
  },

  fitness: {
    id: "fitness",
    name: "Fitness",
    palette: {
      primary: "#059669",
      secondary: "#A7F3D0",
      bgGradient: ["#10B981", "#047857"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="fitBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#34D399" />
            <Stop offset="1" stopColor="#047857" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#fitBg)" />
        {/* Dumbbell */}
        <Rect x="21" y="22" width="6" height="4" fill="#FFFFFF" rx="1" />
        <Rect x="16" y="16" width="5" height="16" rx="2.5" fill="#FFFFFF" />
        <Rect x="11" y="18" width="5" height="12" rx="2.5" fill="#A7F3D0" />
        <Rect x="27" y="16" width="5" height="16" rx="2.5" fill="#FFFFFF" />
        <Rect x="32" y="18" width="5" height="12" rx="2.5" fill="#A7F3D0" />
      </Svg>
    ),
  },

  subscriptions: {
    id: "subscriptions",
    name: "Subscriptions",
    palette: {
      primary: "#C026D3",
      secondary: "#F5D0FE",
      bgGradient: ["#D946EF", "#86198F"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="subBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E879F9" />
            <Stop offset="1" stopColor="#86198F" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#subBg)" />
        {/* Layered Display Cards */}
        <Rect
          x="15"
          y="12"
          width="22"
          height="16"
          rx="3"
          fill="#F5D0FE"
          opacity={0.6}
        />
        <Rect x="11" y="18" width="24" height="18" rx="3" fill="#FFFFFF" />
        {/* Play Icon */}
        <Polygon points="21,23 27,27 21,31" fill="#C026D3" />
      </Svg>
    ),
  },

  salary: {
    id: "salary",
    name: "Salary",
    palette: {
      primary: "#16A34A",
      secondary: "#BBF7D0",
      bgGradient: ["#22C55E", "#15803D"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="salBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#4ADE80" />
            <Stop offset="1" stopColor="#15803D" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#salBg)" />
        {/* Briefcase Base */}
        <Rect x="11" y="18" width="26" height="18" rx="3" fill="#FFFFFF" />
        {/* Handle */}
        <Path
          d="M18 18 L18 14 C18 12.5, 30 12.5, 30 14 L30 18"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Clasp & Buckle */}
        <Rect x="11" y="24" width="26" height="2" fill="#86EFAC" />
        <Rect x="22" y="22" width="4" height="6" rx="1" fill="#16A34A" />
      </Svg>
    ),
  },

  investment: {
    id: "investment",
    name: "Investment",
    palette: {
      primary: "#EA580C",
      secondary: "#FED7AA",
      bgGradient: ["#F97316", "#C2410C"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="invBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FB923C" />
            <Stop offset="1" stopColor="#C2410C" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#invBg)" />
        {/* Upward Stock Candlestick Chart */}
        <Path
          d="M12 36 L36 36"
          stroke="#FED7AA"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Rect x="14" y="25" width="4" height="9" rx="1" fill="#FFFFFF" />
        <Rect x="22" y="20" width="4" height="14" rx="1" fill="#FFFFFF" />
        <Rect x="30" y="14" width="4" height="20" rx="1" fill="#FFFFFF" />
        {/* Trend line arrow */}
        <Path
          d="M13 28 L21 21 L28 23 L35 13"
          fill="none"
          stroke="#FEF08A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Polygon points="35,13 32,13 35,16" fill="#FEF08A" />
      </Svg>
    ),
  },

  freelance: {
    id: "freelance",
    name: "Freelance",
    palette: {
      primary: "#0891B2",
      secondary: "#A5F3FC",
      bgGradient: ["#06B6D4", "#0E7490"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="freeBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#22D3EE" />
            <Stop offset="1" stopColor="#0E7490" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#freeBg)" />
        {/* Layered Work Sheets */}
        <Rect
          x="15"
          y="12"
          width="20"
          height="22"
          rx="2"
          fill="#A5F3FC"
          opacity={0.7}
        />
        <Rect x="12" y="16" width="20" height="22" rx="2" fill="#FFFFFF" />
        {/* Code / Pen Mark */}
        <Path
          d="M16 22 L20 25 L16 28"
          fill="none"
          stroke="#0891B2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Rect x="22" y="26" width="6" height="2" rx="1" fill="#0891B2" />
      </Svg>
    ),
  },

  personal_care: {
    id: "personal_care",
    name: "Personal Care",
    palette: {
      primary: "#DB2777",
      secondary: "#FBCFE8",
      bgGradient: ["#EC4899", "#BE185D"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="careBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F472B6" />
            <Stop offset="1" stopColor="#BE185D" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#careBg)" />
        {/* Sparkle starbursts */}
        <Circle cx="24" cy="24" r="9" fill="#FFFFFF" />
        <Circle cx="24" cy="24" r="5" fill="#FBCFE8" />
        <Circle cx="15" cy="15" r="2" fill="#FFFFFF" />
        <Circle cx="33" cy="14" r="2.5" fill="#FFFFFF" />
        <Circle cx="34" cy="33" r="1.5" fill="#FFFFFF" />
      </Svg>
    ),
  },

  gifts: {
    id: "gifts",
    name: "Gifts",
    palette: {
      primary: "#DC2626",
      secondary: "#FECACA",
      bgGradient: ["#EF4444", "#B91C1C"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="giftBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F87171" />
            <Stop offset="1" stopColor="#B91C1C" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#giftBg)" />
        {/* Gift Box Base */}
        <Rect x="12" y="21" width="24" height="16" rx="2" fill="#FFFFFF" />
        {/* Box Lid */}
        <Rect x="10" y="17" width="28" height="5" rx="1.5" fill="#FFFFFF" />
        {/* Ribbons */}
        <Rect x="22" y="17" width="4" height="20" fill="#DC2626" />
        {/* Bow knot */}
        <Circle
          cx="20"
          cy="14"
          r="3"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <Circle
          cx="28"
          cy="14"
          r="3"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
      </Svg>
    ),
  },

  rent: {
    id: "rent",
    name: "Rent & Housing",
    palette: {
      primary: "#1D4ED8",
      secondary: "#BFDBFE",
      bgGradient: ["#3B82F6", "#1E3A8A"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="rentBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#60A5FA" />
            <Stop offset="1" stopColor="#1E3A8A" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#rentBg)" />
        {/* Home facade */}
        <Polygon points="24,12 11,23 37,23" fill="#FFFFFF" />
        <Rect x="14" y="23" width="20" height="14" fill="#FFFFFF" />
        {/* Door & Window */}
        <Rect x="21" y="28" width="6" height="9" rx="1" fill="#1D4ED8" />
        <Rect x="16" y="25" width="4" height="4" rx="0.5" fill="#93C5FD" />
        <Rect x="28" y="25" width="4" height="4" rx="0.5" fill="#93C5FD" />
      </Svg>
    ),
  },

  deen: {
    id: "deen",
    name: "Deen & Sadqa",
    palette: {
      primary: "#059669",
      secondary: "#6EE7B7",
      bgGradient: ["#10B981", "#047857"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="deenBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#10B981" />
            <Stop offset="1" stopColor="#047857" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#deenBg)" />
        {/* Crescent Moon */}
        <Path
          d="M26 12 C18 12 12 18 12 26 C12 34 18 40 26 40 C29 40 32 39 34 37 C27 36 21 31 21 24 C21 17 26 13 33 12 C31 12 28.5 12 26 12 Z"
          fill="#FFFFFF"
        />
        {/* Small 5-pointed star */}
        <Polygon
          points="33,18 34.5,21.5 38,21.5 35.2,23.5 36.3,27 33,24.8 29.7,27 30.8,23.5 28,21.5 31.5,21.5"
          fill="#FDE047"
        />
      </Svg>
    ),
  },

  fuel: {
    id: "fuel",
    name: "Fuel & Gas",
    palette: {
      primary: "#FB923C",
      secondary: "#FED7AA",
      bgGradient: ["#FB923C", "#EA580C"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="fuelBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FB923C" />
            <Stop offset="1" stopColor="#EA580C" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#fuelBg)" />
        {/* Pump housing */}
        <Rect x="13" y="14" width="16" height="23" rx="3" fill="#FFFFFF" />
        {/* Meter Screen */}
        <Rect x="16" y="18" width="10" height="7" rx="1.5" fill="#EA580C" />
        <Rect x="18" y="21" width="6" height="1.5" rx="0.75" fill="#FED7AA" />
        {/* Hose and Nozzle */}
        <Path
          d="M29 20 C34 20, 36 24, 36 28 L36 33 C36 35, 34 36, 33 36"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M34 17 L36 15 L33 13"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Base plate */}
        <Rect x="11" y="37" width="20" height="2.5" rx="1.25" fill="#FED7AA" />
      </Svg>
    ),
  },

  emi: {
    id: "emi",
    name: "Loans & EMI",
    palette: {
      primary: "#8B5CF6",
      secondary: "#DDD6FE",
      bgGradient: ["#A78BFA", "#6D28D9"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="emiBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#A78BFA" />
            <Stop offset="1" stopColor="#6D28D9" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#emiBg)" />
        {/* Bank Temple Roof */}
        <Polygon points="24,11 11,18 37,18" fill="#FFFFFF" />
        <Rect x="13" y="19" width="22" height="2" rx="0.5" fill="#FFFFFF" />
        {/* Pillars */}
        <Rect x="14" y="22" width="3.5" height="11" rx="1" fill="#FFFFFF" />
        <Rect x="22.25" y="22" width="3.5" height="11" rx="1" fill="#FFFFFF" />
        <Rect x="30.5" y="22" width="3.5" height="11" rx="1" fill="#FFFFFF" />
        {/* Plinth */}
        <Rect x="11" y="34" width="26" height="3" rx="1" fill="#FFFFFF" />
        {/* Percentage badge */}
        <Circle cx="33" cy="27" r="7.5" fill="#FBBF24" />
        <Path d="M31 29 L35 25" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
        <Circle cx="31.5" cy="26" r="1" fill="#7C3AED" />
        <Circle cx="34.5" cy="28" r="1" fill="#7C3AED" />
      </Svg>
    ),
  },

  pets: {
    id: "pets",
    name: "Pets & Animals",
    palette: {
      primary: "#F43F5E",
      secondary: "#FECDD3",
      bgGradient: ["#FDA4AF", "#E11D48"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="petsBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FDA4AF" />
            <Stop offset="1" stopColor="#E11D48" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#petsBg)" />
        {/* Cute Paw Print */}
        <Path
          d="M24 23 C19 23, 16 27, 18 32 C19.5 35, 22 36, 24 36 C26 36, 28.5 35, 30 32 C32 27, 29 23, 24 23 Z"
          fill="#FFFFFF"
        />
        <Circle cx="15.5" cy="20" r="3.2" fill="#FFFFFF" />
        <Circle cx="21" cy="15.5" r="3.2" fill="#FFFFFF" />
        <Circle cx="27" cy="15.5" r="3.2" fill="#FFFFFF" />
        <Circle cx="32.5" cy="20" r="3.2" fill="#FFFFFF" />
      </Svg>
    ),
  },

  family: {
    id: "family",
    name: "Family & Kids",
    palette: {
      primary: "#0284C7",
      secondary: "#BAE6FD",
      bgGradient: ["#38BDF8", "#0284C7"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="familyBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#38BDF8" />
            <Stop offset="1" stopColor="#0284C7" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#familyBg)" />
        {/* Parent Silhouette */}
        <Circle cx="18" cy="15" r="4" fill="#FFFFFF" />
        <Path d="M12 36 C12 28, 14 22, 18 22 C22 22, 24 28, 24 36 Z" fill="#FFFFFF" />
        {/* Child Silhouette */}
        <Circle cx="29" cy="21" r="3" fill="#FFFFFF" />
        <Path d="M25 36 C25 30, 27 26, 29 26 C31 26, 33 30, 33 36 Z" fill="#FFFFFF" />
        {/* Floating Heart */}
        <Path
          d="M33 13 C32 11, 29 11, 29 13.5 C29 16, 33 18, 33 18 C33 18, 37 16, 37 13.5 C37 11, 34 11, 33 13 Z"
          fill="#FDE047"
        />
      </Svg>
    ),
  },

  savings: {
    id: "savings",
    name: "Savings & Vault",
    palette: {
      primary: "#059669",
      secondary: "#A7F3D0",
      bgGradient: ["#34D399", "#059669"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="savingsBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#34D399" />
            <Stop offset="1" stopColor="#059669" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#savingsBg)" />
        {/* Piggy Bank */}
        <Path
          d="M14 26 C14 20, 20 16, 28 16 C34 16, 37 20, 37 26 C37 32, 33 34, 28 34 C25 34, 18 34, 14 26 Z"
          fill="#FFFFFF"
        />
        <Rect x="35" y="24" width="4" height="6" rx="2" fill="#FFFFFF" />
        <Circle cx="32" cy="22" r="1.5" fill="#059669" />
        <Polygon points="26,16 29,11 32,16" fill="#FFFFFF" />
        <Rect x="18" y="32" width="3.5" height="5" rx="1.5" fill="#FFFFFF" />
        <Rect x="28" y="32" width="3.5" height="5" rx="1.5" fill="#FFFFFF" />
        {/* Dropping Gold Coin */}
        <Circle cx="24" cy="12" r="4.5" fill="#FDE047" />
        <Path d="M24 10 L24 14" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
      </Svg>
    ),
  },

  taxes: {
    id: "taxes",
    name: "Taxes & Duties",
    palette: {
      primary: "#475569",
      secondary: "#CBD5E1",
      bgGradient: ["#94A3B8", "#334155"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="taxesBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#94A3B8" />
            <Stop offset="1" stopColor="#334155" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#taxesBg)" />
        {/* Tax Document Sheet */}
        <Path
          d="M14 11 L28 11 L35 18 L35 37 C35 38.5, 33.5 40, 32 40 L14 40 C12.5 40, 11 38.5, 11 37 L11 14 C11 12.5, 12.5 11, 14 11 Z"
          fill="#FFFFFF"
        />
        <Polygon points="28,11 28,18 35,18" fill="#CBD5E1" />
        <Rect x="16" y="20" width="10" height="2" rx="1" fill="#64748B" />
        <Rect x="16" y="25" width="14" height="2" rx="1" fill="#94A3B8" />
        <Rect x="16" y="30" width="10" height="2" rx="1" fill="#94A3B8" />
        {/* Official Badge */}
        <Circle cx="28" cy="32" r="6" fill="#EF4444" />
        <Path d="M26 34 L30 30" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <Circle cx="26.5" cy="31" r="0.8" fill="#FFFFFF" />
        <Circle cx="29.5" cy="33" r="0.8" fill="#FFFFFF" />
      </Svg>
    ),
  },

  insurance: {
    id: "insurance",
    name: "Insurance & Policy",
    palette: {
      primary: "#0D9488",
      secondary: "#99F6E4",
      bgGradient: ["#2DD4BF", "#0D9488"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="insuranceBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#2DD4BF" />
            <Stop offset="1" stopColor="#0D9488" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#insuranceBg)" />
        {/* Protective Shield */}
        <Path
          d="M24 10 C31 12, 36 13, 36 18 C36 29, 29 36, 24 39 C19 36, 12 29, 12 18 C12 13, 17 12, 24 10 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M24 13 C29 15, 33 16, 33 19 C33 27, 28 33, 24 35.5 C20 33, 15 27, 15 19 C15 16, 19 15, 24 13 Z"
          fill="#0D9488"
        />
        {/* Umbrella silhouette */}
        <Path d="M19 24 C19 20, 29 20, 29 24 Z" fill="#FFFFFF" />
        <Path
          d="M24 20 L24 28 C24 29.5, 22.5 29.5, 22.5 28.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },

  gaming: {
    id: "gaming",
    name: "Gaming & Esports",
    palette: {
      primary: "#9333EA",
      secondary: "#F5D0FE",
      bgGradient: ["#E879F9", "#9333EA"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="gamingBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E879F9" />
            <Stop offset="1" stopColor="#9333EA" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#gamingBg)" />
        {/* Controller Body */}
        <Path
          d="M14 17 C19 16, 29 16, 34 17 C38 18, 41 24, 39 31 L37 36 C36 38, 33 37, 31 34 L28 29 L20 29 L17 34 C15 37, 12 38, 11 36 L9 31 C7 24, 10 18, 14 17 Z"
          fill="#FFFFFF"
        />
        {/* D-Pad */}
        <Rect x="14" y="22" width="6" height="2" rx="0.5" fill="#9333EA" />
        <Rect x="16" y="20" width="2" height="6" rx="0.5" fill="#9333EA" />
        {/* Buttons */}
        <Circle cx="30" cy="21" r="1.2" fill="#EF4444" />
        <Circle cx="33" cy="23" r="1.2" fill="#3B82F6" />
        <Circle cx="28" cy="24" r="1.2" fill="#10B981" />
        <Circle cx="31" cy="26" r="1.2" fill="#F59E0B" />
      </Svg>
    ),
  },

  beauty: {
    id: "beauty",
    name: "Beauty & Cosmetics",
    palette: {
      primary: "#DB2777",
      secondary: "#FBCFE8",
      bgGradient: ["#F472B6", "#DB2777"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="beautyBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F472B6" />
            <Stop offset="1" stopColor="#DB2777" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#beautyBg)" />
        {/* Perfume Bottle */}
        <Rect x="16" y="21" width="16" height="17" rx="3" fill="#FFFFFF" />
        <Rect x="19" y="25" width="10" height="9" rx="1.5" fill="#FBCFE8" />
        <Rect x="21.5" y="17" width="5" height="4" rx="1" fill="#FFFFFF" />
        <Rect x="20" y="14" width="8" height="3" rx="1" fill="#FDE047" />
        {/* Sparkles */}
        <Circle cx="12" cy="14" r="2" fill="#FFFFFF" />
        <Circle cx="34" cy="13" r="2.5" fill="#FFFFFF" />
        <Circle cx="37" cy="21" r="1.5" fill="#FFFFFF" />
      </Svg>
    ),
  },

  cloud: {
    id: "cloud",
    name: "Cloud & SaaS",
    palette: {
      primary: "#4F46E5",
      secondary: "#C7D2FE",
      bgGradient: ["#818CF8", "#4338CA"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="cloudBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#818CF8" />
            <Stop offset="1" stopColor="#4338CA" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#cloudBg)" />
        {/* Cloud with server bars */}
        <Path
          d="M17 25 C14 25, 12 27, 12 30 C12 33, 14 35, 17 35 L33 35 C36 35, 38 33, 38 30 C38 27.5, 36.5 25.5, 34 25.1 C33.5 21, 30 18, 25.5 18 C22 18, 19 20, 18 23.5 C17.7 23.4, 17.3 23.4, 17 25 Z"
          fill="#FFFFFF"
        />
        <Rect x="19" y="24" width="10" height="2" rx="1" fill="#4338CA" />
        <Rect x="19" y="28" width="10" height="2" rx="1" fill="#4338CA" />
        <Circle cx="21" cy="25" r="0.6" fill="#A5B4FC" />
        <Circle cx="21" cy="29" r="0.6" fill="#A5B4FC" />
      </Svg>
    ),
  },

  other: {
    id: "other",
    name: "Other",
    palette: {
      primary: "#475569",
      secondary: "#CBD5E1",
      bgGradient: ["#64748B", "#334155"],
    },
    renderVisual: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="otherBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#94A3B8" />
            <Stop offset="1" stopColor="#334155" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="12" fill="url(#otherBg)" />
        {/* Geometric Hexagon Token */}
        <Circle cx="24" cy="24" r="12" fill="#FFFFFF" opacity={0.9} />
        <Circle cx="18" cy="24" r="2.5" fill="#475569" />
        <Circle cx="24" cy="24" r="2.5" fill="#475569" />
        <Circle cx="30" cy="24" r="2.5" fill="#475569" />
      </Svg>
    ),
  },
};
