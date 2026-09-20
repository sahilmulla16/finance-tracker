import React from "react";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";

export type BankBrandId =
  | "hdfc"
  | "sbi"
  | "icici"
  | "axis"
  | "idfc"
  | "kotak"
  | "indusind"
  | "yes"
  | "baroda"
  | "pnb"
  | "canara"
  | "union"
  | "boi"
  | "federal"
  | "rbl"
  | "au"
  | "dbs"
  | "hsbc"
  | "sc"
  | "citi"
  | "cash"
  | "upi"
  | "generic";

export type BankBrandDefinition = {
  id: BankBrandId;
  name: string;
  shortName: string;
  brandColor: string;
  badgeBg: string;
  renderLogo: (size: number) => React.ReactElement;
};

export const BANK_BRANDS: Record<BankBrandId, BankBrandDefinition> = {
  hdfc: {
    id: "hdfc",
    name: "HDFC Bank",
    shortName: "HDFC",
    brandColor: "#004C8F",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#004C8F" />
        {/* HDFC Red cross blocks */}
        <Rect x="8" y="20" width="32" height="8" fill="#ED1C24" rx="2" />
        <Rect x="20" y="8" width="8" height="32" fill="#ED1C24" rx="2" />
        {/* Central square */}
        <Rect x="16" y="16" width="16" height="16" fill="#FFFFFF" rx="2" />
        <Rect x="19" y="19" width="10" height="10" fill="#004C8F" rx="1.5" />
      </Svg>
    ),
  },

  sbi: {
    id: "sbi",
    name: "State Bank of India",
    shortName: "SBI",
    brandColor: "#0A3A82",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#0A3A82" />
        {/* SBI Iconic Blue Roundel with Keyhole */}
        <Circle cx="24" cy="24" r="16" fill="#00A3E0" />
        <Circle cx="24" cy="21" r="7" fill="#0A3A82" />
        <Rect x="21.5" y="21" width="5" height="16" fill="#0A3A82" />
      </Svg>
    ),
  },

  icici: {
    id: "icici",
    name: "ICICI Bank",
    shortName: "ICICI",
    brandColor: "#85181A",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="iciciGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F37021" />
            <Stop offset="1" stopColor="#85181A" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="10" fill="url(#iciciGrad)" />
        {/* ICICI stylized i flame emblem */}
        <Circle cx="24" cy="14" r="4.5" fill="#FFFFFF" />
        <Path
          d="M17 21 C22 20, 27 24, 25 35 C29 27, 28 23, 22 21 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M21 23 C21 27, 25 35, 31 35 C28 32, 26 27, 25 23 Z"
          fill="#FFB077"
        />
      </Svg>
    ),
  },

  axis: {
    id: "axis",
    name: "Axis Bank",
    shortName: "Axis",
    brandColor: "#861F41",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#861F41" />
        {/* Axis Bank Maroon Pyramid Chevron */}
        <Polygon points="12,36 24,12 36,36 29,36 24,24 19,36" fill="#FFFFFF" />
        <Polygon points="24,24 29,36 36,36" fill="#FF8BA7" />
      </Svg>
    ),
  },

  idfc: {
    id: "idfc",
    name: "IDFC FIRST Bank",
    shortName: "IDFC FIRST",
    brandColor: "#9B1B34",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#9B1B34" />
        {/* IDFC Bold dual-block geometric mark */}
        <Rect x="12" y="14" width="8" height="20" rx="2" fill="#FFFFFF" />
        <Rect x="23" y="14" width="13" height="8" rx="2" fill="#FFFFFF" />
        <Rect x="23" y="26" width="13" height="8" rx="2" fill="#E8B4BE" />
      </Svg>
    ),
  },

  kotak: {
    id: "kotak",
    name: "Kotak Mahindra Bank",
    shortName: "Kotak",
    brandColor: "#ED1C24",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#ED1C24" />
        {/* Kotak Infinity Ribbon */}
        <Path
          d="M14 24 C14 18, 20 18, 24 24 C28 30, 34 30, 34 24 C34 18, 28 18, 24 24 C20 30, 14 30, 14 24 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="24" cy="24" r="2.5" fill="#003366" />
      </Svg>
    ),
  },

  indusind: {
    id: "indusind",
    name: "IndusInd Bank",
    shortName: "IndusInd",
    brandColor: "#78181A",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#78181A" />
        {/* Horned Bull Emblem */}
        <Path
          d="M15 17 C17 19, 21 21, 24 21 C27 21, 31 19, 33 17 C32 23, 29 27, 24 33 C19 27, 16 23, 15 17 Z"
          fill="#E5A823"
        />
        <Circle cx="24" cy="25" r="3" fill="#78181A" />
      </Svg>
    ),
  },

  yes: {
    id: "yes",
    name: "Yes Bank",
    shortName: "Yes Bank",
    brandColor: "#004990",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#004990" />
        {/* Yes Bank Shield with Red Tick */}
        <Circle cx="24" cy="24" r="15" fill="#FFFFFF" />
        <Path
          d="M17 24 L22 30 L32 18"
          fill="none"
          stroke="#E31837"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },

  baroda: {
    id: "baroda",
    name: "Bank of Baroda",
    shortName: "BoB",
    brandColor: "#F26522",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#F26522" />
        {/* Baroda Sun / Dual B Motif */}
        <Circle cx="24" cy="24" r="14" fill="#FFFFFF" />
        <Path
          d="M18 17 C23 17, 26 19, 26 22 C26 24, 24 25, 22 25 C26 25, 29 27, 29 31 C29 34, 25 36, 20 36 L16 36 L16 17 Z"
          fill="#F26522"
        />
        <Circle cx="31" cy="20" r="2.5" fill="#F26522" />
      </Svg>
    ),
  },

  pnb: {
    id: "pnb",
    name: "Punjab National Bank",
    shortName: "PNB",
    brandColor: "#F37023",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#800000" />
        <Circle cx="24" cy="24" r="14" fill="#F37023" />
        <Circle cx="24" cy="24" r="9" fill="#800000" />
        <Circle cx="24" cy="24" r="4.5" fill="#FFFFFF" />
      </Svg>
    ),
  },

  canara: {
    id: "canara",
    name: "Canara Bank",
    shortName: "Canara",
    brandColor: "#004A97",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#004A97" />
        {/* Interlocking triangles */}
        <Polygon points="14,16 26,34 38,16" fill="#FFCC00" />
        <Polygon points="14,32 26,14 38,32" fill="#00A3E0" opacity={0.8} />
      </Svg>
    ),
  },

  union: {
    id: "union",
    name: "Union Bank of India",
    shortName: "Union Bank",
    brandColor: "#003366",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#003366" />
        {/* Intertwined U shapes */}
        <Path
          d="M15 15 L15 28 C15 33, 21 33, 21 28 L21 15"
          fill="none"
          stroke="#D2232A"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="M27 15 L27 28 C27 33, 33 33, 33 28 L33 15"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },

  boi: {
    id: "boi",
    name: "Bank of India",
    shortName: "BOI",
    brandColor: "#002B49",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#002B49" />
        {/* 5-point Star Emblem */}
        <Polygon
          points="24,10 27,20 38,20 29,26 32,36 24,30 16,36 19,26 10,20 21,20"
          fill="#F78D1E"
        />
        <Circle cx="24" cy="24" r="3.5" fill="#FFFFFF" />
      </Svg>
    ),
  },

  federal: {
    id: "federal",
    name: "Federal Bank",
    shortName: "Federal",
    brandColor: "#003B70",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#003B70" />
        {/* Shield with F bar */}
        <Path
          d="M16 14 L32 14 L32 26 C32 32, 24 36, 24 36 C24 36, 16 32, 16 26 Z"
          fill="#F5A623"
        />
        <Path
          d="M21 19 L28 19 M21 24 L26 24"
          stroke="#003B70"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },

  rbl: {
    id: "rbl",
    name: "RBL Bank",
    shortName: "RBL",
    brandColor: "#D71920",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#002D62" />
        {/* RBL geometric colored chevron tiles */}
        <Polygon points="14,14 26,24 14,34" fill="#D71920" />
        <Polygon points="26,14 38,24 26,34" fill="#FFFFFF" />
      </Svg>
    ),
  },

  au: {
    id: "au",
    name: "AU Small Finance Bank",
    shortName: "AU Bank",
    brandColor: "#662D91",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#662D91" />
        <Circle cx="24" cy="24" r="14" fill="#F58220" />
        {/* AU Lettering styled */}
        <Path
          d="M17 31 L21 17 L25 31 M18 27 L24 27"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Path
          d="M27 19 L27 27 C27 30, 31 30, 31 27 L31 19"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },

  dbs: {
    id: "dbs",
    name: "DBS Bank",
    shortName: "DBS",
    brandColor: "#E51B24",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#111111" />
        {/* DBS 4-diamond spark */}
        <Polygon points="24,11 29,18 24,25 19,18" fill="#E51B24" />
        <Polygon points="24,23 29,30 24,37 19,30" fill="#E51B24" />
        <Polygon points="12,24 19,19 26,24 19,29" fill="#E51B24" />
        <Polygon points="22,24 29,19 36,24 29,29" fill="#E51B24" />
      </Svg>
    ),
  },

  hsbc: {
    id: "hsbc",
    name: "HSBC",
    shortName: "HSBC",
    brandColor: "#DB0011",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#FFFFFF" />
        <Rect width="48" height="48" rx="10" stroke="#E2E8F0" strokeWidth="1" />
        {/* HSBC 6-triangle Hexagon */}
        <Polygon points="24,14 36,24 24,34 12,24" fill="#FFFFFF" />
        <Polygon points="12,24 24,14 12,14" fill="#DB0011" />
        <Polygon points="36,24 24,14 36,14" fill="#DB0011" />
        <Polygon points="12,24 24,34 12,34" fill="#DB0011" />
        <Polygon points="36,24 24,34 36,34" fill="#DB0011" />
      </Svg>
    ),
  },

  sc: {
    id: "sc",
    name: "Standard Chartered",
    shortName: "StanChart",
    brandColor: "#0072CE",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#002D62" />
        {/* Intertwined blue/green helix ribbon */}
        <Path
          d="M16 26 C16 18, 24 16, 28 20 C32 24, 30 32, 22 30"
          fill="none"
          stroke="#00A54F"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="M32 22 C32 30, 24 32, 20 28 C16 24, 18 16, 26 18"
          fill="none"
          stroke="#0072CE"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },

  citi: {
    id: "citi",
    name: "Citibank",
    shortName: "Citi",
    brandColor: "#002D72",
    badgeBg: "#FFFFFF",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#002D72" />
        {/* Citi Red Umbrella Arch */}
        <Path
          d="M17 19 C23 13, 31 15, 33 21"
          fill="none"
          stroke="#EE2724"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <Circle cx="24" cy="27" r="5" fill="#FFFFFF" />
      </Svg>
    ),
  },

  cash: {
    id: "cash",
    name: "Cash / Wallet",
    shortName: "Cash",
    brandColor: "#10B981",
    badgeBg: "#10B98120",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#10B981" />
        {/* Currency Note Motif */}
        <Rect x="11" y="15" width="26" height="18" rx="3" fill="#FFFFFF" />
        <Circle cx="24" cy="24" r="4.5" fill="#10B981" />
        <Circle cx="15" cy="24" r="1.5" fill="#10B981" />
        <Circle cx="33" cy="24" r="1.5" fill="#10B981" />
      </Svg>
    ),
  },

  upi: {
    id: "upi",
    name: "UPI / Digital Payment",
    shortName: "UPI",
    brandColor: "#6366F1",
    badgeBg: "#6366F120",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="upiGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#818CF8" />
            <Stop offset="1" stopColor="#4F46E5" />
          </LinearGradient>
        </Defs>
        <Rect width="48" height="48" rx="10" fill="url(#upiGrad)" />
        {/* Digital Payment Flash */}
        <Polygon points="26,11 15,26 23,26 21,37 33,21 25,21" fill="#FFFFFF" />
      </Svg>
    ),
  },

  generic: {
    id: "generic",
    name: "Bank Account",
    shortName: "Bank",
    brandColor: "#475569",
    badgeBg: "#47556920",
    renderLogo: (size: number) => (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="10" fill="#334155" />
        {/* Neoclassical bank columns */}
        {/* Pediment Roof */}
        <Polygon points="24,12 12,19 36,19" fill="#94A3B8" />
        {/* Architrave */}
        <Rect x="13" y="19" width="22" height="2" fill="#CBD5E1" />
        {/* Pillars */}
        <Rect x="15" y="22" width="3" height="11" fill="#E2E8F0" rx="0.5" />
        <Rect x="20.5" y="22" width="3" height="11" fill="#E2E8F0" rx="0.5" />
        <Rect x="25.5" y="22" width="3" height="11" fill="#E2E8F0" rx="0.5" />
        <Rect x="30" y="22" width="3" height="11" fill="#E2E8F0" rx="0.5" />
        {/* Base */}
        <Rect x="12" y="34" width="24" height="2.5" fill="#CBD5E1" rx="0.5" />
      </Svg>
    ),
  },
};
