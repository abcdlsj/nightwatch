#!/usr/bin/env bash
# Nightwatch Colab High-RAM CPU & A100/L4 GPU Runner
# Uses official `google-colab-cli` with ADC auth (`colab --auth adc exec --timeout 0`).
# Automatically guarantees VM teardown on exit via trap (zero wasted CU).
#
# Usage:
#   ./lab/colab/run-job.sh audit          # High-RAM CPU: full 7-section balance audit
#   ./lab/colab/run-job.sh ascension      # High-RAM CPU: Heat 0..8 × 4 Personas × 5 Heroes sweep
#   ./lab/colab/run-job.sh gpu-surrogate  # A100/L4 GPU: Order-Aware 8-Slot Transformer search (all 5 heroes)
#   ./lab/colab/run-job.sh gpu-full       # A100/L4 GPU: audit + ascension + 5-hero GPU surrogate in one session!

set -euo pipefail

JOB="${1:-gpu-full}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SESSION_NAME="nightwatch-${JOB}-$(date +%m%d-%H%M)"
TMP_TAR="/tmp/${SESSION_NAME}.tar.gz"
TMP_PY="/tmp/${SESSION_NAME}-exec.py"
REMOTE_DIR="/content/nightwatch"

if ! command -v colab >/dev/null 2>&1; then
  echo "❌ 未检测到 google-colab-cli（命令名 colab）。请先安装并完成 ADC 授权："
  echo "   pipx install google-colab-cli"
  echo "   colab --auth adc whoami"
  exit 1
fi

cleanup() {
  echo ""
  echo "[Colab] 正在清理临时文件并关闭会话 ${SESSION_NAME}（确保停止计费）..."
  rm -f "${TMP_TAR}" "${TMP_PY}"
  colab --auth adc stop -s "${SESSION_NAME}" >/dev/null 2>&1 || true
  echo "[Colab] 会话已关闭。当前额度状态："
  colab --auth adc usage || true
}
trap cleanup EXIT

run_remote_sh() {
  local sh_body="$1"
  cat > "${TMP_PY}" <<PYEOF
import subprocess, sys, threading, time
script = r'''${sh_body}'''
proc = subprocess.Popen(["bash", "-lc", script], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
last_out = [time.monotonic()]
done = threading.Event()
def keepalive():
    while not done.wait(15):
        if time.monotonic() - last_out[0] >= 14:
            print("[keepalive] running...", flush=True)
            last_out[0] = time.monotonic()
t = threading.Thread(target=keepalive, daemon=True)
t.start()
for line in proc.stdout:
    last_out[0] = time.monotonic()
    print(line, end="", flush=True)
rc = proc.wait()
done.set()
if rc != 0:
    sys.exit(rc)
PYEOF
  local attempt=1
  while [ "${attempt}" -le 2 ]; do
    if colab --auth adc exec -s "${SESSION_NAME}" --timeout 0 -f "${TMP_PY}"; then
      return 0
    fi
    if [ "${attempt}" -lt 2 ]; then
      echo "⚠️ Colab WebSocket 瞬时断开，3 秒后自动重试一次..."
      sleep 3
    fi
    attempt=$((attempt + 1))
  done
  return 1
}

echo "[1/5] 打包核心规则、模拟引擎与 lab/ -> ${TMP_TAR}"
COPYFILE_DISABLE=1 tar --no-xattrs -czf "${TMP_TAR}" -C "${REPO_ROOT}" \
  package.json \
  tsconfig.json \
  src/core \
  src/data \
  src/game \
  src/sim \
  src/i18n \
  src/locales \
  src/platform/storage.ts \
  tests/balance/builds.ts \
  lab/balance

if [ "${JOB}" = "gpu-surrogate" ] || [ "${JOB}" = "gpu-full" ]; then
  GPU_CANDIDATES="${GPU_TYPE:-A100 L4 T4}"
  CREATED_GPU=""
  for g in ${GPU_CANDIDATES}; do
    echo "[2/5] 尝试创建 Colab ${g} GPU 会话：${SESSION_NAME}"
    if colab --auth adc new -s "${SESSION_NAME}" --gpu "${g}"; then
      CREATED_GPU="${g}"
      break
    fi
    echo "⚠️ ${g} 当前无空闲配额，自动回退下一档 GPU..."
    colab --auth adc stop -s "${SESSION_NAME}" >/dev/null 2>&1 || true
  done
  if [ -z "${CREATED_GPU}" ]; then
    echo "❌ 所有候选 GPU (${GPU_CANDIDATES}) 均暂无配额"
    exit 1
  fi
  echo "✅ 已成功分配 ${CREATED_GPU} GPU！"
else
  echo "[2/5] 创建 Colab High-RAM CPU 会话：${SESSION_NAME}"
  colab --auth adc new -s "${SESSION_NAME}" --high-mem
fi

echo "[3/5] 上传代码并在 VM 内安装 Bun"
colab --auth adc upload -s "${SESSION_NAME}" "${TMP_TAR}" "/content/job.tar.gz"
run_remote_sh "
set -e
mkdir -p ${REMOTE_DIR}
tar -xzf /content/job.tar.gz -C ${REMOTE_DIR}
if ! command -v bun >/dev/null 2>&1 && [ ! -x \"\$HOME/.bun/bin/bun\" ]; then
  curl -fsSL https://bun.sh/install | bash >/dev/null
fi
export PATH=\"\$HOME/.bun/bin:\$PATH\"
echo \"Bun: \$(bun --version) | CPUs: \$(nproc)\"
"

REPORT_PREFIX="${REPORT_PREFIX:-}"
HEROES="${HEROES:-ayla mo ying jun li}"
GPU_NIGHT="${GPU_NIGHT:-9}"
GPU_HEAT="${GPU_HEAT:-8}"
GPU_ROUNDS="${GPU_ROUNDS:-5}"
GPU_POOL="${GPU_POOL:-80000}"
GPU_INIT="${GPU_INIT:-}"
GPU_ACQUIRE="${GPU_ACQUIRE:-}"
GPU_TRAIN_SEEDS="${GPU_TRAIN_SEEDS:-}"
GPU_VERIFY_SEEDS="${GPU_VERIFY_SEEDS:-}"

echo "[4/5] 执行任务：${JOB}"
case "${JOB}" in
  audit)
    run_remote_sh "
set -e
export PATH=\"\$HOME/.bun/bin:\$PATH\"
cd ${REMOTE_DIR}
NCPU=\$(nproc)
W=\$(( NCPU > 2 ? NCPU : 4 ))
WORKERS=\${W} REPORT_PREFIX=${REPORT_PREFIX:-balance-audit} \
  AUDIT_RUNS=${AUDIT_RUNS:-150} PATH_RUNS=${PATH_RUNS:-80} KIT_RUNS=${KIT_RUNS:-60} BOSS_RUNS=${BOSS_RUNS:-50} CF_SEEDS=${CF_SEEDS:-60} \
  bun lab/balance/audit.ts
"
    mkdir -p "${REPO_ROOT}/lab/balance/reports"
    echo "[5/5] 回传平衡审计报告到 lab/balance/reports/"
    P="${REPORT_PREFIX:-balance-audit}"
    colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${P}.md" "${REPO_ROOT}/lab/balance/reports/${P}.md"
    colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${P}.json" "${REPO_ROOT}/lab/balance/reports/${P}.json"
    ;;

  ascension)
    run_remote_sh "
set -e
export PATH=\"\$HOME/.bun/bin:\$PATH\"
cd ${REMOTE_DIR}
NCPU=\$(nproc)
W=\$(( NCPU > 2 ? NCPU : 4 ))
WORKERS=\${W} REPORT_PREFIX=${REPORT_PREFIX:-ascension-sweep} SWEEP_RUNS=${SWEEP_RUNS:-100} \
  bun lab/balance/ascension-sweep.ts
"
    mkdir -p "${REPO_ROOT}/lab/balance/reports"
    echo "[5/5] 回传进阶难度扫频报告到 lab/balance/reports/"
    P="${REPORT_PREFIX:-ascension-sweep}"
    colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${P}.md" "${REPO_ROOT}/lab/balance/reports/${P}.md"
    colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${P}.json" "${REPO_ROOT}/lab/balance/reports/${P}.json"
    ;;

  gpu-surrogate)
    run_remote_sh "
set -e
export PATH=\"\$HOME/.bun/bin:\$PATH\"
cd ${REMOTE_DIR}
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
NCPU=\$(nproc)
W=\$(( NCPU > 2 ? NCPU : 4 ))
INIT_N=\${GPU_INIT:-\$(( NCPU >= 8 ? 900 : 500 ))}
ACQ_N=\${GPU_ACQUIRE:-\$(( NCPU >= 8 ? 260 : 180 ))}
TR_S=\${GPU_TRAIN_SEEDS:-\$(( NCPU >= 8 ? 8 : 5 ))}
VF_S=\${GPU_VERIFY_SEEDS:-\$(( NCPU >= 8 ? 36 : 24 ))}
for h in ${HEROES}; do
  WORKERS=\${W} python3 -u lab/balance/surrogate_search.py \
    --hero \${h} --night ${GPU_NIGHT} --heat ${GPU_HEAT} --tier 2 --carry-diamond \
    --rounds ${GPU_ROUNDS} --pool-per-round ${GPU_POOL} --acquire-per-round \${ACQ_N} \
    --init-samples \${INIT_N} --train-seeds \${TR_S} --verify-seeds \${VF_S} \
    --prefix ${REPORT_PREFIX:-gpu-surrogate}
done
"
    mkdir -p "${REPO_ROOT}/lab/balance/reports"
    echo "[5/5] 回传 GPU 神经代理构筑报告到 lab/balance/reports/"
    P="${REPORT_PREFIX:-gpu-surrogate}"
    for h in ${HEROES}; do
      colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${P}-${h}-n${GPU_NIGHT}-h${GPU_HEAT}.md" "${REPO_ROOT}/lab/balance/reports/${P}-${h}-n${GPU_NIGHT}-h${GPU_HEAT}.md"
      colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${P}-${h}-n${GPU_NIGHT}-h${GPU_HEAT}.json" "${REPO_ROOT}/lab/balance/reports/${P}-${h}-n${GPU_NIGHT}-h${GPU_HEAT}.json"
    done
    ;;

  gpu-full)
    run_remote_sh "
set -e
export PATH=\"\$HOME/.bun/bin:\$PATH\"
cd ${REMOTE_DIR}
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
NCPU=\$(nproc)
W=\$(( NCPU > 2 ? NCPU : 4 ))
echo \"=== Running Full Balance Lab Suite (CPUs=\${NCPU}, WORKERS=\${W}) ===\"
WORKERS=\${W} REPORT_PREFIX=${REPORT_PREFIX:+${REPORT_PREFIX}-}balance-audit \
  AUDIT_RUNS=${AUDIT_RUNS:-140} PATH_RUNS=${PATH_RUNS:-80} KIT_RUNS=${KIT_RUNS:-60} BOSS_RUNS=${BOSS_RUNS:-50} CF_SEEDS=${CF_SEEDS:-60} \
  bun lab/balance/audit.ts
WORKERS=\${W} REPORT_PREFIX=${REPORT_PREFIX:+${REPORT_PREFIX}-}ascension-sweep SWEEP_RUNS=${SWEEP_RUNS:-90} \
  bun lab/balance/ascension-sweep.ts
for h in ${HEROES}; do
  WORKERS=\${W} python3 -u lab/balance/surrogate_search.py \
    --hero \${h} --night ${GPU_NIGHT} --heat ${GPU_HEAT} --tier 2 --carry-diamond \
    --rounds ${GPU_ROUNDS} --pool-per-round ${GPU_POOL} --acquire-per-round 260 \
    --init-samples 900 --train-seeds 8 --verify-seeds 36 \
    --prefix ${REPORT_PREFIX:+${REPORT_PREFIX}-}gpu-surrogate
done
"
    mkdir -p "${REPO_ROOT}/lab/balance/reports"
    echo "[5/5] 回传全部 CPU + GPU 报告到 lab/balance/reports/"
    PFX="${REPORT_PREFIX:+${REPORT_PREFIX}-}"
    colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${PFX}balance-audit.md" "${REPO_ROOT}/lab/balance/reports/${PFX}balance-audit.md"
    colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${PFX}balance-audit.json" "${REPO_ROOT}/lab/balance/reports/${PFX}balance-audit.json"
    colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${PFX}ascension-sweep.md" "${REPO_ROOT}/lab/balance/reports/${PFX}ascension-sweep.md"
    colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${PFX}ascension-sweep.json" "${REPO_ROOT}/lab/balance/reports/${PFX}ascension-sweep.json"
    for h in ${HEROES}; do
      colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${PFX}gpu-surrogate-${h}-n${GPU_NIGHT}-h${GPU_HEAT}.md" "${REPO_ROOT}/lab/balance/reports/${PFX}gpu-surrogate-${h}-n${GPU_NIGHT}-h${GPU_HEAT}.md"
      colab --auth adc download -s "${SESSION_NAME}" "${REMOTE_DIR}/lab/balance/reports/${PFX}gpu-surrogate-${h}-n${GPU_NIGHT}-h${GPU_HEAT}.json" "${REPO_ROOT}/lab/balance/reports/${PFX}gpu-surrogate-${h}-n${GPU_NIGHT}-h${GPU_HEAT}.json"
    done
    ;;

  *)
    echo "❌ 未知任务类型: ${JOB}（支持 audit | ascension | gpu-surrogate | gpu-full）"
    exit 1
    ;;
esac

echo "✅ 任务 ${JOB} 全部完成并已回传到本地！"
