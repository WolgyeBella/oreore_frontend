import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as S from "./Login.styled";
import ROUTE_LINK from "../../routes/RouterLink";
import { FormContainer, InputField } from "components";
import Nav from "../../components/Nav/Nav.mock";
import useMockAuthStore from "../../stores/useMockAuthStore";
import { toast } from "react-toastify";

interface FormValues {
  username: string;
  password: string;
  email: string;
}

interface UserState {
  login: (email: string, password: string) => Promise<void>;
}

const LoginPage = () => {
  const methods = useForm<FormValues>();
  const navigate = useNavigate();

  const login = useMockAuthStore((state: UserState) => state.login as (email: string, password: string) => Promise<void>);

  const onSubmit = async (data: FormValues) => {
    await login(data.email, data.password);
    toast.success("✨로그인 성공 !");
    navigate(ROUTE_LINK.LIST.path);
  };
  return (
    <>
      <Nav />
      <S.Container>
        <FormContainer onSubmit={onSubmit} methods={methods}>
          <S.Logo>
            <S.LogoImage src="/logo.png" alt="오래오래 로고" />
            오래오래
          </S.Logo>
          <S.InputContainer>
            <InputField
              name="email"
              label="이메일"
              placeholder="아이디를 입력하세요."
            />
          </S.InputContainer>

          <S.InputContainer>
            <InputField
              name="password"
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력하세요."
            />
          </S.InputContainer>
          <S.SubmitButton type="submit">로그인</S.SubmitButton>
          <S.Footer>
            <S.FooterLink onClick={() => navigate(ROUTE_LINK.SIGNUP.path)}>
              회원가입
            </S.FooterLink>
          </S.Footer>
        </FormContainer>
      </S.Container>
    </>
  );
};

export default LoginPage;
