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
    name: "Transportation",
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
