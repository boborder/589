import { useRef } from "hono/jsx/dom";
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import AvatarEditor, { type AvatarEditorRef } from "../../module/avatar-editor";

const scaleAtom = atom(1);
const imageAtom = atomWithStorage(
  "avatar",
  "https://gravatar.com/avatar/589?s=256&d=identicon",
);

export const Avatar = () => {
  const [scale, setScale] = useAtom(scaleAtom);
  const [image, setImage] = useAtom(imageAtom);

  const editorRef = useRef<AvatarEditorRef>(null);

  const openModal = () => {
    const modal = document.getElementById("avatar_modal") as HTMLDialogElement;
    modal.showModal();
  };

  const changeScale = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setScale(Number.parseFloat(target.value));
  };

  const handleImageUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files![0];
    const reader = new FileReader();
    reader.readAsDataURL(file!);
    reader.onloadend = (reader) => {
      setImage(reader.target?.result as string);
    };
  };

  const handleSaveAvatar = () => {
    const canvas = editorRef.current?.getImage();
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setImage(dataUrl);
      setScale(1);
      window.location.reload();
    }
  };

  const handleCancel = () => {
    setImage(image);
    setScale(1);
  };

  return (
    <>
      <img
        src={image}
        alt="avatar"
        width={256}
        height={256}
        className="avatar cursor-pointer"
        onMouseDown={openModal}
      />

      {/* アバター編集モーダル */}
      <dialog id="avatar_modal" className="modal modal-bottom sm:modal-middle">
        <form method="dialog" className="modal-backdrop w-full">
          <input type="submit" value="Close" />
        </form>
        <form
          method="dialog"
          className="modal-box flex flex-col items-center bg-base-100"
        >
          <button
            type="submit"
            className="btn btn-circle btn-ghost absolute right-4 top-3 w-8 h-8 text-2xl"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold">Edit Avatar</h2>

          <AvatarEditor
            ref={editorRef}
            image={image}
            width={250}
            height={250}
            border={2}
            color={[255, 255, 255, 0.6]} // RGBA
            scale={scale}
            rotate={0}
            borderRadius={125}
            className="my-3 mx-auto"
            crossOrigin="anonymous"
          />

          <input
            type="range"
            value={scale}
            min="0.5"
            max="2"
            step="0.02"
            onChange={changeScale}
            className="range range-primary w-4/5 my-3"
          />

          <input
            type="file"
            onChange={handleImageUpload}
            accept="image/*"
            className="w-4/5 my-3"
          />

          <button
            type="submit"
            onClick={handleSaveAvatar}
            className="btn btn-primary w-4/5 my-3"
          >
            Save Avatar
          </button>

          <button
            type="submit"
            onClick={handleCancel}
            className="btn btn-error w-4/5 my-3"
          >
            Cancel
          </button>
        </form>
      </dialog>
    </>
  );
};
