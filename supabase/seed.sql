-- Seed data for tutoring content.
-- This is intentionally idempotent so it can be rerun after resets without duplicate rows.

do $$
declare
  v_subject_domain_id uuid;
  v_topic_id uuid;
  v_scenario_id uuid;
  v_skill_id uuid;
  v_skill_slug text;
  v_skill_data jsonb;
  v_topic_data jsonb;
  v_scenario_data jsonb;
  v_question_data jsonb;
begin
  insert into public.subject_domains (
    slug,
    title,
    description,
    is_active,
    metadata
  )
  values (
    'business-finance',
    'Business Finance & Accounting',
    'Scenario-based tutoring content for foundational business finance and accounting decisions.',
    true,
    '{"curriculum_version":"v1"}'::jsonb
  )
  on conflict (slug)
  do update
  set
    title = excluded.title,
    description = excluded.description,
    is_active = excluded.is_active,
    metadata = excluded.metadata
  returning id into v_subject_domain_id;

  for v_skill_data in
    select *
    from jsonb_array_elements(
      $skills$
      [
        {"slug":"revenue-calculation","name":"Revenue Calculation","description":"Compute total revenue from unit volume and pricing assumptions.","difficulty_level":"foundation","display_order":1},
        {"slug":"pricing-volume-analysis","name":"Pricing and Volume Analysis","description":"Explain how price and volume assumptions drive topline changes.","difficulty_level":"foundation","display_order":2},
        {"slug":"assumption-analysis","name":"Assumption Analysis","description":"State and critique assumptions in financial reasoning.","difficulty_level":"foundation","display_order":3},
        {"slug":"gross-profit-calculation","name":"Gross Profit Calculation","description":"Calculate gross profit from revenue and direct costs.","difficulty_level":"foundation","display_order":4},
        {"slug":"cost-of-goods-analysis","name":"Cost of Goods Analysis","description":"Identify and reason about direct cost drivers.","difficulty_level":"foundation","display_order":5},
        {"slug":"net-profit-calculation","name":"Net Profit Calculation","description":"Compute bottom-line profit after all major expense categories.","difficulty_level":"foundation","display_order":6},
        {"slug":"expense-structure-analysis","name":"Expense Structure Analysis","description":"Assess operating cost structure and its performance implications.","difficulty_level":"foundation","display_order":7},
        {"slug":"fixed-cost-identification","name":"Fixed Cost Identification","description":"Classify costs that stay stable across activity levels.","difficulty_level":"foundation","display_order":8},
        {"slug":"variable-cost-identification","name":"Variable Cost Identification","description":"Classify costs that move with sales or production activity.","difficulty_level":"foundation","display_order":9},
        {"slug":"cash-flow-reconciliation","name":"Cash Flow Reconciliation","description":"Track starting cash, inflows, outflows, and ending cash.","difficulty_level":"foundation","display_order":10},
        {"slug":"roi-calculation","name":"ROI Calculation","description":"Evaluate return on investment as benefit divided by investment.","difficulty_level":"intermediate","display_order":11},
        {"slug":"investment-evaluation","name":"Investment Evaluation","description":"Compare projects using return, risk, and operating assumptions.","difficulty_level":"intermediate","display_order":12},
        {"slug":"cap-rate-calculation","name":"Cap Rate Calculation","description":"Compute cap rate from NOI and property value.","difficulty_level":"intermediate","display_order":13}
      ]
      $skills$::jsonb
    )
  loop
    insert into public.tutoring_skills (
      subject_domain_id,
      slug,
      name,
      description,
      difficulty_level,
      display_order,
      is_active,
      metadata
    )
    values (
      v_subject_domain_id,
      v_skill_data->>'slug',
      v_skill_data->>'name',
      v_skill_data->>'description',
      coalesce(v_skill_data->>'difficulty_level', 'foundation'),
      coalesce((v_skill_data->>'display_order')::integer, 1),
      true,
      coalesce(v_skill_data->'metadata', '{}'::jsonb)
    )
    on conflict (subject_domain_id, slug)
    do update
    set
      name = excluded.name,
      description = excluded.description,
      difficulty_level = excluded.difficulty_level,
      display_order = excluded.display_order,
      is_active = excluded.is_active,
      metadata = excluded.metadata;
  end loop;

  for v_topic_data in
    select *
    from jsonb_array_elements(
      $topics$
      [
        {
          "slug":"revenue",
          "title":"Revenue",
          "summary":"Estimate total income from realistic sales activity and pricing assumptions.",
          "display_order":1,
          "skills":["revenue-calculation","pricing-volume-analysis","assumption-analysis"],
          "scenarios":[
            {
              "slug":"coffee-shop-morning-rush",
              "title":"Coffee Shop Morning Rush",
              "business_context":"A downtown coffee shop sold 2,200 drinks at an average price of $4.80 and 900 pastries at $3.20 this month.",
              "difficulty_level":"foundation",
              "display_order":1,
              "estimated_minutes":8,
              "skills":["revenue-calculation","pricing-volume-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Calculate total monthly revenue for the coffee shop.",
                  "response_format":"mixed",
                  "numeric_answer":13440,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"Explain one assumption that could cause actual revenue to differ from this estimate.",
                  "hint":"Revenue is the sum of each product line's units multiplied by price.",
                  "rubric":{"focus":["formula accuracy","assumption quality"]}
                }
              ]
            },
            {
              "slug":"campground-weekend-bookings",
              "title":"Campground Weekend Bookings",
              "business_context":"A campground sold 160 tent-site nights at $48, 35 cabin nights at $115, and 52 kayak rentals at $18 over a peak month.",
              "difficulty_level":"foundation",
              "display_order":2,
              "estimated_minutes":9,
              "skills":["revenue-calculation","assumption-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Compute total monthly revenue across all campground offerings.",
                  "response_format":"mixed",
                  "numeric_answer":12641,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"Describe one way seasonality can affect this revenue model.",
                  "hint":"Add site-night, cabin-night, and rental revenue separately before summing.",
                  "rubric":{"focus":["line-item calculation","seasonality reasoning"]}
                }
              ]
            },
            {
              "slug":"mobile-detailing-packages",
              "title":"Mobile Detailing Packages",
              "business_context":"A mobile detailing business completed 68 basic washes at $95, 37 premium packages at $155, and 22 wax add-ons at $45 this month.",
              "difficulty_level":"foundation",
              "display_order":3,
              "estimated_minutes":8,
              "skills":["revenue-calculation","pricing-volume-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"What is total monthly revenue from all service categories?",
                  "response_format":"mixed",
                  "numeric_answer":13185,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"Which service category should be monitored most closely and why?",
                  "hint":"Multiply counts by price for each package, then sum all three totals.",
                  "rubric":{"focus":["multi-line aggregation","business prioritization"]}
                }
              ]
            }
          ]
        },
        {
          "slug":"gross-profit",
          "title":"Gross Profit",
          "summary":"Analyze profitability after direct service or production costs.",
          "display_order":2,
          "skills":["gross-profit-calculation","cost-of-goods-analysis","expense-structure-analysis"],
          "scenarios":[
            {
              "slug":"neighborhood-salon-services",
              "title":"Neighborhood Salon Service Mix",
              "business_context":"A salon generated $54,000 in service revenue and incurred $21,400 in direct stylist commissions and product costs.",
              "difficulty_level":"foundation",
              "display_order":1,
              "estimated_minutes":8,
              "skills":["gross-profit-calculation","cost-of-goods-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Calculate gross profit for the month.",
                  "response_format":"mixed",
                  "numeric_answer":32600,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"Name one operational action that could improve gross profit without raising prices.",
                  "hint":"Gross profit equals revenue minus direct costs tied to delivering services.",
                  "rubric":{"focus":["gross profit formula","practical recommendation"]}
                }
              ]
            },
            {
              "slug":"artisan-bakery-wholesale",
              "title":"Artisan Bakery Wholesale Orders",
              "business_context":"A bakery posted $72,500 in revenue and $43,100 in flour, packaging, and direct baking labor costs.",
              "difficulty_level":"foundation",
              "display_order":2,
              "estimated_minutes":9,
              "skills":["gross-profit-calculation","cost-of-goods-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Determine monthly gross profit from wholesale operations.",
                  "response_format":"mixed",
                  "numeric_answer":29400,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"What direct-cost category would you review first if margins shrink?",
                  "hint":"Subtract cost of goods sold from revenue.",
                  "rubric":{"focus":["calculation precision","cost-driver awareness"]}
                }
              ]
            },
            {
              "slug":"custom-tshirt-shop",
              "title":"Custom T-Shirt Shop Production",
              "business_context":"A print shop earned $48,200 in revenue. Direct shirt blanks, inks, and print-floor labor totaled $29,850.",
              "difficulty_level":"foundation",
              "display_order":3,
              "estimated_minutes":8,
              "skills":["gross-profit-calculation","expense-structure-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Compute gross profit for the period.",
                  "response_format":"mixed",
                  "numeric_answer":18350,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"How could batch scheduling improve gross profit outcomes?",
                  "hint":"Gross profit is revenue less direct input and production costs.",
                  "rubric":{"focus":["gross profit mechanics","operations link"]}
                }
              ]
            }
          ]
        },
        {
          "slug":"net-profit",
          "title":"Net Profit",
          "summary":"Work from revenue through all major expense layers to estimate bottom-line performance.",
          "display_order":3,
          "skills":["net-profit-calculation","expense-structure-analysis","assumption-analysis"],
          "scenarios":[
            {
              "slug":"lakeside-rental-cabin",
              "title":"Lakeside Rental Cabin",
              "business_context":"A cabin business reported $38,400 revenue, $4,600 direct turnover costs, $15,200 fixed costs, $6,850 variable operating costs, and $1,940 taxes.",
              "difficulty_level":"foundation",
              "display_order":1,
              "estimated_minutes":10,
              "skills":["net-profit-calculation","expense-structure-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Calculate net profit for the month.",
                  "response_format":"mixed",
                  "numeric_answer":9810,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"Which expense line would you evaluate first to improve next month net profit?",
                  "hint":"Net profit equals revenue minus direct, fixed, variable, and tax expenses.",
                  "rubric":{"focus":["expense layering","decision prioritization"]}
                }
              ]
            },
            {
              "slug":"food-truck-lunch-route",
              "title":"Food Truck Lunch Route",
              "business_context":"A food truck generated $64,500 in revenue with $27,900 food costs, $11,400 fixed costs, $18,250 variable operating costs, and $2,100 taxes.",
              "difficulty_level":"foundation",
              "display_order":2,
              "estimated_minutes":10,
              "skills":["net-profit-calculation","assumption-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Find net profit for the month.",
                  "response_format":"mixed",
                  "numeric_answer":4850,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"Suggest one action that improves net profit without increasing menu prices.",
                  "hint":"Subtract every listed expense category from revenue.",
                  "rubric":{"focus":["full-income-statement math","operational improvement"]}
                }
              ]
            },
            {
              "slug":"tutoring-center-evenings",
              "title":"Tutoring Center Evening Program",
              "business_context":"An after-hours tutoring center reported $52,000 in revenue, $24,700 instructor payroll, $12,300 fixed overhead, $8,450 variable operations, and $1,960 taxes.",
              "difficulty_level":"foundation",
              "display_order":3,
              "estimated_minutes":9,
              "skills":["net-profit-calculation","expense-structure-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Compute monthly net profit.",
                  "response_format":"mixed",
                  "numeric_answer":4590,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"What assumption in this scenario is most likely to be volatile month to month?",
                  "hint":"Treat instructor payroll as a direct expense in this scenario.",
                  "rubric":{"focus":["classification consistency","variance awareness"]}
                }
              ]
            }
          ]
        },
        {
          "slug":"fixed-vs-variable-expenses",
          "title":"Fixed vs. Variable Expenses",
          "summary":"Classify and analyze cost structure to understand operating leverage.",
          "display_order":4,
          "skills":["fixed-cost-identification","variable-cost-identification","expense-structure-analysis"],
          "scenarios":[
            {
              "slug":"campground-cost-mix",
              "title":"Campground Cost Mix",
              "business_context":"A campground has $26,400 of fixed monthly costs and $18,600 of variable monthly costs.",
              "difficulty_level":"foundation",
              "display_order":1,
              "estimated_minutes":8,
              "skills":["fixed-cost-identification","variable-cost-identification"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"What percentage of total costs is variable? Round to the nearest whole percent.",
                  "response_format":"mixed",
                  "numeric_answer":41,
                  "numeric_tolerance":1,
                  "unit":"%",
                  "explanation_prompt":"Why does this cost structure matter during off-season demand?",
                  "hint":"Variable percentage = variable costs / total costs x 100.",
                  "rubric":{"focus":["cost-share math","risk interpretation"]}
                }
              ]
            },
            {
              "slug":"residential-cleaning-team",
              "title":"Residential Cleaning Team",
              "business_context":"A cleaning company carries $9,200 fixed costs and $14,800 variable costs each month.",
              "difficulty_level":"foundation",
              "display_order":2,
              "estimated_minutes":8,
              "skills":["fixed-cost-identification","expense-structure-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Calculate the variable-cost share of total costs, rounded to the nearest whole percent.",
                  "response_format":"mixed",
                  "numeric_answer":62,
                  "numeric_tolerance":1,
                  "unit":"%",
                  "explanation_prompt":"What staffing decision could reduce risk in slower months?",
                  "hint":"Total cost is fixed plus variable; then divide variable by total.",
                  "rubric":{"focus":["percentage computation","operating leverage insight"]}
                }
              ]
            },
            {
              "slug":"subscription-snack-box",
              "title":"Subscription Snack Box",
              "business_context":"A subscription snack business has $12,500 fixed monthly costs and $27,500 variable costs.",
              "difficulty_level":"foundation",
              "display_order":3,
              "estimated_minutes":9,
              "skills":["variable-cost-identification","expense-structure-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"What percentage of total monthly costs is variable? Round to the nearest whole percent.",
                  "response_format":"mixed",
                  "numeric_answer":69,
                  "numeric_tolerance":1,
                  "unit":"%",
                  "explanation_prompt":"How does a higher variable mix affect break-even risk?",
                  "hint":"Compute variable / (fixed + variable) and convert to percent.",
                  "rubric":{"focus":["cost-structure ratio","break-even reasoning"]}
                }
              ]
            }
          ]
        },
        {
          "slug":"cash-flow",
          "title":"Cash Flow",
          "summary":"Track real cash movement to prevent shortfalls and liquidity surprises.",
          "display_order":5,
          "skills":["cash-flow-reconciliation","assumption-analysis"],
          "scenarios":[
            {
              "slug":"landscaping-spring-ramp",
              "title":"Landscaping Spring Ramp",
              "business_context":"Beginning cash is $18,200. Monthly inflows are $42,600 and monthly outflows are $39,750.",
              "difficulty_level":"foundation",
              "display_order":1,
              "estimated_minutes":8,
              "skills":["cash-flow-reconciliation"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Calculate ending cash for the month.",
                  "response_format":"mixed",
                  "numeric_answer":21050,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"What is one operational tactic to protect cash in a slower month?",
                  "hint":"Ending cash = beginning cash + inflows - outflows.",
                  "rubric":{"focus":["cash reconciliation","liquidity management"]}
                }
              ]
            },
            {
              "slug":"boutique-gym-membership-cycle",
              "title":"Boutique Gym Membership Cycle",
              "business_context":"A gym starts with $31,400 in cash, receives $56,800 in cash, and pays out $61,950 in cash this month.",
              "difficulty_level":"foundation",
              "display_order":2,
              "estimated_minutes":8,
              "skills":["cash-flow-reconciliation","assumption-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"What is ending cash for the month?",
                  "response_format":"mixed",
                  "numeric_answer":26250,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"Why can a profitable business still experience cash pressure?",
                  "hint":"Use beginning cash plus inflows minus outflows.",
                  "rubric":{"focus":["ending-cash math","cash-vs-profit understanding"]}
                }
              ]
            },
            {
              "slug":"event-planning-studio",
              "title":"Event Planning Studio",
              "business_context":"An event studio begins with $14,900, collects $28,300, and spends $24,740 during the month.",
              "difficulty_level":"foundation",
              "display_order":3,
              "estimated_minutes":9,
              "skills":["cash-flow-reconciliation","assumption-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Compute ending cash at month end.",
                  "response_format":"mixed",
                  "numeric_answer":18460,
                  "numeric_tolerance":20,
                  "unit":"USD",
                  "explanation_prompt":"What cash-collection policy could improve reliability of inflows?",
                  "hint":"Add inflows to beginning cash, then subtract outflows.",
                  "rubric":{"focus":["cash-flow mechanics","collections strategy"]}
                }
              ]
            }
          ]
        },
        {
          "slug":"roi",
          "title":"ROI",
          "summary":"Measure expected return relative to investment size for capital decisions.",
          "display_order":6,
          "skills":["roi-calculation","investment-evaluation","assumption-analysis"],
          "scenarios":[
            {
              "slug":"espresso-machine-upgrade",
              "title":"Espresso Machine Upgrade",
              "business_context":"A cafe is considering a $72,000 equipment investment with estimated annual net benefits of $18,360.",
              "difficulty_level":"intermediate",
              "display_order":1,
              "estimated_minutes":9,
              "skills":["roi-calculation","investment-evaluation"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Calculate annual ROI percentage.",
                  "response_format":"mixed",
                  "numeric_answer":25.5,
                  "numeric_tolerance":0.5,
                  "unit":"%",
                  "explanation_prompt":"What non-financial factor should influence the final go/no-go decision?",
                  "hint":"ROI (%) = annual net benefits / investment x 100.",
                  "rubric":{"focus":["ROI formula","decision context"]}
                }
              ]
            },
            {
              "slug":"digital-ad-campaign",
              "title":"Digital Ad Campaign",
              "business_context":"A service business plans to invest $24,000 in digital ads and expects $9,600 of annual net benefit.",
              "difficulty_level":"intermediate",
              "display_order":2,
              "estimated_minutes":8,
              "skills":["roi-calculation","assumption-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Compute expected annual ROI percentage.",
                  "response_format":"mixed",
                  "numeric_answer":40,
                  "numeric_tolerance":0.5,
                  "unit":"%",
                  "explanation_prompt":"Which assumption in this ROI estimate is most likely to be optimistic?",
                  "hint":"Divide annual benefit by investment and convert to percent.",
                  "rubric":{"focus":["return calculation","assumption stress-test"]}
                }
              ]
            },
            {
              "slug":"hvac-service-van",
              "title":"HVAC Service Van Purchase",
              "business_context":"An HVAC company evaluates a $58,000 van purchase with annual net benefits projected at $12,760.",
              "difficulty_level":"intermediate",
              "display_order":3,
              "estimated_minutes":9,
              "skills":["roi-calculation","investment-evaluation"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"What is projected annual ROI percentage?",
                  "response_format":"mixed",
                  "numeric_answer":22,
                  "numeric_tolerance":0.5,
                  "unit":"%",
                  "explanation_prompt":"How would utilization risk affect confidence in this estimate?",
                  "hint":"ROI (%) = benefit / investment x 100.",
                  "rubric":{"focus":["capital return math","risk commentary"]}
                }
              ]
            }
          ]
        },
        {
          "slug":"cap-rate",
          "title":"Cap Rate",
          "summary":"Benchmark property yields using net operating income and purchase value.",
          "display_order":7,
          "skills":["cap-rate-calculation","investment-evaluation","assumption-analysis"],
          "scenarios":[
            {
              "slug":"duplex-acquisition",
              "title":"Duplex Acquisition",
              "business_context":"A duplex has annual NOI of $38,400 and an expected purchase price of $480,000.",
              "difficulty_level":"intermediate",
              "display_order":1,
              "estimated_minutes":9,
              "skills":["cap-rate-calculation","investment-evaluation"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Calculate the cap rate percentage.",
                  "response_format":"mixed",
                  "numeric_answer":8,
                  "numeric_tolerance":0.3,
                  "unit":"%",
                  "explanation_prompt":"What local market variable should you compare this cap rate against?",
                  "hint":"Cap rate (%) = NOI / property value x 100.",
                  "rubric":{"focus":["NOI-based yield math","market comparison"]}
                }
              ]
            },
            {
              "slug":"neighborhood-retail-plaza",
              "title":"Neighborhood Retail Plaza",
              "business_context":"A small retail plaza reports $192,500 NOI with a target acquisition price of $2,450,000.",
              "difficulty_level":"intermediate",
              "display_order":2,
              "estimated_minutes":10,
              "skills":["cap-rate-calculation","assumption-analysis"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Compute the cap rate percentage for this deal.",
                  "response_format":"mixed",
                  "numeric_answer":7.9,
                  "numeric_tolerance":0.3,
                  "unit":"%",
                  "explanation_prompt":"How could interest-rate changes alter acceptable cap rates in this market?",
                  "hint":"Divide NOI by price, then convert to a percentage.",
                  "rubric":{"focus":["yield conversion","rate-environment reasoning"]}
                }
              ]
            },
            {
              "slug":"glamping-campground-property",
              "title":"Glamping Campground Property",
              "business_context":"A glamping property produces $268,000 in annual NOI and is priced at $3,150,000.",
              "difficulty_level":"intermediate",
              "display_order":3,
              "estimated_minutes":10,
              "skills":["cap-rate-calculation","investment-evaluation"],
              "questions":[
                {
                  "question_order":1,
                  "prompt":"Determine the cap rate percentage.",
                  "response_format":"mixed",
                  "numeric_answer":8.5,
                  "numeric_tolerance":0.3,
                  "unit":"%",
                  "explanation_prompt":"Which underwriting assumption could most quickly change this cap rate outlook?",
                  "hint":"Cap rate is NOI divided by value, expressed as a percent.",
                  "rubric":{"focus":["cap-rate formula","underwriting sensitivity"]}
                }
              ]
            }
          ]
        }
      ]
      $topics$::jsonb
    )
  loop
    insert into public.tutoring_topics (
      subject_domain_id,
      slug,
      title,
      summary,
      display_order,
      is_active,
      metadata
    )
    values (
      v_subject_domain_id,
      v_topic_data->>'slug',
      v_topic_data->>'title',
      v_topic_data->>'summary',
      coalesce((v_topic_data->>'display_order')::integer, 1),
      true,
      coalesce(v_topic_data->'metadata', '{}'::jsonb)
    )
    on conflict (subject_domain_id, slug)
    do update
    set
      title = excluded.title,
      summary = excluded.summary,
      display_order = excluded.display_order,
      is_active = excluded.is_active,
      metadata = excluded.metadata
    returning id into v_topic_id;

    delete from public.tutoring_topic_skills
    where topic_id = v_topic_id;

    for v_skill_slug in
      select jsonb_array_elements_text(coalesce(v_topic_data->'skills', '[]'::jsonb))
    loop
      select id
      into v_skill_id
      from public.tutoring_skills
      where subject_domain_id = v_subject_domain_id
        and slug = v_skill_slug;

      if v_skill_id is null then
        raise exception 'Missing skill slug in topic seed: %', v_skill_slug;
      end if;

      insert into public.tutoring_topic_skills (topic_id, skill_id)
      values (v_topic_id, v_skill_id)
      on conflict (topic_id, skill_id) do nothing;
    end loop;

    for v_scenario_data in
      select *
      from jsonb_array_elements(coalesce(v_topic_data->'scenarios', '[]'::jsonb))
    loop
      insert into public.tutoring_scenarios (
        topic_id,
        slug,
        title,
        business_context,
        difficulty_level,
        display_order,
        estimated_minutes,
        is_active,
        metadata
      )
      values (
        v_topic_id,
        v_scenario_data->>'slug',
        v_scenario_data->>'title',
        v_scenario_data->>'business_context',
        coalesce(v_scenario_data->>'difficulty_level', 'foundation'),
        coalesce((v_scenario_data->>'display_order')::integer, 1),
        nullif(v_scenario_data->>'estimated_minutes', '')::integer,
        true,
        coalesce(v_scenario_data->'metadata', '{}'::jsonb)
      )
      on conflict (topic_id, slug)
      do update
      set
        title = excluded.title,
        business_context = excluded.business_context,
        difficulty_level = excluded.difficulty_level,
        display_order = excluded.display_order,
        estimated_minutes = excluded.estimated_minutes,
        is_active = excluded.is_active,
        metadata = excluded.metadata
      returning id into v_scenario_id;

      delete from public.tutoring_scenario_skills
      where scenario_id = v_scenario_id;

      for v_skill_slug in
        select jsonb_array_elements_text(coalesce(v_scenario_data->'skills', '[]'::jsonb))
      loop
        select id
        into v_skill_id
        from public.tutoring_skills
        where subject_domain_id = v_subject_domain_id
          and slug = v_skill_slug;

        if v_skill_id is null then
          raise exception 'Missing skill slug in scenario seed: %', v_skill_slug;
        end if;

        insert into public.tutoring_scenario_skills (
          scenario_id,
          skill_id,
          skill_weight
        )
        values (
          v_scenario_id,
          v_skill_id,
          1.0
        )
        on conflict (scenario_id, skill_id)
        do update
        set
          skill_weight = excluded.skill_weight;
      end loop;

      for v_question_data in
        select *
        from jsonb_array_elements(coalesce(v_scenario_data->'questions', '[]'::jsonb))
      loop
        insert into public.tutoring_scenario_questions (
          scenario_id,
          question_order,
          prompt,
          response_format,
          numeric_answer,
          numeric_tolerance,
          unit,
          explanation_prompt,
          hint,
          rubric,
          metadata
        )
        values (
          v_scenario_id,
          coalesce((v_question_data->>'question_order')::integer, 1),
          v_question_data->>'prompt',
          coalesce(v_question_data->>'response_format', 'mixed'),
          nullif(v_question_data->>'numeric_answer', '')::numeric,
          nullif(v_question_data->>'numeric_tolerance', '')::numeric,
          nullif(v_question_data->>'unit', ''),
          nullif(v_question_data->>'explanation_prompt', ''),
          nullif(v_question_data->>'hint', ''),
          coalesce(v_question_data->'rubric', '{}'::jsonb),
          coalesce(v_question_data->'metadata', '{}'::jsonb)
        )
        on conflict (scenario_id, question_order)
        do update
        set
          prompt = excluded.prompt,
          response_format = excluded.response_format,
          numeric_answer = excluded.numeric_answer,
          numeric_tolerance = excluded.numeric_tolerance,
          unit = excluded.unit,
          explanation_prompt = excluded.explanation_prompt,
          hint = excluded.hint,
          rubric = excluded.rubric,
          metadata = excluded.metadata;
      end loop;
    end loop;
  end loop;
end
$$;

-- Demo booster scenarios to keep the prototype feeling populated for live walkthroughs.

with domain as (
  select id
  from public.subject_domains
  where slug = 'business-finance'
),
topic as (
  select t.id as topic_id
  from public.tutoring_topics t
  join domain d on d.id = t.subject_domain_id
  where t.slug = 'revenue'
),
scenario_upsert as (
  insert into public.tutoring_scenarios (
    topic_id,
    slug,
    title,
    business_context,
    difficulty_level,
    display_order,
    estimated_minutes,
    is_active,
    metadata
  )
  select
    topic.topic_id,
    'farmers-market-pop-up-week',
    'Farmers Market Pop-Up Week',
    'A bakery sold 410 boxed desserts at $11, 280 coffee bundles at $7, and 145 branded mugs at $16 during a pop-up week.',
    'foundation',
    4,
    8,
    true,
    '{"seed_group":"demo_booster"}'::jsonb
  from topic
  on conflict (topic_id, slug)
  do update
  set
    title = excluded.title,
    business_context = excluded.business_context,
    difficulty_level = excluded.difficulty_level,
    display_order = excluded.display_order,
    estimated_minutes = excluded.estimated_minutes,
    is_active = excluded.is_active,
    metadata = excluded.metadata
  returning id
),
scenario_ref as (
  select id as scenario_id from scenario_upsert
  union all
  select s.id
  from public.tutoring_scenarios s
  join public.tutoring_topics t on t.id = s.topic_id
  join domain d on d.id = t.subject_domain_id
  where t.slug = 'revenue'
    and s.slug = 'farmers-market-pop-up-week'
  limit 1
)
insert into public.tutoring_scenario_skills (
  scenario_id,
  skill_id,
  skill_weight
)
select
  ref.scenario_id,
  sk.id,
  1.0
from scenario_ref ref
join domain d on true
join public.tutoring_skills sk
  on sk.subject_domain_id = d.id
 and sk.slug in ('revenue-calculation', 'pricing-volume-analysis', 'assumption-analysis')
on conflict (scenario_id, skill_id)
do update
set skill_weight = excluded.skill_weight;

with domain as (
  select id
  from public.subject_domains
  where slug = 'business-finance'
),
scenario_ref as (
  select s.id as scenario_id
  from public.tutoring_scenarios s
  join public.tutoring_topics t on t.id = s.topic_id
  join domain d on d.id = t.subject_domain_id
  where t.slug = 'revenue'
    and s.slug = 'farmers-market-pop-up-week'
  limit 1
)
insert into public.tutoring_scenario_questions (
  scenario_id,
  question_order,
  prompt,
  response_format,
  numeric_answer,
  numeric_tolerance,
  unit,
  explanation_prompt,
  hint,
  rubric,
  metadata
)
select
  ref.scenario_id,
  1,
  'What is total revenue from all three product lines for the pop-up week?',
  'mixed',
  8790,
  20,
  'USD',
  'Explain which product line you would scale first and why.',
  'Multiply each line''s units by price, then sum all line totals.',
  '{"focus":["revenue aggregation","growth prioritization"]}'::jsonb,
  '{"seed_group":"demo_booster"}'::jsonb
from scenario_ref ref
on conflict (scenario_id, question_order)
do update
set
  prompt = excluded.prompt,
  response_format = excluded.response_format,
  numeric_answer = excluded.numeric_answer,
  numeric_tolerance = excluded.numeric_tolerance,
  unit = excluded.unit,
  explanation_prompt = excluded.explanation_prompt,
  hint = excluded.hint,
  rubric = excluded.rubric,
  metadata = excluded.metadata;

with domain as (
  select id
  from public.subject_domains
  where slug = 'business-finance'
),
topic as (
  select t.id as topic_id
  from public.tutoring_topics t
  join domain d on d.id = t.subject_domain_id
  where t.slug = 'cash-flow'
),
scenario_upsert as (
  insert into public.tutoring_scenarios (
    topic_id,
    slug,
    title,
    business_context,
    difficulty_level,
    display_order,
    estimated_minutes,
    is_active,
    metadata
  )
  select
    topic.topic_id,
    'seasonal-pool-service-gap',
    'Seasonal Pool Service Cash Gap',
    'Beginning cash is $9,700. Cash inflows are $24,900 and cash outflows are $28,650 during shoulder season.',
    'foundation',
    4,
    8,
    true,
    '{"seed_group":"demo_booster"}'::jsonb
  from topic
  on conflict (topic_id, slug)
  do update
  set
    title = excluded.title,
    business_context = excluded.business_context,
    difficulty_level = excluded.difficulty_level,
    display_order = excluded.display_order,
    estimated_minutes = excluded.estimated_minutes,
    is_active = excluded.is_active,
    metadata = excluded.metadata
  returning id
),
scenario_ref as (
  select id as scenario_id from scenario_upsert
  union all
  select s.id
  from public.tutoring_scenarios s
  join public.tutoring_topics t on t.id = s.topic_id
  join domain d on d.id = t.subject_domain_id
  where t.slug = 'cash-flow'
    and s.slug = 'seasonal-pool-service-gap'
  limit 1
)
insert into public.tutoring_scenario_skills (
  scenario_id,
  skill_id,
  skill_weight
)
select
  ref.scenario_id,
  sk.id,
  1.0
from scenario_ref ref
join domain d on true
join public.tutoring_skills sk
  on sk.subject_domain_id = d.id
 and sk.slug in ('cash-flow-reconciliation', 'assumption-analysis')
on conflict (scenario_id, skill_id)
do update
set skill_weight = excluded.skill_weight;

with domain as (
  select id
  from public.subject_domains
  where slug = 'business-finance'
),
scenario_ref as (
  select s.id as scenario_id
  from public.tutoring_scenarios s
  join public.tutoring_topics t on t.id = s.topic_id
  join domain d on d.id = t.subject_domain_id
  where t.slug = 'cash-flow'
    and s.slug = 'seasonal-pool-service-gap'
  limit 1
)
insert into public.tutoring_scenario_questions (
  scenario_id,
  question_order,
  prompt,
  response_format,
  numeric_answer,
  numeric_tolerance,
  unit,
  explanation_prompt,
  hint,
  rubric,
  metadata
)
select
  ref.scenario_id,
  1,
  'Compute ending cash for the month.',
  'mixed',
  5950,
  20,
  'USD',
  'What policy change could reduce cash volatility next month?',
  'Ending cash = beginning cash + inflows - outflows.',
  '{"focus":["cash reconciliation","cash planning"]}'::jsonb,
  '{"seed_group":"demo_booster"}'::jsonb
from scenario_ref ref
on conflict (scenario_id, question_order)
do update
set
  prompt = excluded.prompt,
  response_format = excluded.response_format,
  numeric_answer = excluded.numeric_answer,
  numeric_tolerance = excluded.numeric_tolerance,
  unit = excluded.unit,
  explanation_prompt = excluded.explanation_prompt,
  hint = excluded.hint,
  rubric = excluded.rubric,
  metadata = excluded.metadata;
