import { Link, useLocation, useNavigate } from "react-router-dom";
import ROUTE_LINK from "../../routes/RouterLink";
import useMockAuthStore from "../../stores/useMockAuthStore";

import { S } from "./Nav.style";

const Nav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated } = useMockAuthStore();

  const SignOut = () => {
    logout();
    navigate("/");
  };

  const goToMypage = () => {
    navigate("/users/my");
  };

  const goToCart = () => {
    navigate("/cart");
  };

  return (
    <S.Nav>
      <Link to={ROUTE_LINK.LIST.path}>
        <S.Logo>
          <S.LogoIcon />
          오래오래
        </S.Logo>
      </Link>
      {!isAuthenticated ? (
        <Link to={ROUTE_LINK.LOGIN.path}>
          <S.NavBtn>로그인</S.NavBtn>
        </Link>
      ) : (
        <S.UserBox>
          <S.UserIcon
            onClick={goToMypage}
            location={location.pathname}
          ></S.UserIcon>
          <S.CartIcon
            onClick={goToCart}
            location={location.pathname}
          ></S.CartIcon>
          <S.NavBtn onClick={SignOut}>로그아웃</S.NavBtn>
        </S.UserBox>
      )}
    </S.Nav>
  );
};

export default Nav;
