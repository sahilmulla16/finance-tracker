import pypandoc, os, textwrap

md = r"""# Pocketflow Finance — UI/UX Design Specification

## 1. Document Purpose

This document defines the complete visual and interaction specification for the **Pocketflow Finance** mobile application. It is based on the supplied 10-screen visual reference and is intended for a UI/UX designer, Figma designer, or frontend/mobile engineer.

The implementation should reproduce the reference as closely as possible:

- Dark, premium finance-app aesthetic
- Near-black backgrounds
- Lime-green primary accent
- Soft olive-gray presentation background
- Rounded cards and pill controls
- High-contrast white typography
- Minimal line icons
- Spacious, uncluttered layouts
- iOS-style device proportions and safe areas
- Consistent bottom navigation across the main app

The ten screens are:

1. Splash
2. Onboarding
3. Home
4. Analytics
5. Transactions
6. Add Transaction
7. Accounts
8. Budgets
9. Savings Goals
10. Profile / Settings

---

## 2. Product Identity

### 2.1 Product Name

**Pocketflow**

### 2.2 Product Positioning

Pocketflow is a personal finance tracker for monitoring balances, recording transactions, managing accounts, planning budgets, and building savings goals.

### 2.3 Brand Personality

- Calm
- Premium
- Modern
- Trustworthy
- Focused
- Encouraging
- Simple rather than corporate

### 2.4 Logo

The logo shown in the reference is a rounded-square lime-green tile containing a black abstract flowing mark.

#### Logo construction

- Outer shape: rounded square
- Background: lime green
- Corner radius: approximately 22–26% of the tile size
- Mark: black abstract leaf/flow symbol
- Mark consists of two smooth, horizontal organic shapes:
  - Upper shape curves upward and to the right
  - Lower shape curves downward and to the left
  - Shapes visually resemble a flowing leaf, wave, or stylized “P”
- The mark is centered both horizontally and vertically
- Do not use a text wordmark inside the icon tile

#### Logo variants

1. **Primary app icon**
   - Lime tile
   - Black flow mark
2. **Dark-background logo**
   - Lime tile
   - Black flow mark
3. **Monochrome fallback**
   - White mark on black tile
4. **Small-size mark**
   - Use a simplified version of the flow symbol at very small sizes

#### Logo usage

- Do not stretch the logo
- Do not rotate the logo
- Do not add gradients to the logo tile
- Do not add a drop shadow inside the tile
- Keep sufficient clear space around the logo

---

## 3. Visual Design System

### 3.1 Color Palette

#### Base colors

- App background: `#090B0A`
- Elevated card background: `#171A18`
- Secondary card background: `#202320`
- Input background: `#1B1E1C`
- Divider: `#303431`
- Primary text: `#F5F7F3`
- Secondary text: `#A5AAA3`
- Muted text: `#777D76`

#### Accent colors

- Primary lime: `#B7FF63`
- Bright lime: `#C4FF7B`
- Dark lime/green: `#4B682C`
- Positive income green: `#7CFF66`
- Warning yellow: `#F7D66A`
- Expense pink/red: `#FF8B9A`
- Lavender: `#B7A8FF`
- Blue accent: `#86BFFF`

#### Presentation background

The reference presentation uses a muted olive-gray background:

- Approximate color: `#858E7A`
- Use only for mockup presentation boards, not as the main app background.

### 3.2 Typography

Use a clean geometric sans-serif font. Preferred options:

1. Inter
2. SF Pro Display
3. SF Pro Text
4. Manrope

#### Typography hierarchy

- Large balance: 34–40 px, semibold
- Screen title: 18–20 px, semibold
- Section title: 15–17 px, semibold
- Body text: 14–16 px, regular
- Supporting text: 11–13 px, regular
- Button text: 14–16 px, semibold
- Tab labels: 11–12 px
- Numeric values: use tabular figures where possible

### 3.3 Spacing

Use an 8-point spacing system:

- 4 px: icon-to-label micro spacing
- 8 px: compact spacing
- 12 px: internal row spacing
- 16 px: standard horizontal padding
- 20 px: card padding
- 24 px: section separation
- 32 px: major section separation

### 3.4 Corner Radius

- Small controls: 12–14 px
- Input rows: 14–16 px
- Cards: 20–24 px
- Large hero cards: 24–28 px
- Circular buttons: 50% radius
- Bottom navigation container: 24–28 px

### 3.5 Shadows and Effects

The reference uses subtle depth rather than strong shadows.

- Use soft black shadows
- Use low-opacity inner highlights on cards
- Use very subtle lime glow around active controls
- Avoid glassmorphism that reduces text readability
- Avoid excessive blur
- Use gradients only in decorative areas, such as the splash waves and onboarding illustration

### 3.6 Iconography

Use a consistent rounded line-icon set such as Lucide, SF Symbols, or Phosphor.

Icons should be:

- 18–22 px
- 1.5–2 px stroke
- White or muted gray by default
- Lime when active
- Contained in circular or rounded-square backgrounds when used as a feature icon

---

## 4. Device and Layout Rules

### 4.1 Reference Device

Design for a modern iPhone-style frame:

- Width: 390 px
- Height: 844 px
- Top safe area: approximately 47 px
- Bottom safe area: approximately 34 px
- Corner radius: approximately 42 px

For responsive implementation:

- Use safe-area insets
- Keep horizontal content padding between 16 and 20 px
- Allow cards to expand horizontally
- Keep bottom navigation above the home indicator

### 4.2 General Screen Structure

Each screen should follow:

1. Status bar / safe area
2. Header
3. Main scrollable content
4. Optional floating action button
5. Bottom navigation, when applicable
6. Bottom safe-area spacing

### 4.3 Main Navigation

The primary navigation appears on Home, Transactions, Budgets, and Profile.

Navigation items:

- Home
- Transactions
- Add button
- Budgets
- Profile

The center Add button is larger than the other items and uses a lime circular background.

---

# 5. Screen Specifications

## Screen 1 — Splash

### Purpose

Introduce the Pocketflow brand during app launch.

### Background

- Full-screen near-black background
- Subtle green-black radial glow behind the logo
- Decorative flowing wave forms at the bottom

### Layout

1. Status bar at the top
2. Centered logo icon
3. Product name beneath the logo
4. Tagline below the product name
5. Decorative wave illustration at the bottom
6. Home indicator at the bottom

### Exact content

#### Logo

- Lime rounded-square icon
- Black flow mark
- Approximately 58–66 px square

#### Product name

`Pocketflow`

- White
- 23–26 px
- Semibold
- Center aligned

#### Tagline

`Track Today`

`Build Tomorrow`

- White or light gray
- 13–15 px
- Two lines
- Center aligned
- Approximately 20 px line height

### Decorative waves

The bottom third contains overlapping smooth wave shapes:

- Dark green translucent wave
- Lime-green thin edge highlights
- Soft gradients from transparent to dark green
- Waves should feel like flowing financial growth
- Keep the center content area empty and calm

### Interaction

- Splash automatically transitions to onboarding or the authenticated Home screen
- No visible button
- Optional subtle fade-in animation

---

## Screen 2 — Onboarding

### Purpose

Explain the product value before account creation.

### Background

- Near-black
- Very subtle green radial gradient

### Header / Hero text

Position near the top-left with approximately 24 px horizontal padding.

#### Heading

`Take Control`

`of Your Money`

- White text
- 28–32 px
- Bold or semibold
- Two lines
- The word `Money` is lime green

#### Supporting text

`Track. Plan. Grow.`

- Lime green
- 15–17 px
- Semibold

`All in one place.`

- White
- 14–16 px

### Illustration

A large circular or oval illustration occupies the center:

- Dark green circular background
- Tilted smartphone mockup
- Smartphone displays a finance dashboard
- Lime bar-chart icon on the phone
- Abstract green leaf shapes around the phone
- Soft green glow
- Illustration should look dimensional but remain minimal

### Pagination

Four small dots appear below the illustration:

- Active dot: lime green
- Inactive dots: dark gray
- Dot diameter: approximately 8 px
- Spacing: 10–12 px

### Primary CTA

Button text:

`Get Started`

Button styling:

- Full-width within 24 px side margins
- Lime background
- Black text
- 16 px semibold
- Height: approximately 50–54 px
- Radius: 26 px

### Secondary action

`I already have an account`

- White or light gray
- Underlined
- 13–14 px
- Center aligned
- Positioned below the primary CTA

### Interaction

- Get Started opens account creation
- Existing account opens sign-in
- Pagination can advance through onboarding slides
- The supplied reference shows the first onboarding slide

---

## Screen 3 — Home

### Purpose

Provide a quick overview of the user’s financial position.

### Background

- Near-black
- Vertical scrolling content

### Header

Top-left:

`Good Morning,`

`Sahil 👋`

- First line: muted gray, 13–14 px
- Second line: white, 16–18 px semibold

Top-right:

- Notification bell icon
- Circular dark background
- Small red notification badge with a white number

### Balance section

Label:

`Total Balance`

Value:

`₹1,24,530.00`

Styling:

- Label in muted gray
- Value in white
- Value approximately 31–36 px
- Currency symbol and decimals aligned naturally
- Use tabular numerals

### Quick actions

Three evenly spaced actions:

1. Add
2. Transfer
3. Request

Each action has:

- Circular dark button
- White or lime icon
- Label underneath
- Approximately 42–48 px circle

The Add action is active:

- Lime circular background
- Black icon

### My Accounts section

Header:

`My Accounts`

Right-side action:

`See all`

Account cards are horizontally scrollable.

#### Main account card

- Lime/green gradient card
- Rounded corners
- HDFC Bank logo placeholder/icon
- Account name: `HDFC Bank`
- Account type: `Bank Account`
- Balance: `₹68,420.00`
- Masked account number: `•••• •••• 3281`
- Small circular plus button in the lower-right corner

The reference also shows a partially visible second account card to the right.

### Latest Transactions section

Header:

`Latest Transactions`

Right-side action:

`See all`

Transaction rows:

#### Netflix

- Icon: white circular tile with red “N”
- Title: `Netflix`
- Subtitle: `Entertainment · Today`
- Amount: `- ₹499.00`
- Amount aligned right
- Negative amount in white or muted white

#### Salary

- Icon: rounded white tile with a colorful finance/bar-chart symbol
- Title: `Salary`
- Subtitle: `Income · 12 Jun`
- Amount: `+ ₹25,000.00`
- Positive amount in green

Rows use:

- 44–48 px icon containers
- Thin dividers
- 12–16 px vertical spacing

### Bottom navigation

Items:

- Home
- Transactions
- Add
- Budgets
- Profile

Home is active:

- Lime icon
- Lime or white label
- Other items muted gray

Center Add button:

- Lime circular button
- Black plus icon
- Larger than other navigation icons

---

## Screen 4 — Analytics

### Purpose

Visualize financial performance and spending trends.

### Header

Left:

- Circular back button
- White chevron

Center:

`Analytics`

Right:

- Circular more/options button with three dots

### Filter tabs

Four pill tabs:

- All
- Income
- Expense
- Transfer

The selected tab:

- Lime background
- Black text

Unselected tabs:

- Dark gray background
- White or muted text

### Balance section

Label:

`Total Balance`

Value:

`₹1,24,530.00`

Use the same typography and spacing as Home.

### Chart

A wide line chart occupies the center.

Chart characteristics:

- Dark background
- Two smooth lines:
  - Lime line
  - Lavender line
- Lines cross and flow in gentle waves
- No visible vertical grid lines
- Minimal or no axis lines
- A translucent vertical highlight behind the selected month
- Selected point uses a bright circular marker
- Tooltip above selected point:
  `₹12,430`

Month labels:

`Jan   Feb   Mar   Apr   May   Jun`

- Selected month: `Jun`
- Selected month label is lime
- Other month labels are muted gray

### Summary cards

Two cards side by side.

#### Income card

- Green circular icon
- Label: `Income`
- Amount: `₹52,400.00`
- Change: `↑ 12.5%`
- Positive change in lime green

#### Expense card

- Pink circular icon
- Label: `Expense`
- Amount: `₹34,800.00`
- Change: `↓ 8.2%`
- Negative/change indicator in pink or red

### Insight banner

Large lavender rounded card.

Text:

`You spent 12.5% less`

`than last month 🎉`

- Dark purple text
- Right-facing chevron
- Soft lavender gradient or abstract circular glow

### Interaction

- Tabs filter the chart
- Month selection updates tooltip and summaries
- Insight banner can open a detailed spending explanation

---

## Screen 5 — Transactions

### Purpose

Show the complete transaction history with filtering and search.

### Header

Left:

- Back button

Center:

`Transactions`

Right:

- Small square action icon, such as export/filter

### Search field

Placeholder:

`Search transactions...`

Styling:

- Dark rounded rectangle
- Search icon on the left
- Muted placeholder text
- Height: approximately 44 px

### Filter tabs

- All
- Income
- Expense
- Transfer

Selected tab uses lime background.

### Group labels

`Today`

`Yesterday`

Labels are white or light gray and semibold.

### Transaction rows

Each row contains:

- Merchant/category icon
- Merchant name
- Category label
- Time on the right
- Amount on the right

#### Today

1. Netflix
   - Entertainment
   - `10:24 AM`
   - `- ₹499.00`

2. Zomato
   - Food & Dining
   - `08:12 AM`
   - `- ₹320.00`

3. Salary
   - Income
   - `09:00 AM`
   - `+ ₹25,000.00`

#### Yesterday

4. Amazon
   - Shopping
   - `- ₹1,299.00`

5. UPI Transfer
   - Transfer
   - `- ₹5,000.00`

### Bottom navigation

Transactions is active.

The center Add button remains visible.

### Interaction

- Search filters rows
- Tabs filter by transaction type
- Selecting a transaction opens transaction details
- Pull-to-refresh may be supported
- Empty state should use the same visual language

---

## Screen 6 — Add Transaction

### Purpose

Allow the user to record an expense, income, or transfer.

### Header

Left:

- Back button

Center:

`Add Transaction`

Right:

- Plus icon in a circular dark button

### Type selector

Three tabs:

- Expense
- Income
- Transfer

Expense is selected in the reference:

- Lime background
- Black text

### Amount

Large centered amount:

`₹ 0.00`

- White
- Approximately 36–42 px
- Center aligned
- Generous vertical spacing

### Form fields

Each field is a dark rounded row with a leading icon.

#### Description

Label:

`Description`

Placeholder:

`e.g. Coffee, Salary...`

#### Category

Label:

`Category`

Value:

`Select category`

Right side:

- Chevron

#### Account

Label:

`Account`

Value:

`Select account`

Right side:

- Chevron

#### Date

Label:

`Date`

Value:

`12 Jun 2024`

#### Payment Method

Label:

`Payment Method`

Value:

`Select method`

Right side:

- Chevron

#### Note

Label:

`Add Note (optional)`

### Save button

Text:

`Save Transaction`

Styling:

- Full-width
- Lime background
- Black text
- Height: approximately 50–54 px
- Rounded pill
- Fixed near the bottom above the safe area

### Interaction

- Expense, Income, and Transfer change the form behavior
- Category/account/payment method open selection sheets
- Save validates required fields
- Successful save returns to Transactions or Home
- Amount input should support numeric keypad entry

---

## Screen 7 — Accounts

### Purpose

Display all financial accounts and their balances.

### Header

Left:

- Back button

Center:

`Accounts`

Right:

- Lime circular plus button

### Total balance card

Dark elevated card containing:

`Total Balance`

`₹1,24,530.00`

- Label muted gray
- Balance large and white
- Rounded corners approximately 20 px

### Account list

Use one large dark card or grouped list.

#### HDFC Bank

- Icon: HDFC-style red geometric mark in a white tile
- Type: `Bank Account`
- Balance: `₹68,420.00`

#### SBI Savings

- Icon: blue SBI-style circle in a white/blue tile
- Type: `Savings`
- Balance: `₹35,210.00`

#### Cash Wallet

- Icon: green wallet/bag symbol
- Type: `Cash`
- Balance: `₹12,450.00`

#### Google Pay

- Icon: Google Pay-style multicolor triangular mark
- Type: `UPI`
- Balance: `₹8,200.00`

### Row layout

- Icon at left
- Account name and type in the middle
- Balance aligned right
- Divider between rows
- Minimum row height: 72 px

### Interaction

- Plus button opens account creation
- Selecting an account opens account details
- Account details can show transactions and edit/delete actions

---

## Screen 8 — Budgets

### Purpose

Help users compare spending against planned monthly budgets.

### Header

Left:

- Back button

Center:

`Budgets`

Right:

- Small square action icon

### Month selector

Rounded dark pill:

`June 2024`

- Left chevron
- Centered month
- Right chevron

### Overall budget chart

Large circular progress ring.

Center text:

`₹18,240`

`of ₹30,000`

`61%`

Chart styling:

- Dark gray track
- Lime progress segment
- Smooth rounded line caps
- Center aligned labels

### Budget summary

Two columns:

#### Spent

- Lime dot
- Label: `Spent`
- Amount: `₹18,240.00`

#### Remaining

- Pale yellow/cream dot
- Label: `Remaining`
- Amount: `₹11,760.00`

### Category Budgets

Header:

`Category Budgets`

Right-side action:

`See all`

### Category rows

Each row includes:

- Colored rounded-square icon
- Category name
- Spent amount / budget amount
- Percentage
- Horizontal progress bar

#### Food & Dining

- `₹6,240 / ₹10,000`
- `62%`
- Yellow icon

#### Shopping

- `₹4,800 / ₹8,000`
- `60%`
- Pink icon

#### Transport

- `₹2,200 / ₹5,000`
- `44%`
- Yellow icon

### Progress bars

- Track: dark gray
- Fill: lime green
- Height: 6–8 px
- Rounded ends

### Interaction

- Month selector changes budget period
- Category row opens category budget details
- See all opens the full category list
- Action icon can open budget management

---

## Screen 9 — Savings Goals

### Purpose

Show progress toward personal savings targets.

### Header

Left:

- Back button

Center:

`Savings Goals`

Right:

- Lime circular plus button

### Total saved card

Dark elevated card with a green icon.

Text:

`Total Saved`

`₹42,500.00`

`3 Goals`

### Goal list

Each goal appears in a dark rounded card.

#### New Laptop

- Green icon tile
- Amount: `₹18,000 / ₹70,000`
- Percentage: `26%`
- Lime progress bar

#### Vacation

- Lavender icon tile
- Amount: `₹15,000 / ₹50,000`
- Percentage: `30%`
- Lime progress bar

#### Emergency Fund

- Yellow icon tile
- Amount: `₹9,500 / ₹1,00,000`
- Percentage: `10%`
- Lime progress bar

### Goal row layout

- Icon on the left
- Goal name
- Current amount / target amount
- Percentage aligned right
- Progress bar below the amount
- Divider between goals

### Interaction

- Plus button creates a goal
- Selecting a goal opens details
- Goal details support adding money, editing target, and marking complete

---

## Screen 10 — Profile / Settings

### Purpose

Provide account identity and access to app configuration.

### Header

Top-left:

- More/options circular button

Top-right:

- Notification bell icon

### Profile identity

Centered circular avatar:

`SM`

- Gray circular background
- Lavender initials
- Approximately 64–72 px

Name:

`Sahil Mulla`

Email:

`sahil@example.com`

Name is white and semibold.

Email is muted gray.

### Settings groups

Use dark rounded cards with rows.

#### Account group

1. Accounts
2. Payment Methods
3. Categories
4. Savings Goals
5. Budgets

Each row includes:

- Leading line icon
- Label
- Right chevron
- Divider

#### Preferences group

1. Appearance
   - Supporting text: `Light / Dark / System`

2. Notifications

3. Export Data

4. About

Each row follows the same structure.

### Sign Out button

Text:

`Sign Out`

Styling:

- Dark elevated rounded rectangle
- Red/pink text
- Full-width
- Height approximately 50–56 px

### Interaction

- Accounts opens account management
- Payment Methods opens payment method management
- Categories opens category management
- Savings Goals opens Screen 9
- Budgets opens Screen 8
- Appearance opens theme selection
- Notifications opens notification preferences
- Export Data opens export options
- About opens app information
- Sign Out opens confirmation dialog

---

# 6. Reusable Components

## 6.1 App Header

Properties:

- Back button optional
- Center title
- Right action optional
- Dark circular icon buttons
- Consistent vertical alignment

## 6.2 Pill Tab

States:

- Selected
- Unselected
- Pressed
- Disabled

Selected:

- Lime background
- Black text

Unselected:

- Dark gray background
- White/muted text

## 6.3 Account Card

Properties:

- Account icon
- Account name
- Account type
- Balance
- Masked identifier
- Optional add button

## 6.4 Transaction Row

Properties:

- Merchant icon
- Merchant title
- Category
- Date/time
- Amount
- Positive/negative state

## 6.5 Progress Bar

Properties:

- Track color
- Progress color
- Percentage
- Optional label

## 6.6 Bottom Navigation

Properties:

- Five items
- Center floating add button
- Active/inactive states
- Safe-area support

## 6.7 Form Row

Properties:

- Leading icon
- Label
- Value or placeholder
- Optional chevron
- Error state
- Disabled state

## 6.8 Summary Card

Properties:

- Icon
- Label
- Amount
- Change indicator
- Optional interaction chevron

---

# 7. Interaction and Motion

## 7.1 Motion Principles

- Short, smooth, and purposeful
- Avoid excessive animation in a finance app
- Use ease-out transitions
- Keep important financial values stable and readable

## 7.2 Suggested Animations

### Splash

- Logo fade and scale-in
- Wave layers move subtly

### Onboarding

- Illustration slide/fade
- Pagination dot transition
- Button press scale of 0.98

### Home

- Balance count-up on first load
- Account cards slide horizontally
- Transaction rows fade in

### Analytics

- Chart lines animate from left to right
- Selected month marker fades in
- Summary cards appear with slight upward motion

### Add Transaction

- Keyboard-safe form movement
- Save button remains visible
- Success confirmation uses a small check animation

### Budgets and Savings Goals

- Progress rings animate from zero to current percentage
- Progress bars animate on entry

---

# 8. Accessibility Requirements

- Maintain sufficient contrast between text and backgrounds
- Do not communicate positive/negative values by color alone
- Include text labels and icons
- Support Dynamic Type or scalable text
- Use minimum touch targets of 44 × 44 px
- Ensure chevrons and icon buttons have accessible labels
- Provide meaningful screen-reader names for financial values
- Use semantic headings and grouped sections
- Avoid placing critical text over decorative gradients

---

# 9. Figma File Organization

Recommended page structure:

1. `00 — Cover`
2. `01 — Design Tokens`
3. `02 — Components`
4. `03 — Splash & Onboarding`
5. `04 — Main Dashboard`
6. `05 — Transactions`
7. `06 — Accounts & Budgets`
8. `07 — Savings Goals`
9. `08 — Profile & Settings`
10. `09 — Prototype Flows`

### Naming convention

Use:

`Screen / Component / State`

Examples:

- `Home / Default`
- `Home / Notification Badge`
- `Transaction Row / Income`
- `Transaction Row / Expense`
- `Button / Primary`
- `Tab / Selected`
- `Tab / Unselected`

### Auto-layout

Use Auto Layout for:

- Cards
- Transaction rows
- Form rows
- Navigation items
- Settings rows
- Goal rows
- Budget rows

Use constraints:

- Left and right padding: fixed
- Cards: fill container width
- Amounts: hug contents
- Lists: vertical auto-layout
- Navigation: fixed to bottom

---

# 10. Prototype Flow

## First-time user

`Splash → Onboarding → Get Started → Account Creation → Home`

## Existing user

`Splash → Onboarding → I already have an account → Sign In → Home`

## Main app

`Home → Transactions`

`Home → Add Transaction`

`Home → Accounts`

`Home → Analytics`

`Home → Budgets`

`Home → Profile`

## Secondary flows

`Transactions → Transaction Details`

`Add Transaction → Category Selector`

`Add Transaction → Account Selector`

`Accounts → Account Details`

`Budgets → Category Budget Details`

`Savings Goals → Goal Details`

`Profile → Appearance`

`Profile → Export Data`

---

# 11. Fidelity Checklist

Before approving the design, verify:

- The app uses a near-black background on every screen
- Lime green is the primary action color
- Typography is clean, bold, and highly legible
- Cards have large rounded corners
- The same horizontal padding is used throughout
- Header positions are consistent
- The bottom navigation is identical across main screens
- The center Add button is larger and lime
- Positive amounts use green
- Expense indicators use pink/red
- Budget and savings progress bars use lime
- The logo remains consistent across Splash and onboarding
- No extra features are introduced beyond the ten reference screens
- Text, amounts, labels, and screen names match the reference
- All screens use the same visual language and component system
- The final implementation feels like one cohesive premium finance product

---

## Final Design Direction

Pocketflow should feel like a calm, premium financial command center. The interface must not look like a traditional banking dashboard. It should combine strong numeric hierarchy, soft rounded surfaces, minimal controls, subtle green energy, and simple financial language.

The most important visual anchors are:

1. The lime Pocketflow logo
2. The large balance number
3. Lime active controls
4. Rounded dark cards
5. Smooth financial charts
6. Progress rings and bars
7. The persistent center Add button
8. The restrained olive/black/green visual system
"""
out = "/mnt/data/Pocketflow_Finance_Design.md"
pypandoc.convert_text(md, 'md', format='md', outputfile=out, extra_args=['--standalone'])
print(out)
