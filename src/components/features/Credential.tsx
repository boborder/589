import { useAtom } from "jotai";
import { acceptQuery, credentialQuery } from "../../module/query";
import { Collapse } from "../ui/Collapse";

export const Credential = () => {
  const [{ data: credential, mutate: credentialMutate }] =
    useAtom(credentialQuery);
  const [{ data: accept, mutate: acceptMutate }] = useAtom(acceptQuery);
  return (
    <>
      <button
        type="button"
        onClick={() => (credential ? acceptMutate() : credentialMutate())}
        className={`btn ${credential ? "btn-primary" : "btn-outline"} w-42`}
      >
        {credential ? "CredentialAccept" : "CredentialCreate"}
      </button>

      {(accept || credential) && (
        <Collapse
          title={accept ? "Accept" : "Credential"}
          content={accept ?? credential!}
        />
      )}
    </>
  );
};
