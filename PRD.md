# Planning Guide

M.O.R.U.O is a sophisticated business value evaluator that transforms technology investment decisions into defensible financial analyses by quantifying ROI across income statements, balance sheets, and cash flow projections while assessing strategic impact and delivering clear go/no-go recommendations.

**Experience Qualities**:
1. **Authoritative** - The interface should project expertise and credibility through precise typography, professional color choices, and clear data visualization that builds trust in financial recommendations.
2. **Analytical** - Design should emphasize structure and clarity with well-organized sections, distinct metric categories, and visual hierarchy that guides users through complex financial analysis.
3. **Strategic** - The experience should feel executive-level with premium aesthetics, sophisticated interactions, and presentation-quality outputs suitable for board-level decision making.

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This application requires sophisticated state management for multi-step analysis workflows, dynamic financial calculations, industry-specific customization, scenario modeling with three projection levels, and comprehensive reporting capabilities. The interface must elegantly present dense financial data while maintaining usability.

## Essential Features

### Multi-Step Analysis Wizard
- **Functionality**: Guided workflow that collects customer name, subsidiary, sub-region, region (from structured options), use case details, baseline metrics, industry context, and strategic factors to generate comprehensive business value assessments.
- **Purpose**: Structures complex financial analysis into digestible steps, ensuring users provide all necessary inputs for accurate ROI projections, with customer attribution and organizational hierarchy for portfolio tracking across subsidiaries, sub-regions, regions, and global levels.
- **Trigger**: User clicks "New Analysis" button from dashboard.
- **Progression**: Customer & organizational hierarchy input (Region → Sub-Region → Subsidiary from structured dropdown lists) → Use case overview input → Industry selection → Baseline metrics entry → Impact modeling → Strategic scoring → Results generation → Review complete analysis with executive summary, financial projections, and recommendations.
- **Success criteria**: Users can complete full analysis in under 10 minutes; all required financial metrics are captured; output includes conservative/realistic/optimistic scenarios; customer name, subsidiary, sub-region, and region are captured from structured options ensuring data consistency for organizational hierarchy views.

### Industry-Specific Templates
- **Functionality**: Pre-configured metric templates and benchmarks for Banking, Technology, Retail, and Manufacturing sectors with relevant KPIs and target ranges.
- **Purpose**: Accelerates analysis by providing industry-appropriate baselines and comparison standards.
- **Trigger**: User selects industry during analysis setup.
- **Progression**: Industry selection → Template loads with pre-populated benchmark ranges → User customizes metrics → Benchmarks appear in final analysis comparisons.
- **Success criteria**: Each industry template includes 8-12 relevant metrics; benchmark data matches industry standards; users can override defaults.

### Financial Impact Calculator
- **Functionality**: Real-time calculation engine that projects ROI, NPV, payback period, and comprehensive metrics across income statement, balance sheet, and cash flow statement.
- **Purpose**: Provides immediate feedback on financial viability and quantifies business value in multiple dimensions.
- **Trigger**: User enters or modifies baseline/projected metrics.
- **Progression**: Metric input → Automatic calculation → Three scenario projections displayed → Risk-adjusted returns computed → Visual comparison charts rendered.
- **Success criteria**: Calculations update instantly; formulas accurately implement provided metrics; results match expected financial modeling standards.

### Saved Analysis Library
- **Functionality**: Persistent storage of completed analyses with search, filtering by customer/use case name, deletion, customer portfolio view, organizational hierarchy views (Global/Region/Sub-Region/Subsidiary), and comparison capabilities.
- **Purpose**: Enables portfolio management of technology investments across multiple customers and historical reference for decision tracking; provides holistic view of all use cases for each customer and aggregated views across organizational levels (subsidiary → sub-region → region → global).
- **Trigger**: Analysis is completed and saved; user navigates to library view.
- **Progression**: Save analysis → Appears in library with key metrics, customer name, subsidiary, sub-region, and region → Filter by customer/use case name/industry/priority/date → Access Global View to see consolidated metrics → Drill down by Region, Sub-Region, or Subsidiary → View customer portfolio to see all use cases for a specific customer → Select individual use case to view full report → Delete unwanted analyses → Compare multiple analyses side-by-side.
- **Success criteria**: All analyses persist across sessions; library displays customer groupings and summary cards with priority and ROI; search finds analyses by customer or use case name; customer view shows aggregated metrics and all use cases for that customer; Global/Region/Sub-Region/Subsidiary views provide accurate rolled-up metrics; deletion requires confirmation and cannot be undone.

### Global / Corporate View
- **Functionality**: Consolidated dashboard showing all use cases across the entire organization with drill-down capabilities by region, sub-region, subsidiary, and customer. Displays aggregated metrics, investment totals, and portfolio health indicators. Regions are structured as:
  - **Global**: Worldwide corporate umbrella across all regions
  - **MEA (Middle East & Africa)**: South Africa, MEA MCC, MEA HQ, UAE, Qatar, Saudi Arabia, Kuwait, East Africa, West Africa, and others
  - **North Europe**: UK & Ireland, Nordics, Benelux, and broader northern European markets
  - **South Europe**: Italy, Spain, Portugal (South MCC), Greece, and Israel
  - **Americas**: United States, Canada, and Latin America (Brazil, Mexico, Chile, Colombia, etc.)
- **Purpose**: Provides C-level executives and corporate leadership with a bird's-eye view of all technology investments across the organization, enabling strategic portfolio decisions and resource allocation across regions, sub-regions, and subsidiaries.
- **Trigger**: User clicks "Global View" button from Analysis Library.
- **Progression**: View global summary metrics (total use cases, investment, NPV, avg ROI) → Browse tabs for Region, Subsidiary, or Customer breakdowns → Click on specific region to view sub-regions → Click on sub-region or subsidiary to drill down → View detailed metrics and use case lists → Select individual use case for full analysis → Navigate back through hierarchy.
- **Success criteria**: Global metrics accurately aggregate all analyses; Region, Sub-Region, and Subsidiary tabs show accurate groupings using structured region data; drill-down navigation is intuitive; metrics update in real-time as analyses are added/edited; users can easily navigate between organizational levels.

### Region View
- **Functionality**: Regional dashboard showing all use cases within a specific geographic region (e.g., MEA, North Europe, South Europe, Americas, Global) with sub-region and subsidiary breakdowns and aggregated regional metrics.
- **Purpose**: Enables regional leaders to understand technology investment impact within their geography and compare performance across sub-regions and subsidiaries in their region.
- **Trigger**: User clicks on a region card from Global View.
- **Progression**: View regional summary metrics → Browse tabs for Sub-Regions and Subsidiaries → Click on sub-region to view its details → View all use cases in the region sorted by priority → Select individual use case or sub-region/subsidiary → Navigate back to Global View.
- **Success criteria**: Regional metrics accurately sum sub-region and subsidiary data; sub-region cards show correct groupings within the selected region; subsidiary cards show correct regional associations; use cases display with customer, sub-region, and subsidiary information; navigation maintains context.

### Sub-Region View
- **Functionality**: Sub-regional dashboard showing all use cases within a specific sub-region (e.g., UK & Ireland, Nordics, South Africa, UAE, Brazil) with aggregated sub-regional metrics.
- **Purpose**: Provides sub-regional leaders with visibility into technology investments within their geographic area, enabling comparison and prioritization of initiatives.
- **Trigger**: User clicks on a sub-region card from Region View.
- **Progression**: View sub-regional summary metrics with parent region context → View all use cases in the sub-region sorted by priority → Browse by customer or subsidiary → Select individual use case → Navigate back to Region View.
- **Success criteria**: Sub-regional metrics accurately aggregate use cases within that sub-region; parent region is clearly indicated; use cases display with customer and subsidiary information; navigation between sub-region and region views is seamless.

### Subsidiary View
- **Functionality**: Subsidiary-level dashboard showing all use cases within a specific subsidiary (e.g., South Africa Subsidiary, UK Subsidiary, USA Subsidiary) with customer breakdowns and aggregated subsidiary metrics.
- **Purpose**: Provides subsidiary leadership with visibility into all technology investments in their organization and enables customer portfolio management at the subsidiary level.
- **Trigger**: User clicks on a subsidiary card from Global View, Region View, or Sub-Region View.
- **Progression**: View subsidiary summary metrics with region and sub-region context → Browse customers with use cases in this subsidiary → View all subsidiary use cases sorted by priority → Select individual use case → Navigate back to previous view (Global, Region, or Sub-Region).
- **Success criteria**: Subsidiary metrics accurately aggregate customer use cases; customer groupings are correct; use cases display with customer information; region and sub-region context is clearly visible; navigation maintains the user's path through the hierarchy.

- **Functionality**: Aggregated dashboard showing all use cases attributed to a specific customer with portfolio-level metrics and insights.
- **Purpose**: Provides executives and account managers with a comprehensive view of technology investment initiatives for each customer, enabling strategic portfolio decisions.
- **Trigger**: User clicks on a customer card in the Analysis Library.
- **Progression**: Select customer → View portfolio summary with total investment, average ROI, and total NPV → Review priority distribution and industry breakdown → Browse all use cases for that customer sorted by priority → Select individual use case for detailed view → Return to library.
- **Success criteria**: Portfolio metrics accurately aggregate across all customer use cases; priority and industry distributions are visualized clearly; use cases are sortable and clickable; navigation back to library is seamless.

### Executive Report Generator
- **Functionality**: Formatted business case output following the six-section structure with clear recommendation and supporting data; CSV export capability for value dashboard data including top performers and solution area comparisons.
- **Purpose**: Creates presentation-ready documentation for stakeholder review and decision-making; enables data analysis in external tools like Excel for further financial modeling.
- **Trigger**: Analysis is completed; user views results; user clicks export buttons on Value Generation Dashboard.
- **Progression**: Complete analysis → Generate report → Display formatted sections → Allow export/sharing → Print-optimized layout available; alternatively, from Value Dashboard → Click "Export Data" to download CSV with all filtered use cases or "Export Areas" to download solution area comparison data → File downloads automatically with timestamped filename.
- **Success criteria**: Report includes all six required sections; formatting is executive-appropriate; data visualizations are clear and actionable; CSV exports contain all relevant metrics with proper formatting; filter criteria are documented in CSV file; files download with descriptive timestamped names.

## Edge Case Handling

- **Incomplete Data Entry** - Analysis wizard validates required fields at each step and prevents progression until critical metrics are provided.
- **Negative ROI Scenarios** - Calculator handles negative returns gracefully and surfaces warning indicators in recommendations.
- **Missing Industry Benchmarks** - System falls back to general enterprise benchmarks with clear indication when industry-specific data unavailable.
- **Very Long Use Case Names** - Text truncates elegantly in cards and lists with full name on hover/tooltip.
- **Zero or Invalid Metrics** - Input validation prevents division by zero; provides helpful error messages for out-of-range values.
- **Empty Analysis Library** - Attractive empty state encourages first analysis creation with sample template option.
- **Accidental Deletion** - Confirmation dialog prevents accidental analysis deletion; deleted items cannot be recovered.

## Design Direction

The design should evoke premium financial software that executives and CFOs would trust for investment decisions. Think Bloomberg Terminal meets modern SaaS—sophisticated data density balanced with contemporary usability. The interface should feel authoritative yet approachable, with clear visual hierarchy that prioritizes the most critical financial insights. Subtle gradients, precise typography, and purposeful color coding should create confidence while sophisticated micro-interactions add polish without distraction.

## Color Selection

A professional financial palette with deep navy as the foundation, vibrant teal for data emphasis, and warm amber for strategic highlights.

- **Primary Color**: Deep Navy `oklch(0.25 0.05 250)` - Conveys authority, trust, and financial expertise; serves as primary background for header and key sections.
- **Secondary Colors**: Slate Gray `oklch(0.45 0.01 250)` for supporting UI elements and muted backgrounds; Cool White `oklch(0.98 0.005 250)` for cards and content areas.
- **Accent Color**: Vibrant Teal `oklch(0.65 0.15 195)` - Attention-grabbing for CTAs, positive metrics, and interactive elements; represents growth and innovation.
- **Strategic Highlight**: Warm Amber `oklch(0.70 0.15 70)` - Used for strategic value indicators, warnings, and premium features.
- **Foreground/Background Pairings**: 
  - Primary Navy `oklch(0.25 0.05 250)`: Cool White text `oklch(0.98 0.005 250)` - Ratio 11.2:1 ✓
  - Accent Teal `oklch(0.65 0.15 195)`: Deep Navy text `oklch(0.25 0.05 250)` - Ratio 5.1:1 ✓
  - Background White `oklch(0.99 0 0)`: Deep Navy text `oklch(0.25 0.05 250)` - Ratio 12.8:1 ✓
  - Strategic Amber `oklch(0.70 0.15 70)`: Deep Navy text `oklch(0.25 0.05 250)` - Ratio 4.9:1 ✓

## Font Selection

Typography should project analytical precision and executive sophistication with a distinctive character that sets M.O.R.U.O apart from generic business tools.

- **Headings & Titles**: Space Grotesk (Bold/SemiBold) - Technical elegance with geometric precision; distinctive terminals add character while maintaining professionalism.
- **Body & Interface**: Inter (Regular/Medium) - Exceptional readability at all sizes; neutral enough for dense financial data without feeling generic.
- **Metrics & Numbers**: JetBrains Mono (Medium) - Tabular figures ensure perfect alignment; technical aesthetic reinforces analytical credibility.

- **Typographic Hierarchy**:
  - H1 (Page Title): Space Grotesk Bold / 36px / -0.02em letter spacing / 1.1 line height
  - H2 (Section Header): Space Grotesk SemiBold / 24px / -0.01em letter spacing / 1.2 line height
  - H3 (Subsection): Space Grotesk SemiBold / 18px / normal letter spacing / 1.3 line height
  - Body Text: Inter Regular / 15px / normal letter spacing / 1.6 line height
  - Small Text: Inter Regular / 13px / normal letter spacing / 1.5 line height
  - Metric Display: JetBrains Mono Medium / 28px / normal letter spacing / 1.2 line height
  - Metric Labels: Inter Medium / 12px / 0.03em letter spacing (uppercase) / 1.4 line height

## Animations

Animations should feel precise and purposeful, like data sliding into place in a well-engineered system. Motion reinforces the analytical nature of the tool—smooth state transitions between wizard steps with subtle slide/fade combinations; metric cards that scale in with slight elastic bounce to emphasize value; progress indicators that fill smoothly to show completion; hover states on interactive elements with quick scale and shadow changes (150ms) to signal clickability; and skeleton loading states that shimmer to indicate data processing. Avoid playful or bouncy animations; everything should feel controlled, professional, and confidence-inspiring.

## Component Selection

- **Components**: 
  - Card with subtle shadows for metric groupings and analysis summaries
  - Tabs for switching between analysis views (Overview, Financial, Strategic, Recommendations)
  - Progress indicator for wizard steps with number badges
  - Form with Label, Input, Select, and Textarea for data entry
  - Button in multiple variants (primary teal, secondary slate, ghost for tertiary actions)
  - Badge for priority levels (Critical=red, High=amber, Medium=teal, Low=slate)
  - Dialog for confirmations and metric explanations
  - Separator for visual section breaks
  - Tooltip for metric definitions and help text
  - Accordion for collapsible report sections
  - Table for benchmark comparisons and metric lists
  - Alert for validation messages and strategic warnings

- **Customizations**: 
  - Custom metric card component with large number display (JetBrains Mono), label, trend indicator (up/down arrow), and percentage change
  - Scenario comparison component showing conservative/realistic/optimistic projections side-by-side with visual highlighting
  - Priority badge with custom colors and icon indicators
  - Industry selector with icon representations of each sector
  - Custom wizard header showing step progress with connecting lines
  - Financial statement section cards with color-coded left borders (Income=teal, Balance=amber, Cash Flow=blue)

- **States**: 
  - Buttons have distinct hover (scale 1.02 + shadow), active (scale 0.98), disabled (opacity 0.5) states
  - Input fields show focus with teal ring and subtle scale increase
  - Cards elevate on hover with shadow transition
  - Wizard steps show completed (teal check), active (teal ring), and upcoming (gray) states
  - Metric cards pulse subtly when values update

- **Icon Selection**: 
  - TrendUp/TrendDown for metric changes
  - ChartBar for financial analysis sections
  - Target for strategic value
  - Calculator for ROI computations
  - Buildings for industry selection
  - CheckCircle for completed steps and positive recommendations
  - Warning for risk factors
  - ArrowRight for progression through wizard
  - Funnel for filtering library
  - Export for report generation

- **Spacing**: 
  - Section gaps: gap-8 (2rem)
  - Card internal padding: p-6 (1.5rem)
  - Form field spacing: gap-4 (1rem)
  - Metric grid gaps: gap-6 (1.5rem)
  - Page margins: px-8 py-6
  - Button padding: px-6 py-3 for primary, px-4 py-2 for secondary

- **Mobile**: 
  - Wizard steps collapse to vertical stepper on mobile
  - Metric cards stack in single column below 768px
  - Scenario comparisons switch from three-column to accordion layout
  - Table scrolls horizontally with sticky first column
  - Navigation moves to drawer/sheet on mobile
  - Font sizes reduce by 10-15% for body text on small screens
  - Touch targets minimum 44px for all interactive elements
