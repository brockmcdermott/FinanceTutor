import { FinanceTopic, FinanceScenario } from "@/features/tutoring/types";

export const financeTopics: FinanceTopic[] = [
  {
    id: "revenue",
    title: "Revenue Fundamentals",
    summary: "Estimate total income from sales volume and pricing assumptions.",
    order: 1,
    tags: ["Revenue", "Forecasting"],
    scenarios: [
      {
        id: "revenue-coffee-kiosk",
        topicId: "revenue",
        title: "Coffee Kiosk Monthly Sales",
        context:
          "A campus coffee kiosk sells 1,800 drinks per month at an average price of $5.25. It also sells 420 pastries at $3.50 each.",
        prompt: "Calculate the kiosk's total monthly revenue.",
        answerType: "mixed",
        expectedNumericAnswer: 10920,
        acceptedNumericTolerance: 25,
        numericLabel: "Monthly revenue",
        unit: "USD",
        writtenPrompt:
          "Briefly explain which assumptions might make your revenue estimate drift up or down in real life.",
        hint: "Revenue = (drinks x drink price) + (pastries x pastry price).",
        conceptChecklist: ["Revenue", "Units sold", "Average selling price"],
        difficulty: "foundation",
      },
    ],
  },
  {
    id: "gross-profit",
    title: "Gross Profit",
    summary: "Measure profitability after direct production or service delivery costs.",
    order: 2,
    tags: ["Gross Profit", "COGS"],
    scenarios: [
      {
        id: "gross-profit-bakery",
        topicId: "gross-profit",
        title: "Neighborhood Bakery Margin Check",
        context:
          "A bakery reports $68,000 in monthly revenue and $39,500 in direct ingredient and packaging costs.",
        prompt: "What is the bakery's gross profit for the month?",
        answerType: "mixed",
        expectedNumericAnswer: 28500,
        acceptedNumericTolerance: 20,
        numericLabel: "Gross profit",
        unit: "USD",
        writtenPrompt:
          "Describe one operational change that could improve gross profit without raising prices.",
        hint: "Gross profit = Revenue - Cost of goods sold.",
        conceptChecklist: ["Gross profit", "COGS", "Margin awareness"],
        difficulty: "foundation",
      },
    ],
  },
  {
    id: "net-profit",
    title: "Net Profit",
    summary: "Account for all expenses to estimate true bottom-line performance.",
    order: 3,
    tags: ["Net Profit", "Operating Expenses"],
    scenarios: [
      {
        id: "net-profit-fitness-studio",
        topicId: "net-profit",
        title: "Fitness Studio Income Statement",
        context:
          "A studio has $92,000 revenue, $41,000 direct costs, $18,000 fixed expenses, $21,500 variable operating expenses, and $4,200 taxes.",
        prompt: "Calculate monthly net profit.",
        answerType: "mixed",
        expectedNumericAnswer: 7300,
        acceptedNumericTolerance: 20,
        numericLabel: "Net profit",
        unit: "USD",
        writtenPrompt:
          "Which expense line would you investigate first to improve net profit and why?",
        hint:
          "Net profit = Revenue - direct costs - fixed expenses - variable expenses - taxes.",
        conceptChecklist: ["Net profit", "Expense layering", "Bottom-line analysis"],
        difficulty: "foundation",
      },
    ],
  },
  {
    id: "fixed-vs-variable",
    title: "Fixed vs Variable Expenses",
    summary: "Classify costs to understand operating leverage and sensitivity to sales.",
    order: 4,
    tags: ["Cost Structure", "Operating Leverage"],
    scenarios: [
      {
        id: "expense-mix-food-truck",
        topicId: "fixed-vs-variable",
        title: "Food Truck Cost Mix",
        context:
          "A food truck spends $4,200 on monthly permits + rent, $1,600 on staff base wages, and $7,800 on ingredients that change with sales.",
        prompt:
          "What percentage of total listed expenses is variable? Round to the nearest whole percent.",
        answerType: "mixed",
        expectedNumericAnswer: 57,
        acceptedNumericTolerance: 1,
        numericLabel: "Variable expense share",
        unit: "%",
        writtenPrompt:
          "Name one risk of having a high fixed-cost structure during slower months.",
        hint:
          "Variable share = variable expenses / total expenses. Convert to percent.",
        conceptChecklist: ["Fixed costs", "Variable costs", "Cost structure"],
        difficulty: "foundation",
      },
    ],
  },
  {
    id: "cash-flow",
    title: "Cash Flow",
    summary: "Track real cash movement to avoid liquidity surprises.",
    order: 5,
    tags: ["Cash Flow", "Liquidity"],
    scenarios: [
      {
        id: "cash-flow-landscaping",
        topicId: "cash-flow",
        title: "Landscaping Company Cash Position",
        context:
          "Beginning cash is $24,500. Cash in from clients is $37,000. Cash paid out for payroll, fuel, and equipment is $42,300.",
        prompt: "What is ending cash for the month?",
        answerType: "mixed",
        expectedNumericAnswer: 19200,
        acceptedNumericTolerance: 20,
        numericLabel: "Ending cash",
        unit: "USD",
        writtenPrompt:
          "Suggest one tactic to reduce cash-flow pressure without cutting service quality.",
        hint: "Ending cash = beginning cash + inflows - outflows.",
        conceptChecklist: ["Cash inflow", "Cash outflow", "Ending cash"],
        difficulty: "foundation",
      },
    ],
  },
  {
    id: "roi",
    title: "Return on Investment (ROI)",
    summary: "Evaluate returns relative to investment cost for decision-making.",
    order: 6,
    tags: ["ROI", "Investment Analysis"],
    scenarios: [
      {
        id: "roi-automation-project",
        topicId: "roi",
        title: "Warehouse Automation Proposal",
        context:
          "A company spends $85,000 on automation and expects annual net benefits of $19,550.",
        prompt: "Calculate annual ROI percentage (benefit / investment).",
        answerType: "mixed",
        expectedNumericAnswer: 23,
        acceptedNumericTolerance: 1,
        numericLabel: "Annual ROI",
        unit: "%",
        writtenPrompt:
          "What additional non-financial factor should be reviewed before approving this investment?",
        hint: "ROI (%) = (annual net benefits / total investment) x 100.",
        conceptChecklist: ["ROI", "Capital allocation", "Investment screening"],
        difficulty: "intermediate",
      },
    ],
  },
  {
    id: "cap-rate",
    title: "Cap Rate",
    summary: "Use NOI and property value to benchmark real estate investment yields.",
    order: 7,
    tags: ["Cap Rate", "Real Estate"],
    scenarios: [
      {
        id: "cap-rate-retail-building",
        topicId: "cap-rate",
        title: "Retail Building Underwriting",
        context:
          "A property has annual net operating income (NOI) of $126,000 and a purchase price of $1,575,000.",
        prompt: "Compute the cap rate percentage.",
        answerType: "mixed",
        expectedNumericAnswer: 8,
        acceptedNumericTolerance: 0.5,
        numericLabel: "Cap rate",
        unit: "%",
        writtenPrompt:
          "How would rising interest rates typically influence acceptable cap rates in this market?",
        hint: "Cap rate (%) = NOI / property value x 100.",
        conceptChecklist: ["NOI", "Cap rate", "Yield benchmarking"],
        difficulty: "intermediate",
      },
    ],
  },
];

export function getTopicById(topicId: string) {
  return financeTopics.find((topic) => topic.id === topicId);
}

export function getScenarioById(topicId: string, scenarioId: string): FinanceScenario | undefined {
  const topic = getTopicById(topicId);
  return topic?.scenarios.find((scenario) => scenario.id === scenarioId);
}

export const defaultTopicId = financeTopics[0]?.id ?? "revenue";
