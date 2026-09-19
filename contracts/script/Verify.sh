#!/usr/bin/env bash
set -e

# ProofOfHustle Multi-Explorer Verification Script via Devnads API
# Verifies across MonadVision, Socialscan, and Monadscan with a single call.

CHAIN_ID=${1:-10143}
CONTRACT_ADDRESS=$2
CONTRACT_NAME=$3 # format: src/Contract.sol:ContractName

if [ -z "$CONTRACT_ADDRESS" ] || [ -z "$CONTRACT_NAME" ]; then
  echo "Usage: ./script/Verify.sh <chainId> <contractAddress> <contractPath:ContractName>"
  echo "Example: ./script/Verify.sh 10143 0x123... src/GigEscrow.sol:GigEscrow"
  exit 1
fi

BASE_NAME="${CONTRACT_NAME##*:}"
COMPILER_VERSION="v0.8.28+commit.7893614a"

echo "Generating standard JSON input for $CONTRACT_NAME ($CONTRACT_ADDRESS)..."
forge verify-contract "$CONTRACT_ADDRESS" "$CONTRACT_NAME" \
  --chain "$CHAIN_ID" \
  --show-standard-json-input > /tmp/standard-input.json

echo "Extracting compilation metadata..."
cat "out/$BASE_NAME.sol/$BASE_NAME.json" | jq '.metadata' > /tmp/metadata.json

cat > /tmp/verify.json << EOF
{
  "chainId": $CHAIN_ID,
  "contractAddress": "$CONTRACT_ADDRESS",
  "contractName": "$CONTRACT_NAME",
  "compilerVersion": "$COMPILER_VERSION",
  "standardJsonInput": $(cat /tmp/standard-input.json),
  "foundryMetadata": $(cat /tmp/metadata.json)
}
EOF

echo "Submitting verification request to Devnads API..."
curl -s -X POST https://agents.devnads.com/v1/verify \
  -H "Content-Type: application/json" \
  -d @/tmp/verify.json
echo ""
