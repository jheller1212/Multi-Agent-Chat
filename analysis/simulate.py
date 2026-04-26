"""
Simulation of three agent-to-agent procurement negotiation experiments.
Effect sizes calibrated from Zhu et al. (2025) and Vaccaro et al. (2025).

Run: python3 simulate.py
Outputs: stats_results.txt, e1_data.csv, e2_data.csv, e3_data.csv
"""

import numpy as np
import pandas as pd
import scipy.stats as stats
import statsmodels.formula.api as smf
import statsmodels.api as sm
from scipy.stats import levene, t, ttest_ind
import json

np.random.seed(42)

# ============================================================
# Calibration constants from prior literature
# ============================================================

# Zhu et al. (2025): PRR gap ~14.9% across sellers, ~2.6% across buyers
# Weak seller loses up to 14.13% profit
# Buyer overpays by 2.09% when weak

# Pricing parameters
LIST_PRICE = 100.0
WHOLESALE = 60.0
BUDGET_HIGH = 1.20 * LIST_PRICE  # 120
BUDGET_LIST = LIST_PRICE          # 100
BUDGET_MID = (LIST_PRICE + WHOLESALE) / 2  # 80
BUDGET_WHOLESALE = WHOLESALE      # 60
BUDGET_LOW = 0.80 * WHOLESALE     # 48

# Realistic effect sizes (drawn from literature)
# Symmetric strong (frontier-frontier): PRR ~ 0.10
# Asymmetric (strong buyer, weak seller): PRR ~ 0.18
# Asymmetric (weak buyer, strong seller): PRR ~ 0.04
# Symmetric weak (weaker-weaker): PRR ~ 0.07 with high variance

# ============================================================
# EXPERIMENT 1: 2 x 2 capability asymmetry, N = 600 dyads
# Each dyad run across 5 budget levels = 3000 negotiations
# ============================================================

print("=" * 70)
print("EXPERIMENT 1: Capability asymmetry")
print("=" * 70)

cells_e1 = [
    ('frontier', 'frontier'),  # symmetric strong
    ('frontier', 'weaker'),    # buyer strong (advantage to buyer)
    ('weaker', 'frontier'),    # seller strong (advantage to seller)
    ('weaker', 'weaker'),      # symmetric weak
]

budgets = [BUDGET_HIGH, BUDGET_LIST, BUDGET_MID, BUDGET_WHOLESALE, BUDGET_LOW]
budget_labels = ['high', 'list', 'mid', 'wholesale', 'low']

# Effect parameters tuned to literature
prr_means = {
    ('frontier', 'frontier'): 0.10,
    ('frontier', 'weaker'): 0.23,    # seller weak, buyer extracts ~13pp more (replicating Zhu)
    ('weaker', 'frontier'): 0.06,    # buyer weak, only 4pp less from baseline
    ('weaker', 'weaker'): 0.08,
}
prr_sds = {
    ('frontier', 'frontier'): 0.04,
    ('frontier', 'weaker'): 0.06,
    ('weaker', 'frontier'): 0.05,
    ('weaker', 'weaker'): 0.10,  # higher variance for weaker pairs
}

# Deal rates (deal vs walk-away/deadlock)
deal_rates = {
    ('frontier', 'frontier'): 0.93,
    ('frontier', 'weaker'): 0.87,
    ('weaker', 'frontier'): 0.85,
    ('weaker', 'weaker'): 0.74,
}

# Anomaly rates by cell (OBR, OWR, OPR, DLR)
anomaly_params = {
    ('frontier', 'frontier'): {'obr': 0.01, 'owr': 0.01, 'opr': 0.01, 'dlr': 0.04},
    ('frontier', 'weaker'): {'obr': 0.02, 'owr': 0.06, 'opr': 0.02, 'dlr': 0.06},
    ('weaker', 'frontier'): {'obr': 0.05, 'owr': 0.01, 'opr': 0.04, 'dlr': 0.07},
    ('weaker', 'weaker'): {'obr': 0.09, 'owr': 0.11, 'opr': 0.06, 'dlr': 0.16},
}

rows_e1 = []
for cell in cells_e1:
    buyer, seller = cell
    for dyad_id in range(150):
        for budget, blabel in zip(budgets, budget_labels):
            # Budget influences outcomes (lower budgets reduce deal rate, push prices down)
            budget_effect_prr = (BUDGET_LIST - budget) / BUDGET_LIST * 0.05
            budget_effect_deal = -(BUDGET_LIST - budget) / BUDGET_LIST * 0.15
            
            base_prr = prr_means[cell]
            prr = np.random.normal(base_prr - budget_effect_prr, prr_sds[cell])
            prr = np.clip(prr, -0.30, 0.50)
            
            base_deal = deal_rates[cell] + budget_effect_deal
            deal = np.random.binomial(1, np.clip(base_deal, 0.05, 0.99))
            
            final_price = LIST_PRICE * (1 - prr)
            
            # Buyer surplus (only meaningful if deal)
            if deal:
                walk_away = budget
                if walk_away > WHOLESALE:
                    buyer_surplus = (walk_away - final_price) / (walk_away - WHOLESALE)
                    buyer_surplus = np.clip(buyer_surplus, -0.5, 1.5)
                else:
                    buyer_surplus = np.nan
            else:
                buyer_surplus = np.nan
            
            # Anomalies
            ap = anomaly_params[cell]
            obr = np.random.binomial(1, ap['obr']) if deal else 0
            owr = np.random.binomial(1, ap['owr']) if deal else 0
            opr = np.random.binomial(1, ap['opr']) if deal else 0
            dlr = 1 if not deal and np.random.random() < ap['dlr'] / (1 - deal_rates[cell]) else 0
            
            # Conversation length
            base_turns = 8 if cell == ('frontier', 'frontier') else 12 if 'weaker' in cell else 18
            turns = max(2, int(np.random.normal(base_turns, 4)))
            if dlr:
                turns = 30
            
            rows_e1.append({
                'dyad_id': f"{cell[0][:2]}_{cell[1][:2]}_{dyad_id}",
                'buyer_model': buyer,
                'seller_model': seller,
                'budget_level': blabel,
                'budget': budget,
                'deal': deal,
                'final_price': final_price if deal else np.nan,
                'prr': prr if deal else np.nan,
                'buyer_surplus': buyer_surplus,
                'turns': turns,
                'obr': obr,
                'owr': owr,
                'opr': opr,
                'dlr': dlr,
            })

df_e1 = pd.DataFrame(rows_e1)
df_e1.to_csv('/home/claude/paper/e1_data.csv', index=False)

# Statistical tests
results = {}

# Test H1: Buyer surplus difference (frontier-weaker) vs (weaker-frontier)
fw = df_e1[(df_e1.buyer_model == 'frontier') & (df_e1.seller_model == 'weaker') & df_e1.deal == 1]['buyer_surplus'].dropna()
wf = df_e1[(df_e1.buyer_model == 'weaker') & (df_e1.seller_model == 'frontier') & df_e1.deal == 1]['buyer_surplus'].dropna()

t_stat, p_val = ttest_ind(fw, wf, alternative='greater')
pooled_sd = np.sqrt((fw.var() + wf.var()) / 2)
cohens_d = (fw.mean() - wf.mean()) / pooled_sd

print(f"\nH1 test (one-sided t-test, frontier-weaker > weaker-frontier on buyer surplus):")
print(f"  N(fw) = {len(fw)}, M = {fw.mean():.3f}, SD = {fw.std():.3f}")
print(f"  N(wf) = {len(wf)}, M = {wf.mean():.3f}, SD = {wf.std():.3f}")
print(f"  t({len(fw)+len(wf)-2}) = {t_stat:.2f}, p = {p_val:.2e}, Cohen's d = {cohens_d:.2f}")

results['h1'] = {
    'fw_mean': float(fw.mean()), 'fw_sd': float(fw.std()), 'fw_n': int(len(fw)),
    'wf_mean': float(wf.mean()), 'wf_sd': float(wf.std()), 'wf_n': int(len(wf)),
    't': float(t_stat), 'p': float(p_val), 'd': float(cohens_d),
    'df': int(len(fw)+len(wf)-2)
}

# Test H2: Variance ratio of PRR across sellers (buyer fixed at frontier) vs across buyers (seller fixed at frontier)
# "Vary seller, buyer fixed at frontier" = (frontier-frontier) and (frontier-weaker)
seller_var_set = df_e1[df_e1.buyer_model == 'frontier'].dropna(subset=['prr'])['prr']
# "Vary buyer, seller fixed at frontier" = (frontier-frontier) and (weaker-frontier)
buyer_var_set = df_e1[df_e1.seller_model == 'frontier'].dropna(subset=['prr'])['prr']

# Compute the actual gaps
seller_gap = abs(df_e1[(df_e1.buyer_model == 'frontier') & (df_e1.seller_model == 'frontier')].prr.mean() - 
                 df_e1[(df_e1.buyer_model == 'frontier') & (df_e1.seller_model == 'weaker')].prr.mean())
buyer_gap = abs(df_e1[(df_e1.buyer_model == 'frontier') & (df_e1.seller_model == 'frontier')].prr.mean() - 
                df_e1[(df_e1.buyer_model == 'weaker') & (df_e1.seller_model == 'frontier')].prr.mean())

ratio = seller_gap / buyer_gap

# Bootstrap confidence interval on the ratio
boot_ratios = []
for _ in range(10000):
    boot_ff = df_e1[(df_e1.buyer_model == 'frontier') & (df_e1.seller_model == 'frontier')].sample(frac=1, replace=True).prr.mean()
    boot_fw = df_e1[(df_e1.buyer_model == 'frontier') & (df_e1.seller_model == 'weaker')].sample(frac=1, replace=True).prr.mean()
    boot_wf = df_e1[(df_e1.buyer_model == 'weaker') & (df_e1.seller_model == 'frontier')].sample(frac=1, replace=True).prr.mean()
    boot_seller_gap = abs(boot_ff - boot_fw)
    boot_buyer_gap = abs(boot_ff - boot_wf)
    if boot_buyer_gap > 0:
        boot_ratios.append(boot_seller_gap / boot_buyer_gap)
boot_ratios = np.array(boot_ratios)
ci_lower, ci_upper = np.percentile(boot_ratios, [2.5, 97.5])

# Levene's test on the variance equivalent
lev_stat, lev_p = levene(seller_var_set, buyer_var_set)

print(f"\nH2 test (directional asymmetry):")
print(f"  Seller PRR gap (frontier-frontier vs frontier-weaker): {seller_gap*100:.2f} percentage points")
print(f"  Buyer PRR gap (frontier-frontier vs weaker-frontier): {buyer_gap*100:.2f} percentage points")
print(f"  Ratio: {ratio:.2f} [95% bootstrap CI: {ci_lower:.2f}, {ci_upper:.2f}]")
print(f"  Pre-registered prediction: ratio >= 3.0. {'SUPPORTED' if ci_lower >= 3.0 else 'NOT SUPPORTED at 95% CI lower bound'}")

results['h2'] = {
    'seller_gap_pct': float(seller_gap*100),
    'buyer_gap_pct': float(buyer_gap*100),
    'ratio': float(ratio),
    'ci_lower': float(ci_lower),
    'ci_upper': float(ci_upper),
    'lev_stat': float(lev_stat),
    'lev_p': float(lev_p),
}

# Deal rates by cell
print(f"\nDeal rates by cell:")
deal_summary = df_e1.groupby(['buyer_model', 'seller_model']).agg(
    deal_rate=('deal', 'mean'),
    n=('deal', 'count'),
    mean_prr=('prr', 'mean'),
    mean_surplus=('buyer_surplus', 'mean'),
    mean_turns=('turns', 'mean'),
).round(3)
print(deal_summary)

# Anomaly summary
print(f"\nAnomaly rates by cell (% of deals or, for DLR, % of all dyads):")
for cell in cells_e1:
    sub = df_e1[(df_e1.buyer_model == cell[0]) & (df_e1.seller_model == cell[1])]
    sub_deals = sub[sub.deal == 1]
    n_deals = len(sub_deals)
    n_total = len(sub)
    obr_rate = sub_deals.obr.sum() / n_deals * 100 if n_deals > 0 else 0
    owr_rate = sub_deals.owr.sum() / n_deals * 100 if n_deals > 0 else 0
    opr_rate = sub_deals.opr.sum() / n_deals * 100 if n_deals > 0 else 0
    dlr_rate = sub.dlr.sum() / n_total * 100
    print(f"  {cell}: OBR={obr_rate:.1f}%, OWR={owr_rate:.1f}%, OPR={opr_rate:.1f}%, DLR={dlr_rate:.1f}%")
    results.setdefault('anomalies_e1', {})[f"{cell[0]}_{cell[1]}"] = {
        'obr': float(obr_rate), 'owr': float(owr_rate), 'opr': float(opr_rate), 'dlr': float(dlr_rate)
    }

# Linear mixed model on buyer surplus
df_e1_deals = df_e1.dropna(subset=['buyer_surplus'])
df_e1_deals['buyer_strong'] = (df_e1_deals.buyer_model == 'frontier').astype(int)
df_e1_deals['seller_strong'] = (df_e1_deals.seller_model == 'frontier').astype(int)

mod = smf.ols("buyer_surplus ~ buyer_strong + seller_strong + buyer_strong:seller_strong + C(budget_level)", data=df_e1_deals)
fit = mod.fit(cov_type='cluster', cov_kwds={'groups': df_e1_deals['dyad_id'].str[:6]})
print(f"\nOLS regression on buyer_surplus (cluster-robust SE):")
print(fit.summary().tables[1])

results['e1_ols_summary'] = {
    'buyer_strong_coef': float(fit.params['buyer_strong']),
    'buyer_strong_p': float(fit.pvalues['buyer_strong']),
    'seller_strong_coef': float(fit.params['seller_strong']),
    'seller_strong_p': float(fit.pvalues['seller_strong']),
    'r_squared': float(fit.rsquared),
}

# ============================================================
# EXPERIMENT 2: 2 x 2 x 2 (capability x buyer warmth x seller warmth)
# N = 640 dyads (80 per cell)
# ============================================================

print("\n" + "=" * 70)
print("EXPERIMENT 2: Mandate warmth under capability asymmetry")
print("=" * 70)

# Three factors: capability_asymmetric (0/1), buyer_warmth (0/1), seller_warmth (0/1)
# In symmetric: both frontier
# In asymmetric: buyer frontier, seller weaker (deliberate, since H2 says seller-side matters)

cells_e2 = []
for cap in [0, 1]:  # 0=symmetric, 1=asymmetric
    for bw in [0, 1]:
        for sw in [0, 1]:
            cells_e2.append((cap, bw, sw))

# Effect sizes: warmth increases deal rate (Vaccaro), interactive effects
# Joint value range 0-100
# Deal rate baseline 0.85, warmth bumps it up
# Buyer share: capability dominates, warmth modulates

rows_e2 = []
for cap, bw, sw in cells_e2:
    for dyad_id in range(80):
        # Deal rate
        deal_p = 0.78
        if bw == 1: deal_p += 0.07
        if sw == 1: deal_p += 0.07
        if bw == 1 and sw == 1: deal_p += 0.04  # mutual warmth bonus
        if cap == 1: deal_p -= 0.02  # asymmetric slightly fewer deals
        deal = np.random.binomial(1, np.clip(deal_p, 0.05, 0.99))
        
        # Joint value (0-100): warmth increases joint value strongly
        if deal:
            jv_base = 55
            if bw == 1: jv_base += 6
            if sw == 1: jv_base += 6
            if bw == 1 and sw == 1: jv_base += 5  # super-additive
            if cap == 1: jv_base -= 3
            joint_value = np.random.normal(jv_base, 9)
            joint_value = np.clip(joint_value, 0, 100)
        else:
            joint_value = np.nan
        
        # Buyer share of bargaining zone (0-1)
        if deal:
            bs_base = 0.50
            if cap == 1: bs_base += 0.10  # asymmetric (buyer strong) -> buyer captures more
            if bw == 1: bs_base += 0.02   # buyer warmth helps buyer slightly via deal-getting
            if sw == 1: bs_base -= 0.02   # seller warmth helps seller
            buyer_share = np.random.normal(bs_base, 0.12)
            buyer_share = np.clip(buyer_share, 0, 1)
        else:
            buyer_share = np.nan
        
        # SVI subjective value (1-7), warmth strongly affects this
        if deal:
            svi_buyer_base = 4.2
            if bw == 1: svi_buyer_base += 0.4
            if sw == 1: svi_buyer_base += 0.5
            svi_buyer = np.clip(np.random.normal(svi_buyer_base, 0.7), 1, 7)
            
            svi_seller_base = 4.2
            if sw == 1: svi_seller_base += 0.4
            if bw == 1: svi_seller_base += 0.5
            svi_seller = np.clip(np.random.normal(svi_seller_base, 0.7), 1, 7)
        else:
            svi_buyer = np.nan
            svi_seller = np.nan
        
        # Question rate (warmth -> more questions, Vaccaro)
        qr_base = 0.15
        if bw == 1: qr_base += 0.08
        if sw == 1: qr_base += 0.06
        question_rate = max(0, np.random.normal(qr_base, 0.06))
        
        # Conversation turns
        turns_base = 12
        if cap == 1: turns_base += 2
        if bw == 1 and sw == 1: turns_base -= 2  # mutual warmth = faster
        turns = max(2, int(np.random.normal(turns_base, 4)))
        if not deal:
            turns = min(30, turns + np.random.randint(2, 8))
        
        rows_e2.append({
            'dyad_id': f"e2_{cap}_{bw}_{sw}_{dyad_id}",
            'capability_asymmetric': cap,
            'buyer_warmth': bw,
            'seller_warmth': sw,
            'deal': deal,
            'joint_value': joint_value,
            'buyer_share': buyer_share,
            'svi_buyer': svi_buyer,
            'svi_seller': svi_seller,
            'question_rate': question_rate,
            'turns': turns,
        })

df_e2 = pd.DataFrame(rows_e2)
df_e2.to_csv('/home/claude/paper/e2_data.csv', index=False)

# Test main effects of warmth
# Logistic regression on deal rate
mod_deal = smf.logit("deal ~ capability_asymmetric + buyer_warmth + seller_warmth + buyer_warmth:seller_warmth", data=df_e2).fit(disp=0)
print(f"\nLogistic regression on deal:")
print(mod_deal.summary().tables[1])

# OLS on joint value (deals only)
df_e2_deals = df_e2.dropna(subset=['joint_value'])
mod_jv = smf.ols("joint_value ~ capability_asymmetric + buyer_warmth + seller_warmth + buyer_warmth:seller_warmth + buyer_warmth:capability_asymmetric + seller_warmth:capability_asymmetric", data=df_e2_deals).fit(cov_type='HC3')
print(f"\nOLS on joint value:")
print(mod_jv.summary().tables[1])

# OLS on buyer share
mod_bs = smf.ols("buyer_share ~ capability_asymmetric + buyer_warmth + seller_warmth", data=df_e2_deals).fit(cov_type='HC3')
print(f"\nOLS on buyer share:")
print(mod_bs.summary().tables[1])

results['e2_deal_rate'] = {
    'cap_coef': float(mod_deal.params['capability_asymmetric']),
    'cap_p': float(mod_deal.pvalues['capability_asymmetric']),
    'buyer_warmth_coef': float(mod_deal.params['buyer_warmth']),
    'buyer_warmth_p': float(mod_deal.pvalues['buyer_warmth']),
    'seller_warmth_coef': float(mod_deal.params['seller_warmth']),
    'seller_warmth_p': float(mod_deal.pvalues['seller_warmth']),
    'interaction_coef': float(mod_deal.params['buyer_warmth:seller_warmth']),
    'interaction_p': float(mod_deal.pvalues['buyer_warmth:seller_warmth']),
}

results['e2_joint_value'] = {
    'buyer_warmth_coef': float(mod_jv.params['buyer_warmth']),
    'buyer_warmth_p': float(mod_jv.pvalues['buyer_warmth']),
    'seller_warmth_coef': float(mod_jv.params['seller_warmth']),
    'seller_warmth_p': float(mod_jv.pvalues['seller_warmth']),
    'three_way_coef': float(mod_jv.params['buyer_warmth:seller_warmth']),
    'three_way_p': float(mod_jv.pvalues['buyer_warmth:seller_warmth']),
    'r_squared': float(mod_jv.rsquared),
}

# Cell means for E2
e2_summary = df_e2.groupby(['capability_asymmetric', 'buyer_warmth', 'seller_warmth']).agg(
    deal_rate=('deal', 'mean'),
    mean_jv=('joint_value', 'mean'),
    mean_bs=('buyer_share', 'mean'),
    mean_svi_b=('svi_buyer', 'mean'),
    mean_svi_s=('svi_seller', 'mean'),
    n=('deal', 'count'),
).round(3)
print(f"\nE2 cell means:")
print(e2_summary)

results['e2_cells'] = e2_summary.reset_index().to_dict('records')

# ============================================================
# EXPERIMENT 3: 2 x 4 (capability x Kraljic), N = 400 dyads
# ============================================================

print("\n" + "=" * 70)
print("EXPERIMENT 3: Item criticality as boundary condition")
print("=" * 70)

cells_e3 = []
for cap in [0, 1]:
    for kraljic in ['non_critical', 'leverage', 'bottleneck', 'strategic']:
        cells_e3.append((cap, kraljic))

rows_e3 = []
for cap, kraljic in cells_e3:
    for dyad_id in range(50):
        # Buyer share - asymmetry effect amplified for high-criticality items
        bs_base = 0.50
        if cap == 1:  # asymmetric, buyer strong
            if kraljic == 'non_critical':
                bs_base += 0.07
            elif kraljic == 'leverage':
                bs_base += 0.09
            elif kraljic == 'bottleneck':
                bs_base += 0.13
            elif kraljic == 'strategic':
                bs_base += 0.16
        buyer_share = np.clip(np.random.normal(bs_base, 0.13), 0, 1)
        
        # Deal rate - strategic items have higher walk-aways from weaker side
        deal_p = 0.85
        if cap == 1 and kraljic == 'strategic': deal_p -= 0.10  # weak seller walks away on strategic
        if cap == 1 and kraljic == 'bottleneck': deal_p -= 0.05
        deal = np.random.binomial(1, np.clip(deal_p, 0.05, 0.99))
        
        # PRR
        prr_base = 0.10
        if cap == 1:
            if kraljic in ['bottleneck', 'strategic']:
                prr_base += 0.08
            else:
                prr_base += 0.05
        prr = np.random.normal(prr_base, 0.06)
        prr = np.clip(prr, -0.30, 0.50)
        
        rows_e3.append({
            'dyad_id': f"e3_{cap}_{kraljic[:3]}_{dyad_id}",
            'capability_asymmetric': cap,
            'kraljic': kraljic,
            'high_criticality': 1 if kraljic in ['bottleneck', 'strategic'] else 0,
            'deal': deal,
            'buyer_share': buyer_share if deal else np.nan,
            'prr': prr if deal else np.nan,
        })

df_e3 = pd.DataFrame(rows_e3)
df_e3.to_csv('/home/claude/paper/e3_data.csv', index=False)

# Planned contrast: high-criticality vs low-criticality, in asymmetric cells only
df_e3_deals = df_e3.dropna(subset=['buyer_share'])
df_e3_asym = df_e3_deals[df_e3_deals.capability_asymmetric == 1]
high_crit = df_e3_asym[df_e3_asym.high_criticality == 1]['buyer_share']
low_crit = df_e3_asym[df_e3_asym.high_criticality == 0]['buyer_share']

t_stat, p_val = ttest_ind(high_crit, low_crit, alternative='greater')
pooled_sd = np.sqrt((high_crit.var() + low_crit.var()) / 2)
cohens_d = (high_crit.mean() - low_crit.mean()) / pooled_sd

print(f"\nE3 planned contrast (high vs low criticality in asymmetric dyads, on buyer share):")
print(f"  N(high crit) = {len(high_crit)}, M = {high_crit.mean():.3f}, SD = {high_crit.std():.3f}")
print(f"  N(low crit) = {len(low_crit)}, M = {low_crit.mean():.3f}, SD = {low_crit.std():.3f}")
print(f"  t = {t_stat:.2f}, p = {p_val:.2e}, Cohen's d = {cohens_d:.2f}")

# Capability x Kraljic interaction
mod_e3 = smf.ols("buyer_share ~ capability_asymmetric + high_criticality + capability_asymmetric:high_criticality", data=df_e3_deals).fit(cov_type='HC3')
print(f"\nE3 OLS interaction model:")
print(mod_e3.summary().tables[1])

results['e3_contrast'] = {
    'high_mean': float(high_crit.mean()),
    'high_sd': float(high_crit.std()),
    'high_n': int(len(high_crit)),
    'low_mean': float(low_crit.mean()),
    'low_sd': float(low_crit.std()),
    'low_n': int(len(low_crit)),
    't': float(t_stat),
    'p': float(p_val),
    'd': float(cohens_d),
}

results['e3_interaction'] = {
    'cap_coef': float(mod_e3.params['capability_asymmetric']),
    'cap_p': float(mod_e3.pvalues['capability_asymmetric']),
    'crit_coef': float(mod_e3.params['high_criticality']),
    'crit_p': float(mod_e3.pvalues['high_criticality']),
    'interaction_coef': float(mod_e3.params['capability_asymmetric:high_criticality']),
    'interaction_p': float(mod_e3.pvalues['capability_asymmetric:high_criticality']),
}

# Walk-away rate by criticality in asymmetric cells
walk_away_strategic_asym = df_e3[(df_e3.capability_asymmetric == 1) & (df_e3.kraljic == 'strategic')]['deal'].apply(lambda x: 1 - x).mean()
walk_away_noncritical_asym = df_e3[(df_e3.capability_asymmetric == 1) & (df_e3.kraljic == 'non_critical')]['deal'].apply(lambda x: 1 - x).mean()
print(f"\nWalk-away rates in asymmetric dyads:")
print(f"  Strategic items: {walk_away_strategic_asym*100:.1f}%")
print(f"  Non-critical items: {walk_away_noncritical_asym*100:.1f}%")

results['e3_walkaway'] = {
    'strategic_asym': float(walk_away_strategic_asym),
    'noncritical_asym': float(walk_away_noncritical_asym),
}

# Save all results
with open('/home/claude/paper/stats_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\n" + "=" * 70)
print("All simulations complete. Data and stats saved.")
print("=" * 70)
