import { encode, encodeForSigning } from "ripple-binary-codec";
import { deriveKeypair, sign } from "ripple-keypairs";
import type {
  AccountInfoResponse,
  SubmitResponse,
  SubmittableTransaction,
  Transaction,
} from "xrpl";

type submitTransactionParams = {
  tx: SubmittableTransaction | Transaction;
  secret: string;
  endpoint?: string;
};

export const submitTransaction = async ({
  tx,
  secret,
  endpoint = "https://testnet.xrpl-labs.com",
}: submitTransactionParams) => {
  const { publicKey, privateKey } = deriveKeypair(secret);
  const url = endpoint;

  let tx_json = tx;

  const simulate = (await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      method: "simulate",
      params: [{ tx_json }],
    }),
    headers: { "Content-Type": "application/json" },
  }).then((res) => res.json())) as SubmitResponse;

  console.log("simulate", simulate.result?.tx_json);

  // simulateの結果でautofillされたtx_jsonを更新
  if (simulate.result?.tx_json) {
    tx_json = simulate.result.tx_json;
  }

  // 公開鍵を追加
  tx_json.SigningPubKey = publicKey;
  // 署名用にエンコード
  const tx_hex = encodeForSigning(tx_json);
  // 署名
  const signature = sign(tx_hex, privateKey);
  // 署名を追加
  tx_json.TxnSignature = signature;
  // 最終的なblobを生成
  const tx_blob = encode(tx_json);
  // blobを送信
  const submit = (await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      method: "submit",
      params: [{ tx_blob }],
    }),
    headers: { "Content-Type": "application/json" },
  }).then((res) => res.json())) as SubmitResponse;

  console.log("submit", submit);

  return submit;
};

export const getAccountInfo = async (
  account: string,
  endpoint = "https://testnet.xrpl-labs.com",
) => {
  const url = endpoint;
  const info = (await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      method: "account_info",
      params: [{ account }],
    }),
    headers: { "Content-Type": "application/json" },
  }).then((res) => res.json())) as AccountInfoResponse;
  return info;
};
