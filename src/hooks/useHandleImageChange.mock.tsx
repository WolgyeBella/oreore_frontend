import { useState, useRef } from "react";
import { toast } from "react-toastify";

const useHandleImageChange = (type: string) => {
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [hasFile, setHasFile] = useState<boolean>(false);

  const handleImageChange = () => {
    const files = imgInputRef.current?.files;

    if (!files || files.length === 0) {
      toast.error("이미지가 선택되지 않았습니다.");
      return;
    }

    const file = files[0];

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    // 이미지를 base64로 변환하여 localStorage에 저장 가능하도록 처리
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      setHasFile(true);
    };

    reader.onerror = () => {
      toast.error("이미지 읽기 중 오류가 발생했습니다.");
    };

    reader.readAsDataURL(file);
  };

  return {
    imgInputRef,
    preview,
    hasFile,
    handleImageChange,
  };
};

export default useHandleImageChange;

