import { hc } from "hono/client";
import type { AppType } from "../../index";
import { Turnstile } from "../../module/turnstile";

const rpc = hc<AppType>("/");

export const Challenge = () => {
  const verify = (token: string) => {
    const formData = new FormData();
    formData.append("token", token);
    rpc.api.verify
      .$post({ body: formData })
      .then(async (res) => await res.json())
      .then((data) => {
        if (!data.success) {
          throw new Error("Invalid token");
        }
        console.log("token verified");
      });
  };
  return (
    <Turnstile
      siteKey="0x4AAAAAAAei5dXpFGHt6PLt"
      onSuccess={(token) => {
        verify(token);
      }}
    />
  );
};
