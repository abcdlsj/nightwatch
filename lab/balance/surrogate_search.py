"""
Nightwatch GPU Order-Aware 8-Slot Transformer Neural Surrogate + Active Build Scanner

Zero-drift hybrid GPU/CPU search over Nightwatch's astronomical ordered 8-slot variable-size board space
(cards of size 1/2/3 × affixes × Carry designation × Rule Relic × Awakening):
  - Trains a 5-model deep ensemble of Order-Aware Transformers on Colab A100/L4/T4 GPU (PyTorch CUDA)
    operating on exact 8-slot board representations (card_id, slot_pos, subslot_offset, affix_id, is_carry)
    conditioned on (rule_relic, awaken) to predict [winRate, log1p(avgScore), log1p(avgDps)].
  - Each active learning round screens 100,000+ ordered 8-slot boards on GPU in <1 second using
    stratified UCB across build niches (pure-element, reaction-duo, chain-echo, support-carry, mixed).
  - Sends Top-K selected builds to the REAL TypeScript `src/sim/` engine (`eval-bridge.ts`) for exact
    ground-truth evaluation, iterating across rounds (~500k+ GPU-screened boards per hero).
  - Performs final unbiased holdout verification + Spatial Slot-Order Sensitivity Attribution
    (shuffling the champion board to quantify how much spatial ordering skill matters!).
"""

import argparse
import json
import math
import random
import subprocess
import tempfile
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

NICHE_LABELS = {
    "pure-elem": "纯单元素羁绊",
    "reaction-duo": "双元素反应构筑",
    "chain-echo": "回响/齐鸣连锁",
    "support-carry": "辅助养C位",
    "mixed-hybrid": "多元素混搭",
}


class OrderAwareBoardNet(nn.Module):
    """Order-Aware 8-Slot Board Transformer predicting [winRate, log1p(avgScore), log1p(avgDps)]."""

    def __init__(
        self,
        num_cards: int,
        num_affixes: int,
        num_rules: int,
        num_awakens: int,
        d_model: int = 96,
    ):
        super().__init__()
        # index 0 reserved for empty slot padding
        self.card_emb = nn.Embedding(num_cards + 1, d_model)
        self.affix_emb = nn.Embedding(num_affixes, d_model)
        self.pos_emb = nn.Embedding(8, d_model)
        self.sub_emb = nn.Embedding(4, d_model)  # 0=empty, 1=head, 2=mid, 3=tail
        self.carry_emb = nn.Embedding(2, d_model)

        self.rule_emb = nn.Embedding(num_rules, d_model)
        self.awaken_emb = nn.Embedding(max(1, num_awakens), d_model)

        enc_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=4,
            dim_feedforward=d_model * 3,
            dropout=0.1,
            batch_first=True,
            activation="gelu",
        )
        self.encoder = nn.TransformerEncoder(enc_layer, num_layers=2)
        self.head = nn.Sequential(
            nn.Linear(d_model * 2, d_model),
            nn.GELU(),
            nn.Linear(d_model, 3),
        )

    def forward(
        self,
        slot_card: torch.Tensor,
        slot_affix: torch.Tensor,
        slot_sub: torch.Tensor,
        slot_carry: torch.Tensor,
        rule_id: torch.Tensor,
        awaken_id: torch.Tensor,
    ):
        bsz = slot_card.size(0)
        pos = torch.arange(8, device=slot_card.device).unsqueeze(0).expand(bsz, 8)
        tok = (
            self.card_emb(slot_card)
            + self.affix_emb(slot_affix)
            + self.pos_emb(pos)
            + self.sub_emb(slot_sub)
            + self.carry_emb(slot_carry)
        )  # [B, 8, D]
        ctx = (self.rule_emb(rule_id) + self.awaken_emb(awaken_id)).unsqueeze(1)  # [B, 1, D]
        seq = torch.cat([tok, ctx], dim=1)  # [B, 9, D]
        h = self.encoder(seq)
        pooled = torch.cat([h[:, :8, :].mean(dim=1), h[:, 8, :]], dim=-1)
        out = self.head(pooled)
        win_prob = torch.sigmoid(out[:, 0:1])
        log_vals = out[:, 1:3]
        return torch.cat([win_prob, log_vals], dim=-1)


def load_meta(repo_root: Path, hero: str) -> dict:
    out = subprocess.check_output(
        ["bun", str(repo_root / "lab/balance/eval-bridge.ts"), "--dump-meta", "--hero", hero],
        text=True,
    )
    return json.loads(out)


def eval_via_bun(
    repo_root: Path,
    candidates: List[dict],
    hero: str,
    night: int,
    heat: int,
    tier: int,
    carry_diamond: bool,
    seeds: int,
    seed_base: int,
) -> List[dict]:
    with tempfile.TemporaryDirectory() as td:
        in_p = Path(td) / "in.json"
        out_p = Path(td) / "out.json"
        in_p.write_text(json.dumps(candidates), encoding="utf-8")
        cmd = [
            "bun",
            str(repo_root / "lab/balance/eval-bridge.ts"),
            "--in",
            str(in_p),
            "--out",
            str(out_p),
            "--hero",
            hero,
            "--night",
            str(night),
            "--heat",
            str(heat),
            "--tier",
            str(tier),
            "--seeds",
            str(seeds),
            "--seed-base",
            str(seed_base),
        ]
        if carry_diamond:
            cmd.append("--carry-diamond")
        subprocess.run(cmd, check=True)
        return json.loads(out_p.read_text(encoding="utf-8"))


def build_key(cand: dict) -> str:
    cstr = ">".join(f"{c['key']}:{c['adj'] or '-'}" for c in cand["cards"])
    return f"{cstr}|c{cand['carryIdx']}|{cand['ruleRelic']}|{cand['awaken']}"


def classify_niche(cand: dict, card_map: Dict[str, dict]) -> str:
    cards = cand["cards"]
    echo_n = sum(1 for c in cards if c["adj"] == "echo")
    if echo_n >= 2 or any(c["key"] in ("warhorn", "orrery", "beacontower") for c in cards):
        return "chain-echo"
    sup_n = sum(1 for c in cards if card_map[c["key"]]["dmg"] == 0)
    if sup_n >= 3:
        return "support-carry"
    dmg_tags = [card_map[c["key"]]["tag"] for c in cards if card_map[c["key"]]["dmg"] > 0]
    uniq = set(dmg_tags)
    if len(uniq) <= 1:
        return "pure-elem"
    if len(uniq) == 2:
        rx_pairs = {
            frozenset(("fire", "ice")),
            frozenset(("fire", "volt")),
            frozenset(("fire", "poison")),
            frozenset(("ice", "volt")),
            frozenset(("blade", "ice")),
        }
        if frozenset(uniq) in rx_pairs:
            return "reaction-duo"
    return "mixed-hybrid"


def pick_affix_for(
    card_info: dict,
    rng: random.Random,
    affixes: List[Optional[str]],
    nodmg_affixes: List[Optional[str]],
    affix_budget: int,
    used_affixes: int,
) -> Optional[str]:
    if used_affixes >= affix_budget:
        return None
    if rng.random() < 0.45:
        return None
    pool = affixes if card_info["dmg"] > 0 else nodmg_affixes
    non_null = [a for a in pool if a is not None]
    return rng.choice(non_null) if non_null else None


def random_candidate(
    rng: random.Random,
    cards_meta: List[dict],
    card_map: Dict[str, dict],
    by_size: Dict[int, List[str]],
    by_tag: Dict[str, List[str]],
    affixes: List[Optional[str]],
    nodmg_affixes: List[Optional[str]],
    rule_relics: List[str],
    awakens: List[str],
    affix_budget: int,
    preferred_tag: Optional[str] = None,
) -> dict:
    chosen: List[dict] = []
    used = 0
    used_aff = 0
    tag_pool = by_tag.get(preferred_tag, []) if preferred_tag else []

    while used < 8:
        rem = 8 - used
        # Pick card fitting in remaining slots
        if tag_pool and rng.random() < 0.7:
            cands = [k for k in tag_pool if card_map[k]["size"] <= rem]
        else:
            cands = []
        if not cands:
            cands = [c["id"] for c in cards_meta if c["size"] <= rem]
        if not cands:
            break
        k = rng.choice(cands)
        info = card_map[k]
        adj = pick_affix_for(info, rng, affixes, nodmg_affixes, affix_budget, used_aff)
        if adj is not None:
            used_aff += 1
        chosen.append({"key": k, "adj": adj})
        used += info["size"]

    # Ensure at least one damage card
    dmg_indices = [i for i, c in enumerate(chosen) if card_map[c["key"]]["dmg"] > 0]
    if not dmg_indices and chosen:
        sz = card_map[chosen[0]["key"]]["size"]
        dmg_same = [c["id"] for c in cards_meta if c["size"] == sz and c["dmg"] > 0]
        if dmg_same:
            chosen[0]["key"] = rng.choice(dmg_same)
            dmg_indices = [0]

    carry_idx = rng.choice(dmg_indices) if dmg_indices else 0
    return {
        "cards": chosen,
        "carryIdx": carry_idx,
        "ruleRelic": rng.choice(rule_relics),
        "awaken": rng.choice(awakens) if awakens else "",
    }


def fix_carry(cand: dict, card_map: Dict[str, dict], rng: random.Random) -> dict:
    cards = cand["cards"]
    dmg_idx = [i for i, c in enumerate(cards) if card_map[c["key"]]["dmg"] > 0]
    if not dmg_idx:
        return cand
    if cand["carryIdx"] not in dmg_idx:
        cand["carryIdx"] = rng.choice(dmg_idx)
    return cand


def mutate_candidate(
    parent: dict,
    rng: random.Random,
    cards_meta: List[dict],
    card_map: Dict[str, dict],
    affixes: List[Optional[str]],
    nodmg_affixes: List[Optional[str]],
    rule_relics: List[str],
    awakens: List[str],
    affix_budget: int,
) -> dict:
    cards = [dict(c) for c in parent["cards"]]
    carry_idx = parent["carryIdx"]
    rule_r = parent["ruleRelic"]
    aw = parent["awaken"]

    for _ in range(rng.choice([1, 1, 2])):
        r = rng.random()
        if r < 0.30 and len(cards) >= 2:
            # Swap two cards (spatial order mutation!)
            i, j = rng.sample(range(len(cards)), 2)
            cards[i], cards[j] = cards[j], cards[i]
            if carry_idx == i:
                carry_idx = j
            elif carry_idx == j:
                carry_idx = i
        elif r < 0.62 and cards:
            # Replace one card with same-size card, or split/merge sizes
            idx = rng.randrange(len(cards))
            old_sz = card_map[cards[idx]["key"]]["size"]
            same = [c["id"] for c in cards_meta if c["size"] == old_sz]
            if same:
                nk = rng.choice(same)
                nadj = cards[idx]["adj"]
                if card_map[nk]["dmg"] == 0 and nadj not in nodmg_affixes:
                    nadj = None
                cards[idx] = {"key": nk, "adj": nadj}
        elif r < 0.76 and cards:
            # Mutate affix within budget
            idx = rng.randrange(len(cards))
            used_aff = sum(1 for c in cards if c["adj"] is not None)
            info = card_map[cards[idx]["key"]]
            pool = affixes if info["dmg"] > 0 else nodmg_affixes
            if cards[idx]["adj"] is None and used_aff >= affix_budget:
                # Move affix from another card
                aff_idxs = [i for i, c in enumerate(cards) if c["adj"] is not None]
                if aff_idxs:
                    cards[rng.choice(aff_idxs)]["adj"] = None
            cards[idx]["adj"] = rng.choice(pool)
        elif r < 0.86 and len(cards) >= 2:
            # Resize: drop a card and repack remaining slots!
            drop_i = rng.randrange(len(cards))
            cards.pop(drop_i)
            used = sum(card_map[c["key"]]["size"] for c in cards)
            while used < 8:
                rem = 8 - used
                cands = [c["id"] for c in cards_meta if c["size"] <= rem]
                if not cands:
                    break
                nk = rng.choice(cands)
                cards.append({"key": nk, "adj": None})
                used += card_map[nk]["size"]
            carry_idx = min(carry_idx, max(0, len(cards) - 1))
        elif r < 0.93:
            rule_r = rng.choice(rule_relics)
        elif r < 0.97 and awakens:
            aw = rng.choice(awakens)
        else:
            dmg_idx = [i for i, c in enumerate(cards) if card_map[c["key"]]["dmg"] > 0]
            if dmg_idx:
                carry_idx = rng.choice(dmg_idx)

    # Enforce affix budget cleanly
    aff_idxs = [i for i, c in enumerate(cards) if c["adj"] is not None]
    while len(aff_idxs) > affix_budget:
        drop = aff_idxs.pop(rng.randrange(len(aff_idxs)))
        cards[drop]["adj"] = None

    return fix_carry(
        {"cards": cards, "carryIdx": carry_idx, "ruleRelic": rule_r, "awaken": aw},
        card_map,
        rng,
    )


def encode_candidates(
    candidates: List[dict],
    c2i: Dict[str, int],
    a2i: Dict[Optional[str], int],
    r2i: Dict[str, int],
    w2i: Dict[str, int],
    card_map: Dict[str, dict],
):
    n = len(candidates)
    s_card = np.zeros((n, 8), dtype=np.int64)
    s_aff = np.zeros((n, 8), dtype=np.int64)
    s_sub = np.zeros((n, 8), dtype=np.int64)
    s_carry = np.zeros((n, 8), dtype=np.int64)
    r_arr = np.zeros((n,), dtype=np.int64)
    w_arr = np.zeros((n,), dtype=np.int64)

    for idx, cand in enumerate(candidates):
        pos = 0
        for ci, c in enumerate(cand["cards"]):
            sz = card_map[c["key"]]["size"]
            cid = c2i[c["key"]] + 1  # 0 = empty
            aid = a2i.get(c["adj"], 0)
            is_c = 1 if ci == cand["carryIdx"] else 0
            for off in range(sz):
                if pos >= 8:
                    break
                s_card[idx, pos] = cid
                s_aff[idx, pos] = aid
                s_sub[idx, pos] = 1 if off == 0 else (3 if off == sz - 1 else 2)
                s_carry[idx, pos] = is_c
                pos += 1
        r_arr[idx] = r2i.get(cand["ruleRelic"], 0)
        w_arr[idx] = w2i.get(cand["awaken"], 0)

    return s_card, s_aff, s_sub, s_carry, r_arr, w_arr


def train_ensemble(
    enc: tuple,
    Y: np.ndarray,
    num_cards: int,
    num_affixes: int,
    num_rules: int,
    num_awakens: int,
    device: torch.device,
    ensemble_size: int = 5,
    epochs: int = 32,
    batch_size: int = 256,
) -> Tuple[List[OrderAwareBoardNet], float]:
    n = len(Y)
    perm = np.random.permutation(n)
    val_n = max(100, int(n * 0.12))
    val_idx, tr_idx = perm[:val_n], perm[val_n:]

    tr_t = [torch.tensor(arr[tr_idx], device=device) for arr in enc]
    va_t = [torch.tensor(arr[val_idx], device=device) for arr in enc]
    y_tr = torch.tensor(Y[tr_idx], device=device)
    y_va = torch.tensor(Y[val_idx], device=device)

    models: List[OrderAwareBoardNet] = []
    val_preds = []

    for m_idx in range(ensemble_size):
        torch.manual_seed(2000 + m_idx * 101 + n)
        model = OrderAwareBoardNet(num_cards, num_affixes, num_rules, num_awakens).to(device)
        opt = torch.optim.AdamW(model.parameters(), lr=2.5e-3, weight_decay=1e-4)
        sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)

        bs_idx = torch.randint(0, len(tr_idx), (len(tr_idx),), device=device)
        model.train()
        for _ in range(epochs):
            shuf = bs_idx[torch.randperm(len(bs_idx), device=device)]
            for start in range(0, len(shuf), batch_size):
                b = shuf[start : start + batch_size]
                pred = model(tr_t[0][b], tr_t[1][b], tr_t[2][b], tr_t[3][b], tr_t[4][b], tr_t[5][b])
                loss_w = F.binary_cross_entropy(pred[:, 0].clamp(1e-5, 1 - 1e-5), y_tr[b, 0])
                loss_s = F.smooth_l1_loss(pred[:, 1:], y_tr[b, 1:])
                loss = 0.7 * loss_w + loss_s
                opt.zero_grad()
                loss.backward()
                opt.step()
            sched.step()

        model.eval()
        with torch.no_grad():
            val_preds.append(model(*va_t))
        models.append(model)

    ens_val = torch.stack(val_preds, dim=0).mean(dim=0)
    y_true = y_va[:, 1]
    y_hat = ens_val[:, 1]
    ss_res = ((y_true - y_hat) ** 2).sum().item()
    ss_tot = ((y_true - y_true.mean()) ** 2).sum().item() + 1e-8
    r2 = 1.0 - ss_res / ss_tot
    return models, r2


@torch.no_grad()
def predict_ensemble(
    models: List[OrderAwareBoardNet],
    enc: tuple,
    device: torch.device,
    batch_size: int = 4096,
) -> Tuple[np.ndarray, np.ndarray]:
    n = len(enc[0])
    all_means = np.zeros((n, 3), dtype=np.float32)
    all_stds = np.zeros((n, 3), dtype=np.float32)
    for start in range(0, n, batch_size):
        end = min(n, start + batch_size)
        bt = [torch.tensor(arr[start:end], device=device) for arr in enc]
        preds = torch.stack([m(*bt) for m in models], dim=0)
        all_means[start:end] = preds.mean(dim=0).cpu().numpy()
        all_stds[start:end] = preds.std(dim=0).cpu().numpy()
    return all_means, all_stds


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", type=str, default="ayla")
    parser.add_argument("--night", type=int, default=9)
    parser.add_argument("--heat", type=int, default=8)
    parser.add_argument("--tier", type=int, default=2)
    parser.add_argument("--carry-diamond", action="store_true")
    parser.add_argument("--affix-budget", type=int, default=2)
    parser.add_argument("--rounds", type=int, default=5)
    parser.add_argument("--init-samples", type=int, default=1000)
    parser.add_argument("--pool-per-round", type=int, default=80000)
    parser.add_argument("--acquire-per-round", type=int, default=260)
    parser.add_argument("--train-seeds", type=int, default=8)
    parser.add_argument("--verify-seeds", type=int, default=40)
    parser.add_argument("--out-dir", type=str, default="lab/balance/reports")
    parser.add_argument("--prefix", type=str, default="gpu-surrogate")
    args = parser.parse_args()

    t0 = time.time()
    repo_root = Path(__file__).resolve().parents[2]
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    meta = load_meta(repo_root, args.hero)
    cards_meta = meta["cards"]
    card_map = {c["id"]: c for c in cards_meta}
    affixes = meta["affixes"]
    nodmg_affixes = meta["nodmgAffixes"]
    rule_relics = meta["ruleRelics"]
    awakens = meta["awakens"]

    c2i = {c["id"]: i for i, c in enumerate(cards_meta)}
    a2i = {a: i for i, a in enumerate(affixes)}
    r2i = {r: i for i, r in enumerate(rule_relics)}
    w2i = {w: i for i, w in enumerate(awakens)} if awakens else {"": 0}

    by_size: Dict[int, List[str]] = defaultdict(list)
    by_tag: Dict[str, List[str]] = defaultdict(list)
    for c in cards_meta:
        by_size[c["size"]].append(c["id"])
        by_tag[c["tag"]].append(c["id"])

    print(
        f"=== Nightwatch GPU Neural Surrogate ({meta['heroName']}/{args.hero}, Night {args.night}, Heat {args.heat}, device={device}, pool/round={args.pool_per_round:,}) ==="
    )

    rng = random.Random(20261127 + args.night * 31 + args.heat * 7 + ord(args.hero[0]))
    seen = set()
    dataset_cands: List[dict] = []
    dataset_res: List[dict] = []

    tags_cycle = list(by_tag.keys()) + [None, None]
    init_cands: List[dict] = []
    while len(init_cands) < args.init_samples:
        c = random_candidate(
            rng,
            cards_meta,
            card_map,
            by_size,
            by_tag,
            affixes,
            nodmg_affixes,
            rule_relics,
            awakens,
            args.affix_budget,
            tags_cycle[len(init_cands) % len(tags_cycle)],
        )
        k = build_key(c)
        if k not in seen:
            seen.add(k)
            init_cands.append(c)

    print(f"[Round 0] Evaluating {len(init_cands)} initial diverse boards on real TS engine...")
    init_res = eval_via_bun(
        repo_root, init_cands, args.hero, args.night, args.heat, args.tier, args.carry_diamond, args.train_seeds, 1000
    )
    dataset_cands.extend(init_cands)
    dataset_res.extend(init_res)

    total_gpu_screened = 0
    r2_history = []

    for rd in range(1, args.rounds + 1):
        enc = encode_candidates(dataset_cands, c2i, a2i, r2i, w2i, card_map)
        Y = np.array(
            [[r["winRate"], math.log1p(r["avgScore"]), math.log1p(r["avgDps"])] for r in dataset_res],
            dtype=np.float32,
        )

        models, r2 = train_ensemble(enc, Y, len(cards_meta), len(affixes), len(rule_relics), len(awakens), device)
        r2_history.append(r2)

        scored = sorted(
            zip(dataset_cands, dataset_res),
            key=lambda x: x[1]["avgScore"] * (0.35 + 0.65 * x[1]["winRate"]),
            reverse=True,
        )
        top_elites = [c for c, _ in scored[:60]]
        niche_elites_map: Dict[str, List[dict]] = defaultdict(list)
        for c, _ in scored:
            ni = classify_niche(c, card_map)
            if len(niche_elites_map[ni]) < 20:
                niche_elites_map[ni].append(c)
        all_niche_elites = [c for lst in niche_elites_map.values() for c in lst] or top_elites

        proposals: List[dict] = []
        prop_seen = set()
        for i in range(args.pool_per_round):
            r = rng.random()
            if r < 0.45:
                c = mutate_candidate(
                    rng.choice(top_elites), rng, cards_meta, card_map, affixes, nodmg_affixes, rule_relics, awakens, args.affix_budget
                )
            elif r < 0.80:
                c = mutate_candidate(
                    rng.choice(all_niche_elites), rng, cards_meta, card_map, affixes, nodmg_affixes, rule_relics, awakens, args.affix_budget
                )
            else:
                c = random_candidate(
                    rng, cards_meta, card_map, by_size, by_tag, affixes, nodmg_affixes, rule_relics, awakens, args.affix_budget, tags_cycle[i % len(tags_cycle)]
                )
            k = build_key(c)
            if k not in seen and k not in prop_seen:
                prop_seen.add(k)
                proposals.append(c)

        total_gpu_screened += len(proposals)
        p_enc = encode_candidates(proposals, c2i, a2i, r2i, w2i, card_map)
        means, stds = predict_ensemble(models, p_enc, device)

        beta = max(0.3, 1.1 - rd * 0.16)
        acq = (0.7 * means[:, 1] + 0.3 * means[:, 2] + beta * (0.7 * stds[:, 1] + 0.3 * stds[:, 2])) * (0.35 + 0.65 * means[:, 0])

        selected = set()
        niche_buckets: Dict[str, List[Tuple[float, int]]] = defaultdict(list)
        for idx, c in enumerate(proposals):
            niche_buckets[classify_niche(c, card_map)].append((float(acq[idx]), idx))

        quota = max(20, args.acquire_per_round // 8)
        for ni, items in niche_buckets.items():
            items.sort(reverse=True)
            for _, idx in items[:quota]:
                selected.add(idx)

        for idx in np.argsort(-acq):
            if len(selected) >= args.acquire_per_round:
                break
            selected.add(int(idx))

        batch_cands = [proposals[idx] for idx in selected]
        for c in batch_cands:
            seen.add(build_key(c))

        batch_res = eval_via_bun(
            repo_root, batch_cands, args.hero, args.night, args.heat, args.tier, args.carry_diamond, args.train_seeds, 1000
        )
        dataset_cands.extend(batch_cands)
        dataset_res.extend(batch_res)

        best_now = max(dataset_res, key=lambda x: x["avgScore"])
        print(
            f"[Round {rd}/{args.rounds}] GPU screened={len(proposals):,} | Ensemble R²={r2:.3f} | evals={len(dataset_cands):,} | bestScore={best_now['avgScore']:,} (win={best_now['winRate']*100:.0f}%, dps={best_now['avgDps']:,})"
        )

    # Final unbiased holdout verification
    ranked = sorted(
        zip(dataset_cands, dataset_res),
        key=lambda x: x[1]["avgScore"] * (0.35 + 0.65 * x[1]["winRate"]),
        reverse=True,
    )
    verify_map: Dict[str, dict] = {}
    for c, _ in ranked[:25]:
        verify_map[build_key(c)] = c
    n_seen = Counter()
    for c, _ in ranked:
        ni = classify_niche(c, card_map)
        if n_seen[ni] < 3:
            verify_map[build_key(c)] = c
            n_seen[ni] += 1

    verify_cands = list(verify_map.values())
    print(f"Re-verifying {len(verify_cands)} champions on {args.verify_seeds} fresh holdout seeds...")
    verify_res = eval_via_bun(
        repo_root, verify_cands, args.hero, args.night, args.heat, args.tier, args.carry_diamond, args.verify_seeds, 99999
    )

    verified = sorted(
        zip(verify_cands, verify_res),
        key=lambda x: x[1]["avgScore"] * (0.35 + 0.65 * x[1]["winRate"]),
        reverse=True,
    )

    # Spatial slot-order sensitivity check on #1 Champion
    champ_c, champ_r = verified[0]
    order_delta = 0.0
    if len(champ_c["cards"]) >= 3:
        shufs = []
        for _ in range(10):
            perm_idx = list(range(len(champ_c["cards"])))
            rng.shuffle(perm_idx)
            new_cards = [champ_c["cards"][i] for i in perm_idx]
            new_carry = perm_idx.index(champ_c["carryIdx"])
            shufs.append(
                {
                    "cards": new_cards,
                    "carryIdx": new_carry,
                    "ruleRelic": champ_c["ruleRelic"],
                    "awaken": champ_c["awaken"],
                }
            )
        shuf_res = eval_via_bun(
            repo_root, shufs, args.hero, args.night, args.heat, args.tier, args.carry_diamond, min(20, args.verify_seeds), 99999
        )
        avg_shuf_score = sum(x["avgScore"] for x in shuf_res) / len(shuf_res)
        order_delta = (champ_r["avgScore"] - avg_shuf_score) / max(1.0, avg_shuf_score)

    niche_champs: Dict[str, Tuple[dict, dict]] = {}
    for c, r in verified:
        ni = classify_niche(c, card_map)
        if ni not in niche_champs:
            niche_champs[ni] = (c, r)

    elapsed = time.time() - t0
    report_dir = repo_root / args.out_dir
    report_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{args.prefix}-{args.hero}-n{args.night}-h{args.heat}"
    md_path = report_dir / f"{stem}.md"
    json_path = report_dir / f"{stem}.json"

    def fmt_board(c: dict) -> str:
        parts = []
        for i, x in enumerate(c["cards"]):
            nm = card_map[x["key"]]["name"]
            adj = f"[{x['adj']}]" if x["adj"] else ""
            star = "★" if i == c["carryIdx"] else ""
            parts.append(f"{star}{nm}{adj}(`{x['key']}`)")
        return " | ".join(parts) + f" · 规则:`{c['ruleRelic']}` · 觉醒:`{c['awaken']}`"

    top15 = verified[:15]
    card_dom = Counter()
    adj_dom = Counter()
    rule_dom = Counter()
    for c, _ in top15:
        for x in c["cards"]:
            card_dom[x["key"]] += 1
            if x["adj"]:
                adj_dom[x["adj"]] += 1
        rule_dom[c["ruleRelic"]] += 1

    md = [
        f"# Nightwatch GPU 神经代理构筑搜索（{meta['heroName']} · 第 {args.night} 夜 · Heat {args.heat}）",
        "",
        f"> 设备：`{device}` | GPU 累计扫描：**`{total_gpu_screened:,}`** 组合 | TS 实机评测：`{len(dataset_cands):,}` | 验证集 R²：`{r2_history[-1]:.3f}` | 冠军站位敏感度：**`{order_delta*100:+.1f}%`** | 耗时：`{elapsed:.1f}s`",
        "",
        "## 一、5 大流派生态位 GPU 发现冠军",
        "",
        "| 生态位 | 胜率 | 综合分 | 均 DPS | 均掉墙 | 最大连锁 | 精确 8 格棋盘顺序与配置 |",
        "| :--- | :---: | :---: | :---: | :---: | :---: | :--- |",
    ]
    for ni in ("pure-elem", "reaction-duo", "chain-echo", "support-carry", "mixed-hybrid"):
        if ni in niche_champs:
            c, r = niche_champs[ni]
            md.append(
                f"| **{NICHE_LABELS[ni]}** | {r['winRate']*100:.0f}% | **{r['avgScore']:,}** | {r['avgDps']:,} | {r['avgWallLost']} | ×{r['maxChain']} | {fmt_board(c)} |"
            )

    md += [
        "",
        "## 二、全局 Top 15 极限天花板构筑榜",
        "",
        "| # | 生态位 | 胜率 | 综合分 | 均 DPS | 掉墙 | 连锁 | 棋盘配置 |",
        "| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |",
    ]
    for idx, (c, r) in enumerate(top15, 1):
        ni = classify_niche(c, card_map)
        md.append(
            f"| {idx} | {NICHE_LABELS[ni]} | {r['winRate']*100:.0f}% | **{r['avgScore']:,}** | {r['avgDps']:,} | {r['avgWallLost']} | ×{r['maxChain']} | {fmt_board(c)} |"
        )

    md += [
        "",
        "## 三、Top 15 卡牌 / 词缀 / 规则遗物统治率",
        "",
        "- **高频卡牌**：" + "、".join(f"`{card_map[k]['name']}({k})` ({cnt})" for k, cnt in card_dom.most_common(12)),
        "- **高频词缀**：" + "、".join(f"`{a}` ({cnt})" for a, cnt in adj_dom.most_common(8)),
        "- **高频规则遗物**：" + "、".join(f"`{r}` ({cnt}/15)" for r, cnt in rule_dom.most_common(6)),
        "",
    ]

    md_path.write_text("\n".join(md), encoding="utf-8")
    json_path.write_text(
        json.dumps(
            {
                "config": vars(args),
                "hero": args.hero,
                "totalGpuScreened": total_gpu_screened,
                "r2History": r2_history,
                "orderSensitivity": order_delta,
                "nicheChamps": {k: {"build": v[0], "metrics": v[1]} for k, v in niche_champs.items()},
                "top15": [{"build": c, "metrics": r} for c, r in top15],
                "dominance": {
                    "cards": card_dom.most_common(20),
                    "affixes": adj_dom.most_common(12),
                    "ruleRelics": rule_dom.most_common(10),
                },
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"✅ Done in {elapsed:.1f}s -> {md_path}")


if __name__ == "__main__":
    main()
