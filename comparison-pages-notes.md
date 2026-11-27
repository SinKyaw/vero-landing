# Comparison pages: open questions and follow-ups

Written 24 Nov 2026, after rewriting `/vs/cleo`, `/vs/emma` and `/vs/ynab` against the feature docs
(`vero+/vero-mobile/docs/features`, reconciled 2026-11-24) and adding the `/compare` hub.

## 1. Confirm before deploying (the docs can't answer these)

The docs mark these as "❓ verify in production". The new copy assumes the answer is **yes**. If any is **no**, the listed lines must change.

| Question | If the answer is no, change… |
|---|---|
| Is **`budgetManagement`** on for everyone? (plans, pockets, goals, accounts, safe to spend) | **Cleo:** table row "Budgeting". **Emma:** "How Vero works" bullets *Plan it your way* and *Add your accounts by hand*; table rows "Budgets on the free plan" and "All your accounts in one place"; the pricing note; FAQ "anything Emma does…" and "Can Vero see my bank balance?" (2nd sentence). **YNAB:** most of the page: the last paragraph of "A method vs a habit", the right side of the illustration, the first two "How Vero works" bullets, table row "Budgeting method", the Vero row of the alternatives table, "Moving from YNAB", and FAQs 4–5 |
| Is **`journeyEnabled`** on for everyone, and is the store build above `minAppVersion`? | Every "discounts on gift cards from Verdi’s trips" line: the *Keep it going* bullet (all 3 pages), Cleo table "Rewards" row, Cleo FAQ "How much do they cost?", Emma pricing note. If the old Rewards Shop is still what users see, the reward is free gift cards for tokens (Free 1 / Plus 2 per 31 days), not discounts |
| Is Vero Plus **£4.99 a month, monthly only**? | The docs don't state a price. It's in every table, FAQ and the Emma "Yearly pricing" row. Also confirm there's no annual plan or intro offer live in Superwall |
| Is the **free cap on Shortcut and notification logs** live, and what is it? | Copy says "a limited number" / "Limited on Free". If there's no cap yet, drop those words (Cleo FAQ 4, YNAB table row "Quick logging") |
| Do the **current store builds** include Android notification logging (shipped 12 Nov) and the iOS Shortcut? | The *Log without opening the app* bullet and every "Siri / bank notifications" mention |

Deliberately left out until confirmed: **Savings Challenges** (backend migrations ⚠️), the **iOS 27 bank-alert automation**, **Money Summary** and **Insights** (flagged), and **league speech bubbles** (flagged).

If **Verdi chat** gets an entry point again, update the Cleo page. It now says Vero has no AI chat "at the moment" (table row, "What Cleo does well", FAQ 1).

### The four new pages (added 24 Nov 2026)

`/vs/goodbudget`, `/vs/snoop`, `/vs/fortune-city` and `/how-to-budget-with-monzo-pots` depend on the same answers:

- **`budgetManagement`:** the pockets bullet and Moving section on Goodbudget, the "Bills you add" row on Snoop, and "Mirror your Pots" on Monzo.
- **`journeyEnabled`:** the whole angle of the Fortune City page ("rewards that leave the app"), and on Snoop the line "Vero earns … from gift cards bought through Verdi’s trips". If Journey isn't public, the Fortune City page needs a rethink, not just an edit.
- **Fortune City search demand is unverified.** It's a global app, so check UK volume for "Fortune City alternative" in a keyword tool before promoting it.
- **No cover images yet.** The pages use the default social image, and hub cards show a Vero illustration (`.g-card__media--art`). Add `assets/covers/vs-goodbudget.*`, `vs-snoop.*`, `vs-fortune-city.*` and `how-to-budget-with-monzo-pots.*` when ready, then switch the cards and `og:image`.
- **Monzo facts not stated on Monzo’s pages, so left out:** Trends and spending targets, whether Bills Pot and locking are free, and savings rates (the page contradicted itself).

## 2. Screenshots needed (item 6: show the real product)

The App Store screenshots on disk (`Deployment/App Store/…`, March 2026) show retired screens (old leaderboard, old monthly plan, Rewards Shop), so I didn't use them. The pages use design-system illustrations drawn from the real flows instead. Fresh screenshots of these would replace them:

1. Record sheet with a typed sentence → the **Transaction Logged!** confirmation with two rows
2. **Reflect Your Money** sheet (Why / How it feels / Again?)
3. A **plan detail** in Categories view (Left to spend, caps with usage). Used on the YNAB page
4. Home **streak card**, and the **Leagues** board
5. **Journey** trunk or "Verdi has saved you £X" (only once Journey is public)

## 3. The same inaccuracies elsewhere on the site (not changed yet)

The same inaccuracies appear on other pages. I only fixed the comparison pages, the guides-hub cards and `llms.txt` entries for them.

| Claim | Docs say | Where |
|---|---|---|
| "Automated logging (on Vero Plus) reads your payment notifications" | Android only, from banking apps you choose. Free has an allowance and Plus is unlimited. iPhone uses Siri / Action button / Shortcuts | `index.html:119, 676, 780` · `best-budgeting-apps-without-open-banking.html:147, 376, 435, 683` |
| Log "by chat" / "texting Verdi" | You type or say one sentence. There's no chat (Verdi Listen has had no entry point since 12 Nov) | `best-budgeting-apps-without-open-banking.html:147, 298, 434, 629, 683` · `is-open-banking-safe.html:331` |
| "Weekly leagues with friends" / "compete with friends" | Weekly rooms with people at your level (Silver → Golden → Diamond). Friend leagues are only an idea | `index.html:542, 547` |
| "A daily safe-to-spend number" / "safe to spend every day" / "£58.20 safe to spend this week" | Safe to spend = money with no job yet, minus bills still due. It's not a daily or weekly allowance, and plans aren't built around payday automatically | `index.html:482–488, 1049, 1137` · `best-budgeting-apps-without-open-banking.html:437` · `how-to-budget-on-your-first-salary.html:328` |
| Tag each spend "need, want or impulse" | Four options (adds **Pressure**), in the daily reflection or on any transaction, not asked after every log | `index.html:379, 519, 1045` · `best-budgeting-apps-without-open-banking.html:446` |
| Plus = "automated logging, deeper insights and more challenges" | Insights and challenges are the same on both. Plus = unlimited voice and quick logging, better Journey discounts, a 10-card vault (and more Verdi chat, currently unreachable) | `plans.html` (meta, line 170) · `llms.txt:12` |
| Tokens for "staying on your plan" | The weekly budget challenge was retired on 7 Nov. Only *Check Your Budget* (opening the plan) remains | `gamified-budgeting-apps.html:127, 313` |
