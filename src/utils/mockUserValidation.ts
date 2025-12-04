// 목데이터에서 사용자 목록 가져오기
const getMockUsers = async () => {
  try {
    const response = await fetch("/data/mockUsers.json");
    const users = await response.json();
    return users;
  } catch (error) {
    console.error("Failed to load mock users:", error);
    return [];
  }
};

// localStorage에서 사용자 목록 가져오기 (회원가입으로 추가된 사용자 포함)
const getLocalUsers = () => {
  try {
    const localUsers = localStorage.getItem("localUsers");
    return localUsers ? JSON.parse(localUsers) : [];
  } catch (error) {
    console.error("Failed to load local users:", error);
    return [];
  }
};

// 모든 사용자 목록 가져오기 (목데이터 + localStorage)
const getAllUsers = async () => {
  const mockUsers = await getMockUsers();
  const localUsers = getLocalUsers();
  return [...mockUsers, ...localUsers];
};

// 이메일 중복 확인
export const checkEmailAvailability = async (
  email: string,
): Promise<boolean> => {
  try {
    const allUsers = await getAllUsers();
    const emailExists = allUsers.some((user) => user.email === email);
    return !emailExists;
  } catch (error) {
    console.error("Error checking email availability:", error);
    return false;
  }
};

// 닉네임 중복 확인
export const checkNicknameAvailability = async (
  nickname: string,
): Promise<boolean> => {
  try {
    const allUsers = await getAllUsers();
    const nicknameExists = allUsers.some((user) => user.nickname === nickname);
    return !nicknameExists;
  } catch (error) {
    console.error("Error checking nickname availability:", error);
    return false;
  }
};
