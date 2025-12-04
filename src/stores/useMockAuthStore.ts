import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "react-toastify";

interface UserProfile {
  id?: string;
  nickname?: string;
  email?: string;
  name?: string;
  image?: string;
  phone?: string;
  postalCode?: string;
  basicAdd?: string;
  detailAdd?: string;
  profileImage?: File;
  password?: string;
}

interface UserState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    nickname: string;
    phone: string;
    postalCode: string;
    basicAdd: string;
    detailAdd: string;
  }) => Promise<void>;
  checkPassword: (password: string) => Promise<boolean>;
  updateUserProfile: (data: UserProfile, profileImage?: File) => Promise<void>;
}

// 목데이터에서 사용자 목록 가져오기
const getMockUsers = async (): Promise<UserProfile[]> => {
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
const getLocalUsers = (): UserProfile[] => {
  try {
    const localUsers = localStorage.getItem("localUsers");
    return localUsers ? JSON.parse(localUsers) : [];
  } catch (error) {
    console.error("Failed to load local users:", error);
    return [];
  }
};

// 모든 사용자 목록 가져오기 (목데이터 + localStorage)
const getAllUsers = async (): Promise<UserProfile[]> => {
  const mockUsers = await getMockUsers();
  const localUsers = getLocalUsers();
  return [...mockUsers, ...localUsers];
};

const useMockAuthStore = create<UserState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: async (email: string, password: string) => {
        try {
          const allUsers = await getAllUsers();
          const user = allUsers.find(
            (u: UserProfile) => u.email === email && u.password === password,
          );

          if (!user) {
            throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
          }

          // 비밀번호는 제외하고 사용자 정보 저장

          set({
            isAuthenticated: true,
            user: {
              id: user.id,
              nickname: user.nickname,
              email: user.email,
              name: user.name,
              image: user.image || "",
              phone: user.phone,
              postalCode: user.postalCode || "",
              basicAdd: user.basicAdd || "",
              detailAdd: user.detailAdd || "",
            },
          });

          console.log("로그인 성공:", user);
        } catch (error) {
          console.error("Login failed:", error);
          throw error;
        }
      },

      logout: () => {
        set({ isAuthenticated: false, user: null });
        localStorage.removeItem("token");
        localStorage.removeItem("mock-auth-storage");
        localStorage.removeItem("products");
        localStorage.removeItem("orderInfo");
        toast.info("로그아웃 되었습니다 !");
      },

      register: async (userData) => {
        try {
          const allUsers = await getAllUsers();

          // 이메일 중복 확인
          const emailExists = allUsers.some((u) => u.email === userData.email);
          if (emailExists) {
            throw new Error("이미 사용 중인 이메일입니다.");
          }

          // 닉네임 중복 확인
          const nicknameExists = allUsers.some(
            (u) => u.nickname === userData.nickname,
          );
          if (nicknameExists) {
            throw new Error("이미 사용 중인 닉네임입니다.");
          }

          // 새 사용자 생성
          const newUser: UserProfile = {
            id: Date.now().toString(),
            email: userData.email,
            password: userData.password,
            name: userData.name,
            nickname: userData.nickname,
            phone: userData.phone,
            postalCode: userData.postalCode,
            basicAdd: userData.basicAdd,
            detailAdd: userData.detailAdd,
            image: "",
          };

          // localStorage에 저장
          const localUsers = getLocalUsers();
          localUsers.push(newUser);
          localStorage.setItem("localUsers", JSON.stringify(localUsers));

          console.log("회원가입 성공:", newUser);
        } catch (error) {
          console.error("Registration failed:", error);
          throw error;
        }
      },

      checkPassword: async (password: string): Promise<boolean> => {
        const state = useMockAuthStore.getState();
        if (!state.user) {
          return false;
        }

        // 모든 사용자 목록에서 현재 사용자의 비밀번호 확인
        const allUsers = await getAllUsers();
        const currentUser = allUsers.find((u) => u.id === state.user?.id);

        if (!currentUser) {
          return false;
        }

        return currentUser.password === password;
      },

      updateUserProfile: async (data: UserProfile) => {
        try {
          const state = useMockAuthStore.getState();
          if (!state.user) {
            throw new Error("로그인이 필요합니다.");
          }

          // localStorage에서 사용자 정보 업데이트
          const localUsers = getLocalUsers();
          const userIndex = localUsers.findIndex(
            (u) => u.id === state.user?.id,
          );

          if (userIndex !== -1) {
            localUsers[userIndex] = {
              ...localUsers[userIndex],
              ...data,
            };
            localStorage.setItem("localUsers", JSON.stringify(localUsers));
          }

          // 목데이터 사용자인 경우에도 localStorage에 저장
          if (userIndex === -1) {
            const allUsers = await getAllUsers();
            const mockUserIndex = allUsers.findIndex(
              (u) => u.id === state.user?.id,
            );
            if (mockUserIndex !== -1) {
              const updatedUser = {
                ...allUsers[mockUserIndex],
                ...data,
              };
              localUsers.push(updatedUser);
              localStorage.setItem("localUsers", JSON.stringify(localUsers));
            }
          }

          set((state) => {
            const newUser = {
              ...state.user,
              ...data,
            };

            const authStorage = JSON.parse(
              localStorage.getItem("mock-auth-storage") || "{}",
            );
            if (authStorage.state) {
              authStorage.state.user = newUser;
              localStorage.setItem(
                "mock-auth-storage",
                JSON.stringify(authStorage),
              );
            }

            return { user: newUser };
          });

          console.log("회원 정보 수정 성공:", data);
        } catch (error) {
          console.error("Update user profile failed:", error);
          throw error;
        }
      },
    }),
    { name: "mock-auth-storage" },
  ),
);

export default useMockAuthStore;
